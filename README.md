<div align="center">

<img src="build/icon.png" alt="KudTube Logo" width="128" style="border-radius: 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);" />

# 📺 KudTube

### *Ultra-lightweight, ad-free YouTube & YouTube Music client with offline library & MPV acceleration.*

[![Windows](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com)
[![Linux](https://img.shields.io/badge/Platform-Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com)
[![macOS](https://img.shields.io/badge/Platform-macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com)
[![Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com)
[![Player Engine](https://img.shields.io/badge/Player-MPV%20Engine-5C2D91?style=for-the-badge)](https://mpv.io)
[![Stream Engine](https://img.shields.io/badge/Engine-yt--dlp-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)

</div>

---

## ✨ Features

- **Ad-Free YouTube Playback**: Stream any YouTube video with zero ads, zero sponsor segments, and zero tracking.
- **Dedicated YouTube Music Player**: Integrated offline audio player with persistent bottom playback bar, expandable now-playing view, and playlist support.
- **Multi-Platform Support**:
  - **Desktop (Windows, Linux, macOS)**: Native Electron application with MPV hardware-accelerated video rendering.
  - **Mobile (Android)**: Native Capacitor Android container with responsive touch interface.
- **Netbook / Low-Spec Optimization**:
  - Tuned with an **Intel Atom N455 / Intel GMA 3150 / 1GB RAM** baseline.
  - Prioritizes hardware-friendly H.264 (`avc1`) and AAC (`mp4a`) streams over heavy VP9/AV1.
  - Zero software Gaussian blur passes on weak GPUs.
  - Memory footprint strictly bounded under 256MB.
- **True Offline Downloads**: Download videos (1080p, 720p, 480p SD, 360p) and MP3 music files with live download progress.
- **Local Playlists & History**: Organize songs and videos into custom playlists without needing a Google account.
- **Pixel-Accurate UI**: Full light and dark themes matching YouTube and YouTube Music design language.

---

## 🛠️ Building for Each Platform

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [npm](https://npmjs.com)

```bash
# Clone the repository
git clone <repository-url>
cd KudTube

# Install dependencies
npm install
```

### 1. Windows (x64 / x86)
```bash
# Development server + Electron live window
npm start

# Compile and package Windows installer (.exe) & portable (.zip)
npm run package:win

# Fast unpacked directory build for testing
npm run package:dir
```

### 2. Linux (AppImage & deb)
```bash
# Compile and package Linux binaries
npm run package:linux
```

### 3. macOS (DMG & zip)
```bash
# Compile and package macOS installer
npm run package:mac
```

### 4. Android (APK)
```bash
# Sync web build to native Android project
npm run cap:sync

# Build native Android APK (requires Android SDK or Android Studio)
npm run cap:build:android
# Or open in Android Studio:
npx cap open android
```

---

## 🚀 CI/CD & Automated GitHub Releases

This repository includes a multi-platform GitHub Actions workflow (`.github/workflows/build-and-release.yml`).
Whenever you push a tag (e.g. `v1.0.0`), GitHub Actions will automatically:
1. Build Windows `.exe` and `.zip`
2. Build Linux `.AppImage` and `.deb`
3. Build macOS `.dmg` and `.zip`
4. Build Android `.apk`
5. Attach all binaries directly to a new GitHub Release.

### Pushing to GitHub
```bash
# 1. Add your remote
git remote add origin https://github.com/<your-username>/KudTube.git

# 2. Push master branch
git push -u origin master

# 3. Create a release tag
git tag v1.0.0
git push origin v1.0.0
```

---

## 📄 License
Open source under the MIT License.
