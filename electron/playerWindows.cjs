const { BrowserWindow } = require('electron');
const path = require('path');

class PlayerWindowManager {
  constructor(mainWindow, { isDev, preloadPath, indexHtmlPath }) {
    this.mainWindow = mainWindow;
    this.isDev = isDev;
    this.preloadPath = preloadPath;
    this.indexHtmlPath = indexHtmlPath;
    this.playerWindow = null;
    this.targetBounds = null;
    this.isFullscreen = false;
  }

  isOpen() {
    return Boolean(this.playerWindow && !this.playerWindow.isDestroyed());
  }

  getNativeHandle() {
    if (!this.isOpen()) {
      this.createWindow();
    }
    const handle = this.playerWindow.getNativeWindowHandle();
    return handle.length >= 8
      ? handle.readBigInt64LE(0).toString()
      : String(handle.readInt32LE(0));
  }

  createWindow(initialBounds) {
    if (this.isOpen()) {
      return this.playerWindow;
    }

    const HEADER_HEIGHT = 56;
    const contentBounds = this.mainWindow.getContentBounds();
    const bounds = initialBounds || this.targetBounds || {
      x: 24,
      y: 72,
      width: Math.round(contentBounds.width * 0.65),
      height: Math.round(contentBounds.width * 0.65 * (9 / 16)),
    };

    const clampedY = Math.max(HEADER_HEIGHT, bounds.y);
    const targetX = Math.round(contentBounds.x + bounds.x);
    const targetY = Math.round(contentBounds.y + clampedY);
    const targetWidth = Math.max(Math.round(bounds.width), 10);
    const targetHeight = Math.max(Math.round(bounds.height), 10);

    this.playerWindow = new BrowserWindow({
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      parent: this.mainWindow,
      modal: false,
      skipTaskbar: true,
      focusable: true,
      show: false,
      webPreferences: {
        preload: this.preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    this.playerWindow.on('page-title-updated', (e) => e.preventDefault());

    if (this.isDev) {
      this.playerWindow.loadURL('http://localhost:5173/?player=1');
    } else {
      this.playerWindow.loadFile(this.indexHtmlPath, { query: { player: '1' } });
    }

    this.playerWindow.once('ready-to-show', () => {
      if (this.isOpen()) {
        this.playerWindow.show();
      }
    });

    this.playerWindow.on('enter-full-screen', () => {
      this.isFullscreen = true;
      this.playerWindow?.webContents.send('player-fullscreen-change', true);
      this.mainWindow?.webContents.send('player-fullscreen-change', true);
    });

    this.playerWindow.on('leave-full-screen', () => {
      this.isFullscreen = false;
      this.playerWindow?.webContents.send('player-fullscreen-change', false);
      this.mainWindow?.webContents.send('player-fullscreen-change', false);
      if (this.targetBounds) {
        this.setBounds(this.targetBounds);
      }
    });

    this.playerWindow.on('closed', () => {
      this.playerWindow = null;
    });

    return this.playerWindow;
  }

  show() {
    if (this.isOpen()) {
      this.playerWindow.show();
    }
  }

  hide() {
    if (this.isOpen()) {
      this.playerWindow.hide();
    }
  }

  setBounds(rect) {
    if (!rect || !this.isOpen() || this.isFullscreen) return;
    this.targetBounds = rect;

    const HEADER_HEIGHT = 56;
    const contentBounds = this.mainWindow.getContentBounds();
    const clampedY = Math.max(HEADER_HEIGHT, rect.y);
    const targetX = Math.round(contentBounds.x + rect.x);
    const targetY = Math.round(contentBounds.y + clampedY);
    const targetWidth = Math.max(Math.round(rect.width), 10);
    const targetHeight = Math.max(
      Math.round(rect.height || (targetWidth * 9) / 16),
      Math.round((targetWidth * 9) / 16)
    );

    if (targetHeight <= 0 || targetWidth <= 0) {
      if (this.playerWindow.isVisible()) {
        this.playerWindow.hide();
      }
      return;
    }

    if (!this.playerWindow.isVisible()) {
      this.playerWindow.show();
    }

    this.playerWindow.setBounds({
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
    });
  }

  setFullScreen(fullscreen) {
    if (!this.isOpen() || this.mainWindow.isDestroyed()) return;
    this.isFullscreen = Boolean(fullscreen);
    this.mainWindow.setFullScreen(this.isFullscreen);
    this.playerWindow.setFullScreen(this.isFullscreen);

    if (!this.isFullscreen && this.targetBounds) {
      this.setBounds(this.targetBounds);
    }
  }

  close() {
    this.targetBounds = null;
    this.isFullscreen = false;
    if (this.isOpen()) {
      this.playerWindow.destroy();
      this.playerWindow = null;
    }
  }
}

module.exports = { PlayerWindowManager };
