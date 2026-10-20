<div align="center">

<img src="build/icon.png" alt="KudTube Logo" width="128" style="border-radius: 24px;" />

# KudTube

### Lightweight YouTube and YouTube Music client with native MPV hardware-accelerated playback and offline media support.

[![Release](https://img.shields.io/github/v/release/NekoIsUnavailable/kudtube?style=flat-square&color=black&logo=github)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011%20%7C%207-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Linux](https://img.shields.io/badge/Linux-AppImage%20%7C%20Debian-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon%20%7C%20Intel-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![Android](https://img.shields.io/badge/Android-APK%20Direct-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/NekoIsUnavailable/kudtube/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

### Direct Downloads (v1.0.1)

<p align="center">
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-Setup-1.0.1.exe">
    <img src="https://img.shields.io/badge/Download_for_Windows-Installer_(.exe)-0078D6?style=for-the-badge&logo=windows&logoColor=white" height="40" alt="Download Windows Installer"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1-win.zip">
    <img src="https://img.shields.io/badge/Download_Portable-Windows_(.zip)-005A9E?style=for-the-badge&logo=windows&logoColor=white" height="40" alt="Download Windows Portable"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1.AppImage">
    <img src="https://img.shields.io/badge/Download_for_Linux-AppImage_(.AppImage)-FCC624?style=for-the-badge&logo=linux&logoColor=black" height="40" alt="Download Linux AppImage"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1.dmg">
    <img src="https://img.shields.io/badge/Download_for_macOS-macOS_(.dmg)-000000?style=for-the-badge&logo=apple&logoColor=white" height="40" alt="Download macOS DMG"/>
  </a>
  <a href="https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube.apk">
    <img src="https://img.shields.io/badge/Download_for_Android-APK_(.apk)-3DDC84?style=for-the-badge&logo=android&logoColor=white" height="40" alt="Download Android APK"/>
  </a>
</p>

<p align="center">
  <b><a href="https://github.com/NekoIsUnavailable/kudtube/releases">All Releases, Assets, and Checksums</a></b>
</p>

</div>

---

## Release Packages

| Platform | Format | Architecture | Download Link | Description |
| :--- | :--- | :--- | :--- | :--- |
| Windows | Setup Executable (`.exe`) | x64 / x86 | [KudTube-Setup-1.0.1.exe](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-Setup-1.0.1.exe) | Standard NSIS installer with desktop and start menu shortcuts |
| Windows | Portable Archive (`.zip`) | x64 / x86 | [KudTube-1.0.1-win.zip](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1-win.zip) | Standalone portable executable. No installation required |
| Linux | Universal AppImage (`.AppImage`) | x64 | [KudTube-1.0.1.AppImage](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1.AppImage) | Self-contained executable for all major Linux distributions |
| Linux | Debian Package (`.deb`) | x64 | [kudtube_1.0.1_amd64.deb](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/kudtube_1.0.1_amd64.deb) | Native package for Ubuntu, Debian, and Linux Mint |
| macOS | Disk Image (`.dmg`) | Universal | [KudTube-1.0.1.dmg](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube-1.0.1.dmg) | Standard macOS drag-and-drop installer |
| Android | Package (`.apk`) | ARM64 / Universal | [KudTube.apk](https://github.com/NekoIsUnavailable/kudtube/releases/download/v1.0.1/KudTube.apk) | Standalone Android application package |

---

## Technical Architecture

Standard Chromium-based browsers allocate between 1.5 GB and 2.5 GB of system memory to render modern web video pipelines. Complex DOM structures, JavaScript runtime overhead, and software decoding of VP9/AV1 codecs frequently cause thermal throttling and frame drops on resource-constrained hardware.

KudTube bypasses the browser rendering pipeline by embedding an optimized native media backend:

1. **Native Media Pipeline**: Video streams are handed directly to an embedded C-based MPV sub-process running in a hardware-accelerated viewport, managed over IPC via JSON-RPC.
2. **Direct Hardware Decoding**: Supports hardware decoders (`d3d11va`, `vaapi`, `videotoolbox`) with safe software fallback.
3. **Codec Prioritization**: Intelligent format filtering prefers baseline H.264 (`avc1`) and AAC (`mp4a`) streams over compute-heavy VP9/AV1 profiles for older processors.
4. **Deblocking & Cache Optimization**: Low-level MPV controls permit skipping H.264 non-keyframe deblocking loop filters and bounding demuxer memory consumption to 16 MB–64 MB.
5. **Decoupled User Interface**: The UI is built with React 19 and compiled with Vite and Tailwind CSS. The interface communicates asynchronously with Electron IPC handlers, ensuring zero UI thread blocking during video seeking or playback.

---

## Features

- **Hardware Performance Presets**:
  - *Low-end*: Enforces H.264 up to 480p, skips non-keyframe deblocking, and limits demuxer RAM cache to 16 MB.
  - *Balanced*: 720p HD streaming with hardware acceleration and 64 MB demuxer buffer.
  - *High performance*: 1080p / 4K playback with high-fidelity Spline36 scaling and VP9/AV1 codec support.
- **Persistent Media Player**: Includes a global audio playback bar and full-screen player that persists across views without interrupting active streams.
- **YouTube Live Stream Support**: Native HLS stream demuxing for 24/7 news, music broadcasts, and events.
- **Offline Storage**: Integrated multi-resolution video and audio downloader powered by FFmpeg and yt-dlp, with custom destination folder selection.
- **Local Data Model**: Client-side storage for playlists, watch history, and search suggestions with zero external tracking.
- **Native Settings Interface**: Structured two-column layout following desktop standards with dedicated sections for playback, storage, privacy, and low-level engine parameters.

---

## Performance Benchmark

| Metric | Chromium / Web Browser | Standard Electron Wrapper | KudTube (Embedded MPV) |
| :--- | :--- | :--- | :--- |
| **Idle Memory Footprint** | ~800 MB | ~500 MB | **~120 MB** |
| **720p Video Playback Memory** | 1.8 GB – 2.4 GB | ~1.1 GB | **< 240 MB** |
| **CPU Usage on Low-End Chips** | 90% – 100% (Stuttering) | 75% – 90% | **25% – 40% (Smooth)** |
| **Default Codec Priority** | VP9 / AV1 (CPU-Heavy) | WebM / VP9 | **H.264 AVC1 (Hardware Accelerated)** |
| **Offline Downloader** | Requires browser extensions | Inconsistent | **Integrated yt-dlp + FFmpeg** |

---

## Building from Source

### Requirements
- Node.js (v20 or v22 LTS)
- npm (v10 or higher)

### Setup
```bash
git clone https://github.com/NekoIsUnavailable/kudtube.git
cd kudtube
npm install
```

### Development
```bash
npm start
```

### Compiling Packages
- **Windows**:
  ```bash
  npm run package:win
  ```
- **Linux**:
  ```bash
  npm run package:linux
  ```
- **macOS**:
  ```bash
  npm run package:mac
  ```
- **Android**:
  ```bash
  npm run cap:sync
  cd android && ./gradlew assembleDebug
  ```

---

## Repository and Releases

- **GitHub Repository**: [https://github.com/NekoIsUnavailable/kudtube](https://github.com/NekoIsUnavailable/kudtube)
- **Releases & Changelog**: [https://github.com/NekoIsUnavailable/kudtube/releases](https://github.com/NekoIsUnavailable/kudtube/releases)
- **Issue Tracker**: [https://github.com/NekoIsUnavailable/kudtube/issues](https://github.com/NekoIsUnavailable/kudtube/issues)

---

## License

This project is licensed under the [MIT License](LICENSE).
