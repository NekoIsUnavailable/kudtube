<div align="center">

<img src="build/icon.png" alt="KudTube Logo" width="132" style="border-radius: 28px; box-shadow: 0 10px 36px rgba(0,0,0,0.4);" />

# 📺 KudTube

### *Ultra-lightweight, hardware-accelerated YouTube & YouTube Music client tuned for older machines and modern setups.*

[![Release](https://img.shields.io/github/v/release/NekoIsUnavailable/kudtube?style=for-the-badge&color=FF0000&logo=github)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011%20%7C%207-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Linux](https://img.shields.io/badge/Linux-AppImage%20%7C%20Debian-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon%20%7C%20Intel-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Android](https://img.shields.io/badge/Android-APK%20Direct-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

### 📥 One-Click Downloads (v1.0.0)

<p align="center">
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-Setup-1.0.0.exe">
    <img src="https://img.shields.io/badge/Download_for_Windows-Installer_(.exe)-0078D6?style=for-the-badge&logo=windows&logoColor=white" height="42" alt="Download Windows Installer"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0-win.zip">
    <img src="https://img.shields.io/badge/Download_Portable-Windows_(.zip)-005A9E?style=for-the-badge&logo=windows&logoColor=white" height="42" alt="Download Windows Portable"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0.AppImage">
    <img src="https://img.shields.io/badge/Download_for_Linux-AppImage_(.AppImage)-FCC624?style=for-the-badge&logo=linux&logoColor=black" height="42" alt="Download Linux AppImage"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0-arm64.dmg">
    <img src="https://img.shields.io/badge/Download_for_macOS-Apple_Silicon_(.dmg)-000000?style=for-the-badge&logo=apple&logoColor=white" height="42" alt="Download macOS DMG"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/latest">
    <img src="https://img.shields.io/badge/Download_for_Android-APK_(.apk)-3DDC84?style=for-the-badge&logo=android&logoColor=white" height="42" alt="Download Android APK"/>
  </a>
</p>

<p align="center">
  👉 <b><a href="https://github.com/NekoIsUnavailable/kudtube/releases">Browse all downloads, checksums & release notes</a></b>
</p>

</div>

---

## 📦 Download Packages

| Platform | Format | Architecture | Download Link | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | Setup Executable (`.exe`) | x64 / x86 | [**KudTube-Setup-1.0.0.exe**](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-Setup-1.0.0.exe) | Standard Windows NSIS installer with desktop & start menu shortcuts |
| **Windows** | Portable Archive (`.zip`) | x64 / x86 | [**KudTube-1.0.0-win.zip**](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0-win.zip) | Standalone portable folder. No installation required (runs from USB) |
| **Linux** | Universal AppImage (`.AppImage`) | x64 | [**KudTube-1.0.0.AppImage**](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0.AppImage) | Universal single-file Linux binary (`chmod +x` and run) |
| **macOS** | DMG Disk Image (`.dmg`) | Apple Silicon (arm64) | [**KudTube-1.0.0-arm64.dmg**](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0-arm64.dmg) | Drag-and-drop macOS install with native traffic lights |
| **macOS** | Portable Archive (`.zip`) | Apple Silicon (arm64) | [**KudTube-1.0.0-arm64-mac.zip**](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.0/KudTube-1.0.0-arm64-mac.zip) | Standalone unpacked macOS application |
| **Android** | Android Package (`.apk`) | ARM64 / Universal | [**Latest Android APK**](https://github.com/NekoIsUnavailable/kudtube/releases/latest) | Native mobile container with background audio & touch controls |

---

## ✨ Why KudTube?

Most modern browsers (Chrome, Edge, Brave) require 1.5 GB to 2.5 GB of RAM just to stream a 720p YouTube video, dropping frames on older CPUs. 

**KudTube** embeds the raw, native C-based **MPV video engine** directly into a hardware-accelerated viewport, controlled over IPC pipes:

* **Zero Ads & Zero Tracking**: Watch videos cleanly without sponsor breaks, popups, or banner ads.
* **Hardware Performance Presets & Settings**: One-click optimization for your specific machine:
  - 🐢 **Low-End Netbook (Acer D255E)**: 480p/360p, strict H.264 `avc1`, skip deblocking loopfilter, 16 MB RAM buffer (stops Atom freezing).
  - ⚖️ **Balanced / Mid-End**: 720p HD, auto codec, hardware acceleration (`auto-safe`), 64 MB buffer.
  - 🚀 **High Performance**: 1080p / 4K, VP9/AV1 high bitrate, 256 MB buffer, Spline36 scaling.
  - 🛠️ **Custom Tuning**: Granular controls for resolutions, codecs, GPU scalers, and buffer memory.
* **YouTube Live Streams**: Full support for active YouTube Live streams (`● LIVE NOW`), 24/7 news, and live concerts with rolling HLS buffering.
* **Integrated YouTube Music Player**: Persistent mini-player bar at the bottom with seekbar, volume control, playlist queue, and full-screen expanded player.
* **Netbook & Low-Spec Baseline**: Tuned specifically with the **Acer Aspire One D255E (Intel Atom N455, GMA 3150, 1 GB RAM)** as our performance target.
  - Automatically selects hardware-friendly **H.264 (`avc1`)** and **AAC (`mp4a`)** streams to avoid heavy VP9/AV1 CPU decoding.
  - Memory consumption capped under **250 MB**.
  - OSD and video scaling optimized with fast bilinear algorithms.
* **Offline Library & Downloader**: Save any video (1080p, 720p, 480p, 360p) or audio-only (`.mp3`) with real-time download progress and custom download folder selection.
* **Account-Free Playlists & History**: Create custom playlists and maintain watch history completely stored locally in your browser.

---

## ⚡ Performance Comparison

| Metric | Google Chrome / Edge | Typical Electron Wrapper | **KudTube (MPV Engine)** |
| :--- | :--- | :--- | :--- |
| **Idle RAM Usage** | ~800 MB | ~500 MB | **~120 MB** |
| **720p Playback RAM** | 1.8 GB – 2.4 GB | ~1.1 GB | **< 240 MB** |
| **CPU Usage (Atom N455)** | 95% – 100% (Stuttering) | 80% – 95% | **25% – 45% (Smooth)** |
| **Preferred Codec** | VP9 / AV1 (Heavy) | VP9 (Heavy) | **H.264 AVC1 (Hardware Accelerated)** |
| **Offline Downloading** | Requires extensions | Inconsistent | **Built-in yt-dlp & FFmpeg** |

---

## 🛠️ Building from Source

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [npm](https://npmjs.com)

```bash
# 1. Clone the repository
git clone https://github.com/NekoIsUnavailable/kudtube.git
cd kudtube

# 2. Install dependencies
npm install
```

### Development Server
```bash
npm start
```

### Packaging Installers
* **Windows (`.exe` & `.zip`)**:
  ```bash
  npm run package:win
  ```
* **Linux (`.AppImage` & `.deb`)**:
  ```bash
  npm run package:linux
  ```
* **macOS (`.dmg` & `.zip`)**:
  ```bash
  npm run package:mac
  ```
* **Android (`.apk`)**:
  ```bash
  npm run cap:sync
  cd android && ./gradlew assembleDebug
  ```

---

## 🌐 Community & Releases

* **GitHub Repository**: [https://github.com/NekoIsUnavailable/kudtube](https://github.com/NekoIsUnavailable/kudtube)
* **Releases**: [https://github.com/NekoIsUnavailable/kudtube/releases](https://github.com/NekoIsUnavailable/kudtube/releases)
* **Issue Tracker**: [https://github.com/NekoIsUnavailable/kudtube/issues](https://github.com/NekoIsUnavailable/kudtube/issues)

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
