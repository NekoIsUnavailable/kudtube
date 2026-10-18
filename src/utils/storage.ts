import type { VideoItem, Playlist } from '../types';

const STORAGE_PLAYLISTS = 'kudtube_playlists';
const STORAGE_WATCH_LATER = 'kudtube_watch_later';
const STORAGE_HISTORY = 'kudtube_history';
const STORAGE_PREFS = 'kudtube_preferences';

export interface Preferences {
  defaultQuality: string;
  volume: number;
}

export function getPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { defaultQuality: '1080p', volume: 100 };
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const current = getPreferences();
  const next = { ...current, ...prefs };
  localStorage.setItem(STORAGE_PREFS, JSON.stringify(next));
  return next;
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
