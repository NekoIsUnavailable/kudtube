import type {
  VideoItem,
  Playlist,
  AppSettings,
  PerformancePreset,
} from '../types';

const STORAGE_PLAYLISTS = 'kudtube_playlists';
const STORAGE_WATCH_LATER = 'kudtube_watch_later';
const STORAGE_HISTORY = 'kudtube_history';
const STORAGE_SETTINGS = 'kudtube_settings';

export const PRESET_CONFIGS: Record<Exclude<PerformancePreset, 'custom'>, AppSettings> = {
  low: {
    preset: 'low',
    defaultQuality: '480p',
    codec: 'avc1',
    hardwareDecoding: true,
    skipLoopFilter: 'nonkey',
    frameDrop: 'vo',
    videoScaler: 'fast-bilinear',
    ramCacheMb: 16,
    downloadQuality: 'match_preset',
    autoplayNext: true,
    ambientMode: false,
    defaultVolume: 100,
  },
  mid: {
    preset: 'mid',
    defaultQuality: '720p',
    codec: 'auto',
    hardwareDecoding: true,
    skipLoopFilter: 'default',
    frameDrop: 'vo',
    videoScaler: 'bilinear',
    ramCacheMb: 64,
    downloadQuality: 'match_preset',
    autoplayNext: true,
    ambientMode: true,
    defaultVolume: 100,
  },
  high: {
    preset: 'high',
    defaultQuality: '1080p',
    codec: 'vp9',
    hardwareDecoding: true,
    skipLoopFilter: 'none',
    frameDrop: 'no',
    videoScaler: 'spline36',
    ramCacheMb: 256,
    downloadQuality: '1080p',
    autoplayNext: true,
    ambientMode: true,
    defaultVolume: 100,
  },
};

export const DEFAULT_SETTINGS: AppSettings = PRESET_CONFIGS.mid;

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
  if (typeof window !== 'undefined' && window.kudtubeAPI?.updateSettings) {
    window.kudtubeAPI.updateSettings(next).catch(() => {});
  }
  return next;
}

export function applyPreset(preset: PerformancePreset): AppSettings {
  if (preset === 'custom') {
    return saveSettings({ preset: 'custom' });
  }
  const target = PRESET_CONFIGS[preset];
  return saveSettings({ ...target });
}

// Backward compatibility alias
export interface Preferences {
  defaultQuality: string;
  volume: number;
}

export function getPreferences(): Preferences {
  const s = getSettings();
  return { defaultQuality: s.defaultQuality, volume: s.defaultVolume };
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const patch: Partial<AppSettings> = {};
  if (prefs.defaultQuality) patch.defaultQuality = prefs.defaultQuality as any;
  if (prefs.volume !== undefined) patch.defaultVolume = prefs.volume;
  const s = saveSettings(patch);
  return { defaultQuality: s.defaultQuality, volume: s.defaultVolume };
}


export function getPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYLISTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: 'favorites', title: 'Favorites', createdAt: Date.now(), videos: [] },
  ];
}

export function savePlaylists(playlists: Playlist[]): void {
  localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(playlists));
}

export function addVideoToPlaylist(playlistId: string, video: VideoItem): void {
  const lists = getPlaylists();
  const target = lists.find((p) => p.id === playlistId);
  if (target) {
    if (!target.videos.some((v) => v.id === video.id)) {
      target.videos.unshift(video);
      savePlaylists(lists);
    }
  }
}

export function removeVideoFromPlaylist(playlistId: string, videoId: string): void {
  const lists = getPlaylists();
  const target = lists.find((p) => p.id === playlistId);
  if (target) {
    target.videos = target.videos.filter((v) => v.id !== videoId);
    savePlaylists(lists);
  }
}

export function createPlaylist(title: string): Playlist {
  const lists = getPlaylists();
  const newPl: Playlist = {
    id: `pl_${Date.now()}`,
    title: title.trim() || 'Untitled Playlist',
    createdAt: Date.now(),
    videos: [],
  };
  lists.unshift(newPl);
  savePlaylists(lists);
  return newPl;
}

export function deletePlaylist(playlistId: string): void {
  const lists = getPlaylists().filter((p) => p.id !== playlistId);
  savePlaylists(lists);
}

export function getWatchLater(): VideoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_WATCH_LATER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function toggleWatchLater(video: VideoItem): boolean {
  const list = getWatchLater();
  const index = list.findIndex((v) => v.id === video.id);
  let isSaved = false;
  if (index >= 0) {
    list.splice(index, 1);
    isSaved = false;
  } else {
    list.unshift(video);
    isSaved = true;
  }
  localStorage.setItem(STORAGE_WATCH_LATER, JSON.stringify(list));
  return isSaved;
}

export function isWatchLater(videoId: string): boolean {
  return getWatchLater().some((v) => v.id === videoId);
}

export function getHistory(): VideoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function appendHistory(video: VideoItem): void {
  const list = getHistory().filter((v) => v.id !== video.id);
  list.unshift(video);
  if (list.length > 100) list.pop();
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(list));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_HISTORY);
}
