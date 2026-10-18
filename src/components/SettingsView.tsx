import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Settings as SettingsIcon,
  Download,
  Folder,
  ExternalLink,
  Volume2,
  PlaySquare,
  Trash2,
  RotateCcw,
  Check,
} from 'lucide-react';
import type {
  AppSettings,
  PerformancePreset,
  QualityPreference,
  VideoCodecPreference,
  LoopFilterPreference,
  VideoScalerPreference,
  DownloadQualityPreference,
} from '../types';
import {
  getSettings,
  saveSettings,
  applyPreset,
  DEFAULT_SETTINGS,
  clearHistory,
} from '../utils/storage';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [savedNotice, setSavedNotice] = useState(false);
  const [historyClearedNotice, setHistoryClearedNotice] = useState(false);
  const [searchClearedNotice, setSearchClearedNotice] = useState(false);

  useEffect(() => {
    // Sync settings to backend on mount
    window.kudtubeAPI?.updateSettings?.(settings);
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = saveSettings({ [key]: value, preset: key !== 'preset' && settings.preset !== 'custom' ? 'custom' : settings.preset });
    setSettings(next);
    flashSaved();
  };

  const handleSelectPreset = (preset: PerformancePreset) => {
    const next = applyPreset(preset);
    setSettings(next);
    flashSaved();
  };

  const flashSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSelectDownloadFolder = async () => {
    if (window.kudtubeAPI?.selectFolderDialog) {
      const folder = await window.kudtubeAPI.selectFolderDialog();
      if (folder) {
        updateSetting('downloadFolder', folder);
      }
    }
  };

  const handleOpenDownloadFolder = () => {
    window.kudtubeAPI?.openDownloadFolder?.();
  };

  const handleClearWatchHistory = () => {
    clearHistory();
    setHistoryClearedNotice(true);
    setTimeout(() => setHistoryClearedNotice(false), 2500);
  };

  const handleClearSearchHistory = () => {
    try {
      localStorage.removeItem('kudtube_search_history');
      setSearchClearedNotice(true);
      setTimeout(() => setSearchClearedNotice(false), 2500);
    } catch {}
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all KudTube settings to factory defaults?')) {
      const next = saveSettings({ ...DEFAULT_SETTINGS });
      setSettings(next);
      flashSaved();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 select-none pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-[#272727] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
                Settings & Optimization
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hardware profiles, media decoders, and playback presets
              </p>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40 animate-fade-in self-start sm:self-auto">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Applied</span>
          </div>
        )}
      </div>

      {/* SECTION 1: Hardware Performance Presets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-600 dark:text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Hardware Performance Preset
            </h2>
          </div>
          <span className="text-xs font-medium text-gray-500">
            Active: <span className="font-bold uppercase text-red-600 dark:text-red-400">{settings.preset}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Low-End Preset Card */}
          <button
            onClick={() => handleSelectPreset('low')}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative ${
              settings.preset === 'low'
                ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-md ring-2 ring-red-500/20'
                : 'border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] hover:border-gray-300 dark:hover:border-[#383838]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐢</span>
                <span className="font-bold text-sm text-black dark:text-white">Low-End Netbook</span>
              </div>
              {settings.preset === 'low' && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Targeted for <strong>Acer Aspire One D255E</strong>, Intel Atom N455, GMA 3150, Celeron, and 1GB–2GB RAM.
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">480p / 360p</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">H.264 (avc1)</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">Skip Loopfilter</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">16MB RAM</span>
            </div>
          </button>

          {/* Balanced / Mid-End Preset Card */}
          <button
            onClick={() => handleSelectPreset('mid')}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative ${
              settings.preset === 'mid'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] hover:border-gray-300 dark:hover:border-[#383838]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚖️</span>
                <span className="font-bold text-sm text-black dark:text-white">Balanced / Mid-End</span>
              </div>
              {settings.preset === 'mid' && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Standard modern laptops, Core i3/i5, Intel UHD/Iris graphics, and 4GB+ RAM. Smooth 720p HD with GPU acceleration.
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">720p HD</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">Auto Codec</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">HW Acceleration</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">64MB RAM</span>
            </div>
          </button>

          {/* High-Performance Preset Card */}
          <button
            onClick={() => handleSelectPreset('high')}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative ${
              settings.preset === 'high'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                : 'border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] hover:border-gray-300 dark:hover:border-[#383838]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="font-bold text-sm text-black dark:text-white">High Performance</span>
              </div>
              {settings.preset === 'high' && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Desktops, gaming laptops, discrete GPUs, Apple Silicon, Ryzen. Crisp 1080p/4K VP9/AV1 with high-fidelity scalers.
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">1080p / 4K</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">VP9 / AV1</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">Spline36 Filter</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#252525]">256MB Cache</span>
            </div>
          </button>
        </div>

        {/* Custom Tuning Drawer Toggle */}
        <div className="rounded-2xl border border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                Detailed Fine-Tuning
              </h3>
            </div>
            {settings.preset === 'custom' && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                Custom Modified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Startup Resolution */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Default Stream Resolution
              </label>
              <select
                value={settings.defaultQuality}
                onChange={(e) => updateSetting('defaultQuality', e.target.value as QualityPreference)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="360p">360p (Ultra Fast / Data Saver)</option>
                <option value="480p">480p (Ideal for Atom / D255E)</option>
                <option value="720p">720p (HD Balanced)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="auto">Auto (Adaptive)</option>
              </select>
            </div>

            {/* Video Codec */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Video Codec Priority
              </label>
              <select
                value={settings.codec}
                onChange={(e) => updateSetting('codec', e.target.value as VideoCodecPreference)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="avc1">H.264 / AVC1 (Lowest CPU Usage)</option>
                <option value="auto">Auto (YouTube Default)</option>
                <option value="vp9">VP9 (High Quality Bitrate)</option>
              </select>
            </div>

            {/* Hardware Decoding */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Hardware Acceleration (GPU)
              </label>
              <select
                value={settings.hardwareDecoding ? 'true' : 'false'}
                onChange={(e) => updateSetting('hardwareDecoding', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="true">Enabled (auto-safe: D3D11/VAAPI)</option>
                <option value="false">Disabled (Pure CPU software decode)</option>
              </select>
            </div>

            {/* Loop Filter */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Decoder Loopfilter (Deblocking)
              </label>
              <select
                value={settings.skipLoopFilter}
                onChange={(e) => updateSetting('skipLoopFilter', e.target.value as LoopFilterPreference)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="nonkey">Skip on non-keyframes (Huge CPU save)</option>
                <option value="default">Default</option>
                <option value="none">None (Full Deblocking filter)</option>
              </select>
            </div>

            {/* RAM Cache Size */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Demuxer Buffer Memory
              </label>
              <select
                value={settings.ramCacheMb}
                onChange={(e) => updateSetting('ramCacheMb', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="16">16 MB (For 1GB–2GB RAM Netbooks)</option>
                <option value="32">32 MB (Standard)</option>
                <option value="64">64 MB (Balanced)</option>
                <option value="128">128 MB (High)</option>
                <option value="256">256 MB (Heavy Buffer / Slow ISP)</option>
              </select>
            </div>

            {/* Video Scaler */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                GPU Video Scaler
              </label>
              <select
                value={settings.videoScaler}
                onChange={(e) => updateSetting('videoScaler', e.target.value as VideoScalerPreference)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="fast-bilinear">Fast Bilinear (Minimal GPU Load)</option>
                <option value="bilinear">Bilinear (Standard)</option>
                <option value="spline36">Spline36 (Crisp Sharp Scaling)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Downloads & Offline Media */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-red-600 dark:text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
            Offline Downloads & Storage
          </h2>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Download Quality */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Default Download Quality
              </label>
              <select
                value={settings.downloadQuality}
                onChange={(e) => updateSetting('downloadQuality', e.target.value as DownloadQualityPreference)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="match_preset">Match Active Preset (Recommended)</option>
                <option value="ask">Always Ask on Every Download</option>
                <option value="720p">720p HD (Universal MP4, Fast)</option>
                <option value="480p">480p SD (Low-Spec Safe MP4)</option>
                <option value="360p">360p (Smallest File Size)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="audio">Audio Only (MP3)</option>
              </select>
              <p className="text-[11px] text-gray-400">
                {settings.downloadQuality === 'match_preset'
                  ? `Currently resolves to ${settings.preset === 'low' ? '480p H.264 MP4 (Zero CPU re-muxing)' : settings.preset === 'mid' ? '720p MP4' : '1080p'}.`
                  : 'Specific resolution applied whenever downloading videos.'}
              </p>
            </div>

            {/* Download Folder Location */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Download Destination Folder
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.downloadFolder || 'Default: Videos/KudTube'}
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 font-mono text-[11px] truncate select-all"
                />
                <button
                  onClick={handleSelectDownloadFolder}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] text-black dark:text-white font-semibold flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
                <button
                  onClick={handleOpenDownloadFolder}
                  title="Open folder in File Explorer"
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Playback Experience */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PlaySquare className="w-4 h-4 text-red-600 dark:text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
            Playback & Player Experience
          </h2>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Autoplay Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333]">
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  Autoplay Next Video
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Automatically plays up-next or playlist songs
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoplayNext}
                onChange={(e) => updateSetting('autoplayNext', e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </div>

            {/* Ambient Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333]">
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  Ambient Glow Effect
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Subtle cinematic backdrop glow on watch page
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.ambientMode}
                onChange={(e) => updateSetting('ambientMode', e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Default Startup Volume Slider */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Default Startup Volume
              </span>
              <span className="font-mono font-bold text-black dark:text-white">
                {settings.defaultVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.defaultVolume}
              onChange={(e) => updateSetting('defaultVolume', Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Storage, Privacy & Reset */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
            Privacy & Maintenance
          </h2>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleClearSearchHistory}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#252525] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] transition"
            >
              {searchClearedNotice ? 'Search History Cleared!' : 'Clear Search Suggestions'}
            </button>
            <button
              onClick={handleClearWatchHistory}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#252525] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] transition"
            >
              {historyClearedNotice ? 'Watch History Cleared!' : 'Clear Watch History'}
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
