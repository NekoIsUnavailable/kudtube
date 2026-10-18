const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function getYtDlpPath() {
  if (app && app.isPackaged) {
    const pkg = path.join(process.resourcesPath, 'mpv', 'yt-dlp.exe');
    if (fs.existsSync(pkg)) return pkg;
  }
  const local = path.join(__dirname, 'bin', 'mpv', 'yt-dlp.exe');
  if (fs.existsSync(local)) return local;
  return 'yt-dlp';
}

function normalizeEntry(entry) {
  if (!entry) return null;
  let thumb = null;
  if (Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0) {
    const sorted = [...entry.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    thumb = sorted[0]?.url || null;
  } else if (entry.id) {
    thumb = `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
  }

  const videoId = entry.id || null;
  const videoUrl = entry.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);

  return {
    id: videoId,
    url: videoUrl,
    title: entry.title || 'Untitled Video',
    channel: entry.channel || entry.uploader || 'YouTube',
    channelId: entry.channel_id || entry.uploader_id || null,
    duration: typeof entry.duration === 'number' ? entry.duration : 0,
    thumbnail: thumb,
    viewCount: typeof entry.view_count === 'number' ? entry.view_count : null,
    uploadDate: entry.upload_date || null,
    description: entry.description || '',
  };
}

/**
 * Searches YouTube videos or playlists.
 */
function searchVideos(query, limit = 24) {
  return new Promise((resolve) => {
    const q = (query || '').trim();
    if (!q) {
      return resolve({ ok: true, results: [] });
    }

    const ytDlp = getYtDlpPath();
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(q);
    const count = Math.min(Math.max(limit, 1), 50);
    const target = isUrl ? q : `ytsearch${count}:${q}`;

    const args = [
      target,
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--skip-download',
    ];

    const child = spawn(ytDlp, args, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      console.error('[youtubeApi] spawn error:', err);
      resolve({ ok: false, error: err.message, results: [] });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.warn('[youtubeApi] yt-dlp error code', code, stderr);
        return resolve({ ok: false, error: stderr.trim() || `yt-dlp failed (code ${code})`, results: [] });
      }

      try {
        const data = JSON.parse(stdout);
        const rawEntries = Array.isArray(data.entries) ? data.entries : [data];

        const results = rawEntries
          .map(normalizeEntry)
          .filter((item) => item && item.id && item.url);

        resolve({
          ok: true,
          title: data.title || null,
          results,
        });
      } catch (err) {
        console.error('[youtubeApi] parse error:', err);
        resolve({ ok: false, error: 'Failed to parse YouTube results', results: [] });
      }
    });
  });
}

/**
 * Fetches feed for categories like Trending, Music, Gaming.
 */
function getCategoryFeed(category = 'trending', limit = 24) {
  const queries = {
    trending: 'trending videos this week',
    music: 'popular music videos hits 2026',
    gaming: 'popular gameplay highlights walkthrough',
    trailers: 'official movie trailers 2026',
    podcasts: 'popular podcasts full episodes',
    news: 'world news highlights today',
  };
  const q = queries[category.toLowerCase()] || queries.trending;
  return searchVideos(q, limit);
}

module.exports = {
  searchVideos,
  getCategoryFeed,
  getYtDlpPath,
};
