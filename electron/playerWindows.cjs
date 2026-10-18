const { BrowserWindow } = require('electron');

class PlayerWindowManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.playerWindow = null;
    this.targetBounds = null;
    this.isAttached = false;
  }

  getNativeHandle() {
    if (!this.playerWindow || this.playerWindow.isDestroyed()) {
      this.createWindow();
    }
    return this.playerWindow.getNativeWindowHandle().readInt32LE(0);
  }

  createWindow() {
    if (this.playerWindow && !this.playerWindow.isDestroyed()) {
      return this.playerWindow;
    }

    const mainBounds = this.mainWindow.getBounds();

    this.playerWindow = new BrowserWindow({
      width: Math.round(mainBounds.width * 0.7),
      height: Math.round(mainBounds.height * 0.6),
      x: mainBounds.x + 20,
      y: mainBounds.y + 60,
      show: false,
      frame: false,
      parent: this.mainWindow,
      backgroundColor: '#000000',
      focusable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.playerWindow.on('closed', () => {
      this.playerWindow = null;
    });

    return this.playerWindow;
  }

  show() {
    if (this.playerWindow && !this.playerWindow.isDestroyed()) {
      this.playerWindow.show();
    }
  }

  hide() {
    if (this.playerWindow && !this.playerWindow.isDestroyed()) {
      this.playerWindow.hide();
    }
  }

  setBounds(rect) {
    if (!this.playerWindow || this.playerWindow.isDestroyed() || !this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    // rect is in mainWindow content coordinates { x, y, width, height }
    const [mainX, mainY] = this.mainWindow.getPosition();
    const targetX = Math.round(mainX + rect.x);
    const targetY = Math.round(mainY + rect.y);
    const targetWidth = Math.max(Math.round(rect.width), 10);
    const targetHeight = Math.max(Math.round(rect.height), 10);

    this.playerWindow.setBounds({
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
    });

    if (!this.playerWindow.isVisible()) {
      this.playerWindow.show();
    }
  }

  setFullScreen(fullscreen) {
    if (this.playerWindow && !this.playerWindow.isDestroyed()) {
      this.playerWindow.setFullScreen(Boolean(fullscreen));
    }
  }

  close() {
    if (this.playerWindow && !this.playerWindow.isDestroyed()) {
      this.playerWindow.destroy();
      this.playerWindow = null;
    }
  }
}

module.exports = { PlayerWindowManager };
