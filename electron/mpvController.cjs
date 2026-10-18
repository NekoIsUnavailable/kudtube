const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const STATE_EMIT_INTERVAL_MS = 150;

const OBSERVED_PROPERTIES = [
  'time-pos',
  'duration',
  'pause',
  'volume',
  'mute',
  'speed',
  'paused-for-cache',
  'seeking',
  'eof-reached',
];

function getMpvExecutablePath() {
  const exeName = process.platform === 'win32' ? 'mpv.exe' : 'mpv';
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, 'mpv', exeName)
    : path.join(__dirname, 'bin', 'mpv', exeName);
  return fs.existsSync(bundled) ? bundled : 'mpv';
}

function getYtDlpExecutablePath() {
  const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, 'mpv', exeName)
    : path.join(__dirname, 'bin', 'mpv', exeName);
  return fs.existsSync(bundled) ? bundled : null;
}

function initialState() {
  return {
    timePos: 0,
    duration: 0,
    pause: false,
    volume: 100,
    mute: false,
    speed: 1,
    buffering: true,
    seeking: false,
    eof: false,
    loaded: false,
    error: null,
    quality: '1080p',
    isOffline: false,
  };
}

class MpvController {
  constructor() {
    this.process = null;
    this.socket = null;
    this.requestId = 0;
    this.pending = new Map();
    this.buffer = '';
    this.state = initialState();
    this.onStateChange = null;
    this.lastEmit = 0;
    this.emitTimer = null;
    this.expectingExit = false;
    this.currentHwnd = null;
    this.currentUrl = null;
    this.currentQuality = '1080p';
  }

  emit(immediate = false) {
    if (!this.onStateChange) return;
    const now = Date.now();
    const elapsed = now - this.lastEmit;

    if (immediate || elapsed >= STATE_EMIT_INTERVAL_MS) {
      if (this.emitTimer) {
        clearTimeout(this.emitTimer);
        this.emitTimer = null;
      }
      this.lastEmit = now;
      this.onStateChange({ ...this.state });
    } else if (!this.emitTimer) {
      this.emitTimer = setTimeout(() => {
        this.emitTimer = null;
        this.lastEmit = Date.now();
        if (this.onStateChange) this.onStateChange({ ...this.state });
      }, STATE_EMIT_INTERVAL_MS - elapsed);
    }
  }

  async start(hwnd, urlOrPath, options = {}) {
    await this.close();

    this.currentHwnd = hwnd;
    this.currentUrl = urlOrPath;
    this.currentQuality = options.quality || '1080p';
    this.state = initialState();
    this.state.volume = options.volume ?? 100;
    this.state.quality = this.currentQuality;
    this.expectingExit = false;

    const pipeName = process.platform === 'win32'
      ? `\\\\.\\pipe\\kudtube-mpv-${process.pid}-${Date.now()}`
      : path.join(app.getPath('temp'), `kudtube-mpv-${process.pid}-${Date.now()}.sock`);
    this.pipeName = pipeName;
    const isAudioOnly = Boolean(options.isAudio || options.quality === 'audio' || !hwnd);

    const args = [
      '--no-config',
      '--no-osc',
      '--no-osd-bar',
      '--osd-level=0',
      '--no-input-default-bindings',
      '--input-vo-keyboard=no',
      '--no-input-cursor',
      '--cursor-autohide=no',
      '--keep-open=yes',
      '--idle=yes',
      '--hr-seek=yes',
      '--cache=yes',
      '--demuxer-max-bytes=32MiB',
      '--demuxer-readahead-secs=20',
      '--vd-lavc-threads=0',
      '--vd-lavc-fast=yes',
      '--vd-lavc-skiploopfilter=nonkey',
      '--framedrop=vo',
      '--video-sync=audio',
      '--audio-buffer=0.2',
      '--sws-scaler=fast-bilinear',
      `--input-ipc-server=${pipeName}`,
      `--volume=${Math.round(options.volume ?? 100)}`,
    ];

    if (isAudioOnly) {
      args.push('--no-video');
      args.push('--force-window=no');
      args.push('--vo=null');
    } else {
      args.push(`--wid=${hwnd}`);
      args.push('--force-window=yes');
      args.push('--hwdec=auto-safe');
      if (process.platform === 'win32') {
        args.push('--vo=gpu,direct3d');
        args.push('--gpu-api=d3d11,opengl');
        args.push('--gpu-context=d3d11,win');
      } else if (process.platform === 'darwin') {
        args.push('--vo=gpu');
        args.push('--gpu-api=opengl');
      } else {
        args.push('--vo=gpu');
        args.push('--gpu-api=opengl');
        args.push('--gpu-context=x11,wayland');
      }
      args.push('--scale=bilinear');
      args.push('--cscale=bilinear');
      args.push('--dscale=bilinear');
      args.push('--background-color=#000000');
    }

    const isLocalFile = Boolean(options.isOffline || fs.existsSync(urlOrPath) || !urlOrPath.startsWith('http'));
    this.state.isOffline = isLocalFile;

    if (!isLocalFile) {
      const ytDlpPath = getYtDlpExecutablePath();
      if (ytDlpPath) {
        const normalizedYtDlp = ytDlpPath.replace(/\\/g, '/');
        args.push(`--script-opts=ytdl_hook-ytdl_path=${normalizedYtDlp}`);
      }

      // Set YouTube quality format - prioritize H.264 (avc1) for smooth decoding on low-spec CPUs (Atom N455 / GMA 3150)
      const qualityFormats = {
        '1080p': 'bestvideo[height<=1080][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
        '720p': 'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        '480p': 'bestvideo[height<=480][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best',
        '360p': 'bestvideo[height<=360][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=360]+bestaudio/best[height<=360]/best',
        'auto': 'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[height<=720]+bestaudio/best',
      };
      const format = qualityFormats[this.currentQuality] || qualityFormats['720p'];
      args.push(`--ytdl-format=${format}`);
    }

    if (options.startTime && options.startTime > 0 && !options.isLive) {
      args.push(`--start=${options.startTime.toFixed(2)}`);
    }

    args.push('--', urlOrPath);

    const mpvPath = getMpvExecutablePath();
    const child = spawn(mpvPath, args, { windowsHide: true, stdio: 'ignore' });
    this.process = child;

    child.on('error', (err) => {
      console.error('[mpv] spawn error:', err);
      this.state.error = `Could not start player: ${err.message}`;
      this.emit(true);
    });

    child.on('exit', (code) => {
      if (this.process === child) {
        this.process = null;
        this.socket = null;
        if (!this.expectingExit) {
          this.state.error = `Player closed (code ${code})`;
          this.emit(true);
        }
      }
    });

    await this.connect(pipeName, child);
  }

  async setQuality(quality) {
    if (!this.currentUrl || !this.currentHwnd) return;
    const currentTime = this.state.timePos || 0;
    const isPaused = this.state.pause;
    const volume = this.state.volume;

    await this.start(this.currentHwnd, this.currentUrl, {
      quality,
      startTime: currentTime,
      volume,
    });

    if (isPaused) {
      await this.pause();
    }
  }

  connect(pipeName, childProcess) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;

      const tryConnect = () => {
        if (!this.process || this.process !== childProcess) return resolve();

        const socket = net.createConnection(pipeName);

        socket.on('connect', () => {
          this.socket = socket;
          this.setupIpcListeners();
          this.observeProperties();
          resolve();
        });

        socket.on('error', () => {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error('[mpv] failed to connect to IPC pipe');
            resolve();
          } else {
            setTimeout(tryConnect, 100);
          }
        });
      };

