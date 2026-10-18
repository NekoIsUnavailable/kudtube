import React, { useState, useEffect } from 'react';
import type {
  AppSettings,
  PerformancePreset,
  QualityPreference,
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

type SettingsTab = 'playback' | 'downloads' | 'privacy' | 'advanced';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('playback');
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [historyCleared, setHistoryCleared] = useState(false);
  const [searchCleared, setSearchCleared] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  useEffect(() => {
    window.kudtubeAPI?.updateSettings?.(settings);
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const isCustom = key !== 'preset' && settings.preset !== 'custom';
    const next = saveSettings({
      [key]: value,
      preset: isCustom ? 'custom' : settings.preset,
    });
    setSettings(next);
    triggerSaved();
  };

  const handleSelectPreset = (preset: PerformancePreset) => {
    const next = applyPreset(preset);
    setSettings(next);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  const handleSelectFolder = async () => {
    if (window.kudtubeAPI?.selectFolderDialog) {
      const folder = await window.kudtubeAPI.selectFolderDialog();
      if (folder) {
        update('downloadFolder', folder);
      }
    }
  };

  const handleOpenFolder = () => {
    window.kudtubeAPI?.openDownloadFolder?.();
  };

  const handleClearWatchHistory = () => {
    clearHistory();
    setHistoryCleared(true);
    setTimeout(() => setHistoryCleared(false), 2500);
  };

  const handleClearSearchHistory = () => {
    try {
      localStorage.removeItem('kudtube_search_history');
      setSearchCleared(true);
      setTimeout(() => setSearchCleared(false), 2500);
    } catch {}
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all KudTube settings to YouTube defaults?')) {
      const next = saveSettings({ ...DEFAULT_SETTINGS });
      setSettings(next);
      triggerSaved();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] bg-white dark:bg-[#0f0f0f] text-black dark:text-white select-none">
      {/* Left Sidebar (Classic YouTube Settings Sidebar) */}
      <aside className="w-full md:w-64 flex-shrink-0 md:border-r border-[#e5e5e5] dark:border-[#272727] px-3 py-4 md:py-6">
        <div className="flex items-center gap-2 px-3 pb-3">
          {onBack && (
            <button
              onClick={onBack}
              title="Back"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-black dark:text-white transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-bold text-black dark:text-white">
            Settings
          </h2>
        </div>

        {/* Tab buttons */}
        <nav className="flex md:flex-col overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('playback')}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors flex items-center justify-between ${
              activeTab === 'playback'
                ? 'bg-[#f2f2f2] text-black font-semibold dark:bg-[#272727] dark:text-white'
                : 'text-[#606060] dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Playback and performance</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors flex items-center justify-between ${
              activeTab === 'downloads'
                ? 'bg-[#f2f2f2] text-black font-semibold dark:bg-[#272727] dark:text-white'
                : 'text-[#606060] dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors flex items-center justify-between ${
              activeTab === 'privacy'
                ? 'bg-[#f2f2f2] text-black font-semibold dark:bg-[#272727] dark:text-white'
                : 'text-[#606060] dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Privacy & data</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-colors flex items-center justify-between ${
              activeTab === 'advanced'
                ? 'bg-[#f2f2f2] text-black font-semibold dark:bg-[#272727] dark:text-white'
                : 'text-[#606060] dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Advanced settings</span>
          </button>
        </nav>

        {savedBadge && (
          <div className="mt-4 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
            ✓ Preferences saved
          </div>
        )}
      </aside>

      {/* Right Content Pane (YouTube Settings Section) */}
      <main className="flex-1 max-w-3xl px-4 sm:px-10 py-6 md:py-8 overflow-y-auto">
        {/* TAB 1: Playback & Performance */}
        {activeTab === 'playback' && (
          <div>
            <span className="text-xs text-[#606060] dark:text-[#aaa] font-medium block">
              Playback and performance
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1 mb-6">
              Choose how you want to watch videos on KudTube
            </h1>

            <div className="border-b border-[#e5e5e5] dark:border-[#272727] mb-6" />

            {/* Performance Preset Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Performance preset
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Tuning presets configure hardware decoders, video codecs, and buffering according to your system capabilities.
                </p>
              </div>

              <div className="sm:col-span-8 space-y-4">
                {/* Low-End Option */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="performance_preset"
                    checked={settings.preset === 'low'}
                    onChange={() => handleSelectPreset('low')}
                    className="mt-1 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black dark:text-white group-hover:text-[#065fd4] dark:group-hover:text-[#3ea6ff] transition">
                      Low-end netbook (Acer Aspire One D255E / Atom N455)
                    </span>
                    <p className="text-xs text-[#606060] dark:text-[#aaa] mt-0.5 leading-relaxed">
                      Optimized for single/dual-core Intel Atom, GMA 3150, Celeron, and 1GB–2GB RAM. Enforces lightweight H.264 up to 480p and reduces deblocking loopfilter to eliminate CPU stuttering.
                    </p>
                  </div>
                </label>

                {/* Balanced Option */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="performance_preset"
                    checked={settings.preset === 'mid'}
                    onChange={() => handleSelectPreset('mid')}
                    className="mt-1 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black dark:text-white group-hover:text-[#065fd4] dark:group-hover:text-[#3ea6ff] transition">
                      Balanced (Recommended)
                    </span>
                    <p className="text-xs text-[#606060] dark:text-[#aaa] mt-0.5 leading-relaxed">
                      Standard laptops, Core i3/i5, Intel UHD/Iris graphics, and 4GB+ RAM. 720p HD streaming with hardware decoding and 64 MB buffer.
                    </p>
                  </div>
                </label>

                {/* High Performance Option */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="performance_preset"
                    checked={settings.preset === 'high'}
                    onChange={() => handleSelectPreset('high')}
                    className="mt-1 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black dark:text-white group-hover:text-[#065fd4] dark:group-hover:text-[#3ea6ff] transition">
                      High performance
                    </span>
                    <p className="text-xs text-[#606060] dark:text-[#aaa] mt-0.5 leading-relaxed">
                      Desktops, discrete GPUs, Apple Silicon, and modern Ryzen systems. Full HD 1080p / 4K with VP9/AV1 codecs and 256 MB cache.
                    </p>
                  </div>
                </label>

                {/* Custom Label */}
                {settings.preset === 'custom' && (
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-[#065fd4] dark:text-[#3ea6ff]">
                      • Custom tuning is currently active (configured in Advanced settings)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Default Streaming Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Video quality
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Default quality profile applied when opening videos.
                </p>
              </div>

              <div className="sm:col-span-8">
                <select
                  value={settings.defaultQuality}
                  onChange={(e) => update('defaultQuality', e.target.value as QualityPreference)}
                  className="px-3 py-2 rounded-lg bg-transparent border border-[#ccc] dark:border-[#383838] text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#065fd4] dark:focus:border-[#3ea6ff] cursor-pointer"
                >
                  <option value="auto">Auto (Adaptive)</option>
                  <option value="360p">360p (Data saver)</option>
                  <option value="480p">480p (Standard definition / Netbook)</option>
                  <option value="720p">720p (High definition)</option>
                  <option value="1080p">1080p (Full HD)</option>
                </select>
              </div>
            </div>

            {/* Video Codec Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  AV1 and codec settings
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Older hardware decodes H.264 much faster than VP9 or AV1.
                </p>
              </div>

              <div className="sm:col-span-8 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="codec_pref"
                    checked={settings.codec === 'avc1'}
                    onChange={() => update('codec', 'avc1')}
                    className="accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-black dark:text-white">
                    Prefer H.264 (avc1) — Best for older PCs & battery savings
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="codec_pref"
                    checked={settings.codec === 'auto'}
                    onChange={() => update('codec', 'auto')}
                    className="accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-black dark:text-white">
                    Auto (YouTube default streams)
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="codec_pref"
                    checked={settings.codec === 'vp9'}
                    onChange={() => update('codec', 'vp9')}
                    className="accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-black dark:text-white">
                    Prefer VP9 / AV1 (Higher visual quality)
                  </span>
                </label>
              </div>
            </div>

            {/* Hardware Acceleration & Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Playback options
                </span>
              </div>

              <div className="sm:col-span-8 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hardwareDecoding}
                    onChange={(e) => update('hardwareDecoding', e.target.checked)}
                    className="mt-0.5 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-black dark:text-white block">
                      Use hardware acceleration
                    </span>
                    <span className="text-xs text-[#606060] dark:text-[#aaa]">
                      Offloads video decoding to the GPU (Direct3D 11 / VAAPI).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoplayNext}
                    onChange={(e) => update('autoplayNext', e.target.checked)}
                    className="mt-0.5 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-black dark:text-white block">
                      Autoplay next video
                    </span>
                    <span className="text-xs text-[#606060] dark:text-[#aaa]">
                      When you finish a video, another video will play automatically.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ambientMode}
                    onChange={(e) => update('ambientMode', e.target.checked)}
                    className="mt-0.5 accent-[#065fd4] dark:accent-[#3ea6ff] w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-black dark:text-white block">
                      Ambient mode
                    </span>
                    <span className="text-xs text-[#606060] dark:text-[#aaa]">
                      Subtly draws color from the video into the player background.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Default Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Default volume
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1">
                  Starting volume level for new playback sessions.
                </p>
              </div>

              <div className="sm:col-span-8 flex items-center gap-4 max-w-sm">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.defaultVolume}
                  onChange={(e) => update('defaultVolume', Number(e.target.value))}
                  className="flex-1 accent-[#065fd4] dark:accent-[#3ea6ff] cursor-pointer"
                />
                <span className="text-xs font-mono font-semibold w-10 text-right">
                  {settings.defaultVolume}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Downloads */}
        {activeTab === 'downloads' && (
          <div>
            <span className="text-xs text-[#606060] dark:text-[#aaa] font-medium block">
              Downloads
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1 mb-6">
              Download quality and storage location
            </h1>

            <div className="border-b border-[#e5e5e5] dark:border-[#272727] mb-6" />

            {/* Download Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Download quality
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Resolution used when saving offline videos.
                </p>
              </div>

              <div className="sm:col-span-8 space-y-2">
                <select
                  value={settings.downloadQuality}
                  onChange={(e) => update('downloadQuality', e.target.value as DownloadQualityPreference)}
                  className="px-3 py-2 rounded-lg bg-transparent border border-[#ccc] dark:border-[#383838] text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#065fd4] dark:focus:border-[#3ea6ff] cursor-pointer"
                >
                  <option value="match_preset">Match active playback preset (Recommended)</option>
                  <option value="ask">Always ask on download</option>
                  <option value="720p">720p HD (Universal MP4, Fast)</option>
                  <option value="480p">480p SD (Low-spec safe MP4)</option>
                  <option value="360p">360p (Smallest file size)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="audio">Audio only (MP3)</option>
                </select>
                <p className="text-xs text-[#606060] dark:text-[#aaa] leading-relaxed">
                  {settings.downloadQuality === 'match_preset' &&
                    `Automatically downloads ${
                      settings.preset === 'low'
                        ? '480p H.264 MP4 (pre-merged with zero CPU re-encoding for netbooks)'
                        : settings.preset === 'mid'
                        ? '720p HD MP4'
                        : '1080p Full HD'
                    }.`}
                </p>
              </div>
            </div>

            {/* Download Directory */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Download location
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Downloaded videos and music tracks are saved in this folder.
                </p>
              </div>

              <div className="sm:col-span-8 space-y-3">
                <div className="flex items-center gap-2 max-w-lg">
                  <input
                    type="text"
                    readOnly
                    value={settings.downloadFolder || 'Default: Videos/KudTube'}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#f9f9f9] dark:bg-[#181818] border border-[#ccc] dark:border-[#383838] text-xs font-mono text-black dark:text-white truncate select-all"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#f2f2f2] hover:bg-[#e5e5e5] dark:bg-[#272727] dark:hover:bg-[#383838] border border-[#ccc] dark:border-[#383838] text-black dark:text-white transition whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <button
                    onClick={handleOpenFolder}
                    className="text-xs font-medium text-[#065fd4] dark:text-[#3ea6ff] hover:underline"
                  >
                    Open folder in File Explorer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Privacy & Data */}
        {activeTab === 'privacy' && (
          <div>
            <span className="text-xs text-[#606060] dark:text-[#aaa] font-medium block">
              Privacy & data
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1 mb-6">
              Manage your watch history and local data
            </h1>

            <div className="border-b border-[#e5e5e5] dark:border-[#272727] mb-6" />

            {/* Clear Watch History */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Watch history
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  KudTube stores your history locally in the client without any external tracking.
                </p>
              </div>

              <div className="sm:col-span-8 flex items-center justify-between">
                <div>
                  <button
                    onClick={handleClearWatchHistory}
                    className="text-sm font-semibold text-[#065fd4] dark:text-[#3ea6ff] hover:underline"
                  >
                    Clear watch history
                  </button>
                  {historyCleared && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-1">
                      ✓ Watch history cleared
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clear Search History */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Search suggestions
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Recent queries saved in your local search dropdown.
                </p>
              </div>

              <div className="sm:col-span-8 flex items-center justify-between">
                <div>
                  <button
                    onClick={handleClearSearchHistory}
                    className="text-sm font-semibold text-[#065fd4] dark:text-[#3ea6ff] hover:underline"
                  >
                    Clear search history
                  </button>
                  {searchCleared && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-1">
                      ✓ Search suggestions cleared
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Advanced Settings */}
        {activeTab === 'advanced' && (
          <div>
            <span className="text-xs text-[#606060] dark:text-[#aaa] font-medium block">
              Advanced settings
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1 mb-6">
              Low-level MPV media engine configuration
            </h1>

            <div className="border-b border-[#e5e5e5] dark:border-[#272727] mb-6" />

            {/* Deblocking loopfilter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Deblocking loop filter
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Skipping deblocking on non-keyframes provides massive CPU savings on weak processors.
                </p>
              </div>

              <div className="sm:col-span-8">
                <select
                  value={settings.skipLoopFilter}
                  onChange={(e) => update('skipLoopFilter', e.target.value as LoopFilterPreference)}
                  className="px-3 py-2 rounded-lg bg-transparent border border-[#ccc] dark:border-[#383838] text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#065fd4] dark:focus:border-[#3ea6ff] cursor-pointer"
                >
                  <option value="nonkey">Skip non-key (Recommended for Atom / Netbooks)</option>
                  <option value="default">Default</option>
                  <option value="none">None (Full fidelity deblocking)</option>
                </select>
              </div>
            </div>

            {/* Demuxer Buffer */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Buffer memory limit
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Controls the maximum RAM dedicated to pre-buffering video streams.
                </p>
              </div>

              <div className="sm:col-span-8">
                <select
                  value={settings.ramCacheMb}
                  onChange={(e) => update('ramCacheMb', Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-transparent border border-[#ccc] dark:border-[#383838] text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#065fd4] dark:focus:border-[#3ea6ff] cursor-pointer"
                >
                  <option value="16">16 MB (Ideal for 1GB RAM)</option>
                  <option value="32">32 MB</option>
                  <option value="64">64 MB (Balanced)</option>
                  <option value="128">128 MB</option>
                  <option value="256">256 MB (High)</option>
                </select>
              </div>
            </div>

            {/* Video Scaler */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-4 border-b border-[#e5e5e5] dark:border-[#272727]">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-black dark:text-white block">
                  Video scaler algorithm
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Shader interpolation algorithm used when scaling video to your display.
                </p>
              </div>

              <div className="sm:col-span-8">
                <select
                  value={settings.videoScaler}
                  onChange={(e) => update('videoScaler', e.target.value as VideoScalerPreference)}
                  className="px-3 py-2 rounded-lg bg-transparent border border-[#ccc] dark:border-[#383838] text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#065fd4] dark:focus:border-[#3ea6ff] cursor-pointer"
                >
                  <option value="fast-bilinear">Fast Bilinear (Minimal GPU overhead)</option>
                  <option value="bilinear">Bilinear (Standard)</option>
                  <option value="spline36">Spline36 (Sharp high-fidelity scaling)</option>
                </select>
              </div>
            </div>

            {/* Factory Reset */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 py-5">
              <div className="sm:col-span-4">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 block">
                  Reset settings
                </span>
                <p className="text-xs text-[#606060] dark:text-[#aaa] mt-1 leading-relaxed">
                  Restores all KudTube performance and player options to factory defaults.
                </p>
              </div>

              <div className="sm:col-span-8">
                <button
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                >
                  Reset all settings to default
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
