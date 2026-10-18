const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kudtubeAPI', {
  // Search & Feeds
  searchVideos: (query, limit) => ipcRenderer.invoke('search-videos', query, limit),
  getCategoryFeed: (category, limit) => ipcRenderer.invoke('get-category-feed', category, limit),

  // Playback
  startPlayer: (params) => ipcRenderer.invoke('player-start', params),
  syncPlayerBounds: (bounds) => ipcRenderer.invoke('player-sync-bounds', bounds),
  setPlayerVisible: (visible) => ipcRenderer.invoke('player-set-visible', visible),
  stopPlayer: () => ipcRenderer.invoke('player-stop'),
  playerPlay: () => ipcRenderer.invoke('player-play'),
  playerPause: () => ipcRenderer.invoke('player-pause'),
  playerTogglePlay: () => ipcRenderer.invoke('player-toggle-play'),
  playerSeek: (seconds) => ipcRenderer.invoke('player-seek', seconds),
  playerSetVolume: (volume) => ipcRenderer.invoke('player-set-volume', volume),
  playerSetMute: (muted) => ipcRenderer.invoke('player-set-mute', muted),
  playerSetQuality: (quality) => ipcRenderer.invoke('player-set-quality', quality),
  playerSetSpeed: (speed) => ipcRenderer.invoke('player-set-speed', speed),
  playerSetFullscreen: (fullscreen) => ipcRenderer.invoke('player-set-fullscreen', fullscreen),
  playerNext: () => ipcRenderer.invoke('player-next'),
  onPlayerNext: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('player-next', handler);
    return () => ipcRenderer.removeListener('player-next', handler);
  },
  onPlayerFullscreenChange: (callback) => {
    const handler = (_event, fs) => callback(fs);
    ipcRenderer.on('player-fullscreen-change', handler);
    return () => ipcRenderer.removeListener('player-fullscreen-change', handler);
  },
  onPlayerState: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('player-state', handler);
    return () => ipcRenderer.removeListener('player-state', handler);
  },

  // Downloads
  startDownload: (video, quality) => ipcRenderer.invoke('download-start', video, quality),
  cancelDownload: (videoId) => ipcRenderer.invoke('download-cancel', videoId),
  deleteDownload: (videoId) => ipcRenderer.invoke('download-delete', videoId),
  getSavedDownloads: () => ipcRenderer.invoke('download-get-saved'),
  onDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },

  // Window Controls & Platform
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});