      tryConnect();
    });
  }

  setupIpcListeners() {
    if (!this.socket) return;

    this.socket.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          this.handleIpcMessage(msg);
        } catch (err) {
          console.error('[mpv] failed to parse IPC JSON:', err);
        }
      }
    });

    this.socket.on('close', () => {
      this.socket = null;
    });
  }

  handleIpcMessage(msg) {
    if (msg.event === 'property-change') {
      const { name, data } = msg;
      switch (name) {
        case 'time-pos':
          if (typeof data === 'number') this.state.timePos = data;
          break;
        case 'duration':
          if (typeof data === 'number') this.state.duration = data;
          break;
        case 'pause':
          if (typeof data === 'boolean') this.state.pause = data;
          break;
        case 'volume':
          if (typeof data === 'number') this.state.volume = data;
          break;
        case 'mute':
          if (typeof data === 'boolean') this.state.mute = data;
          break;
        case 'speed':
          if (typeof data === 'number') this.state.speed = data;
          break;
        case 'paused-for-cache':
          if (typeof data === 'boolean') this.state.buffering = data;
          break;
        case 'seeking':
          if (typeof data === 'boolean') this.state.seeking = data;
          break;
        case 'eof-reached':
          if (typeof data === 'boolean') this.state.eof = data;
          break;
      }
      this.state.loaded = true;
      this.emit();
    } else if (msg.event === 'file-loaded') {
      this.state.loaded = true;
      this.state.buffering = false;
      this.emit(true);
    } else if (msg.request_id && this.pending.has(msg.request_id)) {
      const cb = this.pending.get(msg.request_id);
      this.pending.delete(msg.request_id);
      cb(msg);
    }
  }

  observeProperties() {
    for (let i = 0; i < OBSERVED_PROPERTIES.length; i++) {
      this.sendCommand(['observe_property', i + 1, OBSERVED_PROPERTIES[i]]);
    }
  }

  sendCommand(args) {
    if (!this.socket || this.socket.destroyed) {
      return Promise.resolve({ error: 'No connection to player' });
    }
    const id = ++this.requestId;
    const msg = JSON.stringify({ command: args, request_id: id }) + '\n';

    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.socket.write(msg, (err) => {
        if (err) {
          this.pending.delete(id);
          resolve({ error: err.message });
        }
      });
    });
  }

  async play() {
    return this.sendCommand(['set_property', 'pause', false]);
  }

  async pause() {
    return this.sendCommand(['set_property', 'pause', true]);
  }

  async togglePlay() {
    return this.sendCommand(['cycle', 'pause']);
  }

  async seek(seconds) {
    return this.sendCommand(['seek', seconds, 'absolute']);
  }

  async seekRelative(seconds) {
    return this.sendCommand(['seek', seconds, 'relative']);
  }

  async setVolume(volume) {
    const val = Math.min(Math.max(volume, 0), 100);
    return this.sendCommand(['set_property', 'volume', val]);
  }

  async setMute(muted) {
    return this.sendCommand(['set_property', 'mute', Boolean(muted)]);
  }

  async setSpeed(speed) {
    return this.sendCommand(['set_property', 'speed', speed]);
  }

  async close() {
    this.expectingExit = true;
    if (this.socket) {
      try {
        this.socket.write(JSON.stringify({ command: ['quit'] }) + '\n');
      } catch {}
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }
    if (process.platform !== 'win32' && this.pipeName && fs.existsSync(this.pipeName)) {
      try { fs.unlinkSync(this.pipeName); } catch {}
    }
    for (const resolve of this.pending.values()) {
      resolve({ error: 'Player closed' });
    }
    this.pending.clear();
    this.buffer = '';
    this.currentHwnd = null;
    this.currentUrl = null;
    this.state = initialState();
    this.emit(true);
  }
}

module.exports = { MpvController };
