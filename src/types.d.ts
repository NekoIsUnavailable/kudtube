export interface VideoItem {
  id: string;
  url: string;
  title: string;
  channel: string;
  channelId?: string | null;
  duration: number;
  thumbnail: string | null;
  viewCount?: number | null;
  uploadDate?: string | null;
  description?: string;
  isOffline?: boolean;
  isAudio?: boolean;
  filePath?: string;
  isLive?: boolean;
}

export interface PlayerState {
  timePos: number;
  duration: number;
  pause: boolean;
  volume: number;
  mute: boolean;
  speed: number;
  buffering: boolean;
  seeking: boolean;
  eof: boolean;
  loaded: boolean;
  error: string | null;
  quality: string;
  isOffline?: boolean;
}

export interface DownloadItem {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string | null;
  url: string;
  filePath: string;
  fileSize: number;
  quality: string;
  isAudio?: boolean;
  downloadedAt: number;
}

export interface DownloadProgress {
  id: string;
  percent: number;
  totalSize?: string;
  speed?: string;
  eta?: string;
  status: 'downloading' | 'completed' | 'error';
  item?: DownloadItem;
  error?: string;
}

export interface Playlist {
  id: string;
  title: string;
  createdAt: number;
  videos: VideoItem[];
}

declare global {
  interface Window {
    kudtubeAPI: {
      platform?: string;
      searchVideos: (query: string, limit?: number) => Promise<{ ok: boolean; title?: string | null; results: VideoItem[]; error?: string }>;
      getCategoryFeed: (category: string, limit?: number) => Promise<{ ok: boolean; results: VideoItem[]; error?: string }>;
      startPlayer: (params: { url: string; quality?: string; startTime?: number; volume?: number; bounds?: { x: number; y: number; width: number; height: number }; isOffline?: boolean; isAudio?: boolean; isLive?: boolean }) => Promise<{ ok: boolean; error?: string }>;
      syncPlayerBounds: (bounds: { x: number; y: number; width: number; height: number; hidden?: boolean }) => Promise<{ ok: boolean }>;
      setPlayerVisible?: (visible: boolean) => Promise<{ ok: boolean }>;
      stopPlayer: () => Promise<{ ok: boolean }>;
      playerPlay: () => Promise<{ ok: boolean }>;
      playerPause: () => Promise<{ ok: boolean }>;
      playerTogglePlay: () => Promise<{ ok: boolean }>;
      playerSeek: (seconds: number) => Promise<{ ok: boolean }>;
      playerSetVolume: (volume: number) => Promise<{ ok: boolean }>;
      playerSetMute: (muted: boolean) => Promise<{ ok: boolean }>;
      playerSetQuality: (quality: string) => Promise<{ ok: boolean }>;
      playerSetSpeed: (speed: number) => Promise<{ ok: boolean }>;
      playerSetFullscreen: (fullscreen: boolean) => Promise<{ ok: boolean }>;
      playerNext: () => Promise<{ ok: boolean }>;
      onPlayerNext: (callback: () => void) => () => void;
      onPlayerFullscreenChange: (callback: (fullscreen: boolean) => void) => () => void;
      onPlayerState: (callback: (state: PlayerState) => void) => () => void;
      startDownload: (video: VideoItem, quality?: string) => Promise<{ ok: boolean; item?: DownloadItem; error?: string }>;
      cancelDownload: (videoId: string) => Promise<boolean>;
      deleteDownload: (videoId: string) => Promise<boolean>;
      getSavedDownloads: () => Promise<DownloadItem[]>;
      onDownloadProgress: (callback: (data: DownloadProgress) => void) => () => void;
      minimize?: () => Promise<void>;
      maximize?: () => Promise<void>;
      closeWindow?: () => Promise<void>;
      isMaximized?: () => Promise<boolean>;
    };
  }
}
