const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const appIcon = require('./appIcon.cjs');
const { MpvController } = require('./mpvController.cjs');
const { PlayerWindowManager } = require('./playerWindows.cjs');
const { searchVideos, getCategoryFeed } = require('./youtubeApi.cjs');
const { DownloadManager } = require('./downloadManager.cjs');

const isDev = !app.isPackaged;

let mainWindow = null;
let playerManager = null;
const mpv = new MpvController();
let downloadManager = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    icon: appIcon.loadWindowIcon() || appIcon.getIconPath(),
  });

  const preloadPath = path.join(__dirname, 'preload.cjs');
  const indexHtmlPath = path.join(__dirname, '../dist/index.html');
  playerManager = new PlayerWindowManager(mainWindow, { isDev, preloadPath, indexHtmlPath });
  downloadManager = new DownloadManager(() => (mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null));

  mpv.onStateChange = (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('player-state', state);
    }
    if (playerManager?.playerWindow && !playerManager.playerWindow.isDestroyed()) {
      playerManager.playerWindow.webContents.send('player-state', state);
    }
  };

  mainWindow.on('move', () => {
    if (playerManager?.isOpen() && playerManager.targetBounds) {
      playerManager.setBounds(playerManager.targetBounds);
    }
  });

  mainWindow.on('resize', () => {
    if (playerManager?.isOpen() && playerManager.targetBounds) {
      playerManager.setBounds(playerManager.targetBounds);
    }
  });

  mainWindow.on('minimize', () => {
    if (playerManager?.isOpen()) {
      playerManager.hide();
    }
  });

  mainWindow.on('restore', () => {
    if (playerManager?.isOpen()) {
      playerManager.show();
      if (playerManager.targetBounds) {
        playerManager.setBounds(playerManager.targetBounds);
      }
    }
  });

  mainWindow.on('closed', () => {
    mpv.close();
    if (playerManager) playerManager.close();
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  mpv.close();
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Search & Feeds
ipcMain.handle('search-videos', async (_event, query, limit) => {
  return searchVideos(query, limit);
});

ipcMain.handle('get-category-feed', async (_event, category, limit) => {
  return getCategoryFeed(category, limit);
});

// Playback
ipcMain.handle('player-start', async (_event, params) => {
  const { url, quality, startTime, volume, bounds, isOffline } = params || {};
  if (!url) return { ok: false, error: 'No URL provided' };

  if (bounds && playerManager) {
    playerManager.targetBounds = bounds;
  }

  const hwnd = playerManager.getNativeHandle();
  if (bounds && playerManager) {
    playerManager.setBounds(bounds);
    playerManager.show();
  }

  await mpv.start(hwnd, url, { quality, startTime, volume, isOffline });
  return { ok: true };
});

ipcMain.handle('player-sync-bounds', async (_event, bounds) => {
  if (playerManager?.isOpen() && bounds) {
    playerManager.targetBounds = bounds;
    playerManager.setBounds(bounds);
  }
  return { ok: true };
});

ipcMain.handle('player-stop', async () => {
  await mpv.close();
  if (playerManager) playerManager.close();
  return { ok: true };
});

ipcMain.handle('player-play', async () => {
  await mpv.play();
  return { ok: true };
});

ipcMain.handle('player-pause', async () => {
  await mpv.pause();
  return { ok: true };
});

ipcMain.handle('player-toggle-play', async () => {
  await mpv.togglePlay();
  return { ok: true };
});

ipcMain.handle('player-seek', async (_event, seconds) => {
  await mpv.seek(seconds);
  return { ok: true };
});

ipcMain.handle('player-set-volume', async (_event, volume) => {
  await mpv.setVolume(volume);
  return { ok: true };
});

ipcMain.handle('player-set-mute', async (_event, muted) => {
  await mpv.setMute(muted);
  return { ok: true };
});

ipcMain.handle('player-set-quality', async (_event, quality) => {
  await mpv.setQuality(quality);
  return { ok: true };
});

ipcMain.handle('player-set-speed', async (_event, speed) => {
  await mpv.setSpeed(speed);
  return { ok: true };
});

ipcMain.handle('player-set-fullscreen', async (_event, fullscreen) => {
  if (playerManager) {
    playerManager.setFullScreen(fullscreen);
  }
  return { ok: true };
});

ipcMain.handle('player-next', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('player-next');
  }
  return { ok: true };
});

// Downloads
ipcMain.handle('download-start', async (_event, video, quality) => {
  if (!downloadManager) return { ok: false, error: 'Download manager not initialized' };
  return downloadManager.startDownload(video, quality);
});

ipcMain.handle('download-cancel', async (_event, videoId) => {
  if (!downloadManager) return false;
  return downloadManager.cancelDownload(videoId);
});

ipcMain.handle('download-delete', async (_event, videoId) => {
  if (!downloadManager) return false;
  return downloadManager.deleteDownload(videoId);
});

ipcMain.handle('download-get-saved', async () => {
  if (!downloadManager) return [];
  return downloadManager.getSavedList();
});
