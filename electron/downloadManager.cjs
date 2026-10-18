const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { getYtDlpPath } = require('./youtubeApi.cjs');

function getFfmpegPath() {
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, 'mpv', exeName)
    : path.join(__dirname, 'bin', 'mpv', exeName);
  if (fs.existsSync(bundled)) return bundled;
  const nodeFfmpeg = path.join(__dirname, '../node_modules/ffmpeg-static', exeName);
  if (fs.existsSync(nodeFfmpeg)) return nodeFfmpeg;
  return 'ffmpeg';
}

class DownloadManager {
  constructor(getWebContents) {
    this.getWebContents = getWebContents;
    this.downloadsFile = path.join(app.getPath('userData'), 'downloads.json');
    this.activeDownloads = new Map(); // id -> child process
    this.ensureDir(this.getDownloadDir());
  }

  getDownloadDir() {
    try {
      return path.join(app.getPath('videos'), 'KudTube');
    } catch {
      return path.join(app.getPath('downloads'), 'KudTube');
    }
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadDownloads() {
    try {
      if (fs.existsSync(this.downloadsFile)) {
        return JSON.parse(fs.readFileSync(this.downloadsFile, 'utf8'));
      }
    } catch (err) {
      console.error('[downloads] error loading registry:', err);
    }
    return [];
  }

  saveDownloads(list) {
    try {
      fs.writeFileSync(this.downloadsFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[downloads] error saving registry:', err);
    }
  }

  getSavedList() {
    const list = this.loadDownloads();
    // Validate that files still exist on disk
    return list.filter((item) => item.filePath && fs.existsSync(item.filePath));
  }

  startDownload(video, quality = '1080p') {
    return new Promise((resolve) => {
      const videoId = video.id;
      if (!videoId) return resolve({ ok: false, error: 'Missing video ID' });

      if (this.activeDownloads.has(videoId)) {
        return resolve({ ok: false, error: 'Video is already being downloaded' });
      }

      const outDir = this.getDownloadDir();
      this.ensureDir(outDir);

      const ytDlp = getYtDlpPath();
      const outputTemplate = path.join(outDir, '%(title)s [%(id)s].%(ext)s');

      let formatArg = 'bv*[height<=1080][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=1080]+ba/b[height<=1080]';
      const extraArgs = [];

      const ffmpegPath = getFfmpegPath();
      if (ffmpegPath) {
        extraArgs.push('--ffmpeg-location', ffmpegPath);
      }

      if (quality === '720p') {
        formatArg = 'bv*[height<=720][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=720]+ba/b[height<=720]';
      } else if (quality === '480p') {
        formatArg = 'bv*[height<=480][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=480]+ba/b[height<=480]';
      } else if (quality === '360p') {
        formatArg = 'bv*[height<=360][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=360]+ba/b[height<=360]';
      } else if (quality === 'audio' || quality === 'mp3') {
        extraArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
        formatArg = 'ba/b';
      }

      const args = [
        video.url || `https://www.youtube.com/watch?v=${videoId}`,
        '-f', formatArg,
        '-o', outputTemplate,
        '--no-playlist',
        '--newline',
        '--progress',
        ...extraArgs,
      ];

      const child = spawn(ytDlp, args, { windowsHide: true });
      this.activeDownloads.set(videoId, child);

      let savedFilePath = null;

      child.stdout.on('data', (data) => {
        const text = data.toString();

        // Check if destination file path is reported
        const destMatch = text.match(/\[download\] Destination:\s+(.+)/i) ||
                          text.match(/\[Merger\] Merging formats into "(.+)"/i) ||
                          text.match(/\[ExtractAudio\] Destination:\s+(.+)/i);
        if (destMatch && destMatch[1]) {
          savedFilePath = destMatch[1].trim();
        }

        // Parse progress line: [download]  45.2% of 85.34MiB at 4.25MiB/s ETA 00:11
        const progressMatch = text.match(/\[download\]\s+([\d\.]+)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i);
        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          const totalSize = progressMatch[2];
          const speed = progressMatch[3];
          const eta = progressMatch[4];

          const wc = this.getWebContents();
          if (wc && !wc.isDestroyed()) {
            wc.send('download-progress', {
              id: videoId,
              percent,
              totalSize,
              speed,
              eta,
              status: 'downloading',
            });
          }
        }
      });

      child.stderr.on('data', (d) => {
        console.warn(`[download:${videoId}]`, d.toString().trim());
      });

      child.on('error', (err) => {
        this.activeDownloads.delete(videoId);
        const wc = this.getWebContents();
        if (wc && !wc.isDestroyed()) {
          wc.send('download-progress', { id: videoId, status: 'error', error: err.message });
        }
        resolve({ ok: false, error: err.message });
      });

      child.on('close', (code) => {
        this.activeDownloads.delete(videoId);

        if (code !== 0) {
          const wc = this.getWebContents();
          if (wc && !wc.isDestroyed()) {
            wc.send('download-progress', { id: videoId, status: 'error', error: `Process exited with code ${code}` });
          }
          return resolve({ ok: false, error: `Download failed (code ${code})` });
        }

        // If savedFilePath wasn't caught directly, scan folder for matching videoId
        if (!savedFilePath || !fs.existsSync(savedFilePath)) {
          const files = fs.readdirSync(outDir);
          const isAudio = quality === 'audio' || quality === 'mp3';
          const found = isAudio
            ? (files.find((f) => f.includes(`[${videoId}]`) && (f.endsWith('.mp3') || f.endsWith('.m4a'))) || files.find((f) => f.includes(`[${videoId}]`)))
            : (files.find((f) => f.includes(`[${videoId}]`) && (f.endsWith('.mp4') || f.endsWith('.mkv'))) || files.find((f) => f.includes(`[${videoId}]`)));
          if (found) {
            savedFilePath = path.join(outDir, found);
          }
        }

        const stat = savedFilePath && fs.existsSync(savedFilePath) ? fs.statSync(savedFilePath) : null;
        const fileSize = stat ? stat.size : 0;

        const downloadItem = {
          id: videoId,
          title: video.title || 'Untitled',
          channel: video.channel || 'YouTube',
          duration: video.duration || 0,
          thumbnail: video.thumbnail || null,
          url: video.url,
          filePath: savedFilePath,
          fileSize,
          quality,
          isAudio: quality === 'audio' || quality === 'mp3',
          downloadedAt: Date.now(),
        };

        const list = this.loadDownloads().filter((i) => i.id !== videoId);
        list.unshift(downloadItem);
        this.saveDownloads(list);

        const wc = this.getWebContents();
        if (wc && !wc.isDestroyed()) {
          wc.send('download-progress', {
            id: videoId,
            percent: 100,
            status: 'completed',
            item: downloadItem,
          });
        }

        resolve({ ok: true, item: downloadItem });
      });
    });
  }

  cancelDownload(videoId) {
    const child = this.activeDownloads.get(videoId);
    if (child) {
      try {
        child.kill();
      } catch {}
      this.activeDownloads.delete(videoId);
      return true;
    }
    return false;
  }

  deleteDownload(videoId) {
    this.cancelDownload(videoId);
    const list = this.loadDownloads();
    const item = list.find((i) => i.id === videoId);
    if (item && item.filePath && fs.existsSync(item.filePath)) {
      try {
        fs.unlinkSync(item.filePath);
      } catch (err) {
        console.error('[downloads] error deleting file:', err);
      }
    }
    const filtered = list.filter((i) => i.id !== videoId);
    this.saveDownloads(filtered);
    return true;
  }
}

module.exports = { DownloadManager };
