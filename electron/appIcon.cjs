const { nativeImage } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const WINDOW_ICON_SIZE = 256;
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const SHORTCUT_NAME = 'KudTube';

function getIconPath() {
  const candidates = [
    path.join(process.resourcesPath ?? '', 'icons', 'icon.png'),
    path.join(__dirname, '..', 'build', 'icon.png'),
    path.join(__dirname, 'icons', 'icon.png'),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, '..', 'build', 'icon.png');
}

function loadImage() {
  const iconPath = getIconPath();
  if (!fs.existsSync(iconPath)) return null;

  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) {
    image = nativeImage.createFromBuffer(fs.readFileSync(iconPath));
  }
  return image.isEmpty() ? null : image;
}

function loadWindowIcon() {
  const image = loadImage();
  if (!image) return null;

  if (image.getSize().width > WINDOW_ICON_SIZE) {
    const resized = image.resize({
      width: WINDOW_ICON_SIZE,
      height: WINDOW_ICON_SIZE,
      quality: 'best',
    });
    if (!resized.isEmpty()) return resized;
  }
  return image;
}

module.exports = {
  getIconPath,
  loadWindowIcon,
};
