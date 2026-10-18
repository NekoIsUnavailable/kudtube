import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { DownloadItem, PlayerState } from '../types';

const MUSIC_LIKES_KEY = 'kudtube_music_likes';

function getStoredLikes(): string[] {
  try {
    const raw = localStorage.getItem(MUSIC_LIKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLikes(likes: string[]) {
  try {
    localStorage.setItem(MUSIC_LIKES_KEY, JSON.stringify(likes));
  } catch {}
}

interface MusicContextType {
  currentTrack: DownloadItem | null;
  queue: DownloadItem[];
  playerState: PlayerState;
  isShuffle: boolean;
  isRepeat: 'off' | 'all' | 'one';
  isPlayerExpanded: boolean;
  likedSongs: string[];
  playTrack: (track: DownloadItem, newQueue?: DownloadItem[]) => Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMute: (mute: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (id: string, e?: React.MouseEvent) => void;
  closeMusic: (stopMpv?: boolean) => void;
  setIsPlayerExpanded: (expanded: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<DownloadItem | null>(null);
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [likedSongs, setLikedSongs] = useState<string[]>(() => getStoredLikes());

  const [playerState, setPlayerState] = useState<PlayerState>({
    timePos: 0,
    duration: 0,
    pause: false,
    volume: 100,
    mute: false,
    speed: 1,
    buffering: false,
    seeking: false,
    eof: false,
    loaded: false,
    error: null,
    quality: 'audio',
    isOffline: true,
  });

  const currentTrackRef = useRef<DownloadItem | null>(null);
  currentTrackRef.current = currentTrack;
  const queueRef = useRef<DownloadItem[]>([]);
  queueRef.current = queue;
  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;
  const isRepeatRef = useRef(isRepeat);
  isRepeatRef.current = isRepeat;

  // Listen to MPV player state updates
  useEffect(() => {
    const unsub = window.kudtubeAPI?.onPlayerState?.((st) => {
      setPlayerState(st);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const playTrack = async (track: DownloadItem, newQueue?: DownloadItem[]) => {
    setCurrentTrack(track);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    }

    if (window.kudtubeAPI?.startPlayer) {
      await window.kudtubeAPI.startPlayer({
        url: track.filePath || track.url,
        quality: 'audio',
        volume: playerState.volume || 100,
        isOffline: true,
        isAudio: true,
      });
    }
  };

  const nextTrack = () => {
    const cur = currentTrackRef.current;
    const q = queueRef.current;
    if (!cur || q.length === 0) return;

    if (isShuffleRef.current) {
      const randomIdx = Math.floor(Math.random() * q.length);
      playTrack(q[randomIdx]);
      return;
    }

    const idx = q.findIndex((t) => t.id === cur.id);
    const nextIdx = (idx + 1) % q.length;
    playTrack(q[nextIdx]);
  };

  const prevTrack = () => {
    const cur = currentTrackRef.current;
    const q = queueRef.current;
    if (!cur || q.length === 0) return;

    const idx = q.findIndex((t) => t.id === cur.id);
    const prevIdx = (idx - 1 + q.length) % q.length;
    playTrack(q[prevIdx]);
  };

  // Handle auto-advance on track EOF
  useEffect(() => {
    if (playerState.eof && currentTrackRef.current) {
      if (isRepeatRef.current === 'one') {
        playTrack(currentTrackRef.current);
        return;
      }
      nextTrack();
    }
  }, [playerState.eof]);

  const togglePlay = () => {
    window.kudtubeAPI?.playerTogglePlay();
  };

  const seek = (seconds: number) => {
    window.kudtubeAPI?.playerSeek(seconds);
  };

  const setVolume = (volume: number) => {
    window.kudtubeAPI?.playerSetVolume(volume);
  };

  const setMute = (mute: boolean) => {
    window.kudtubeAPI?.playerSetMute(mute);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setIsRepeat((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedSongs((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveStoredLikes(next);
      return next;
    });
  };

  const closeMusic = (stopMpv: boolean = true) => {
    if (stopMpv) {
      window.kudtubeAPI?.stopPlayer();
    }
    setCurrentTrack(null);
    setIsPlayerExpanded(false);
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        queue,
        playerState,
        isShuffle,
        isRepeat,
        isPlayerExpanded,
        likedSongs,
        playTrack,
        nextTrack,
        prevTrack,
        togglePlay,
        seek,
        setVolume,
        setMute,
        toggleShuffle,
        toggleRepeat,
        toggleLike,
        closeMusic,
        setIsPlayerExpanded,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within a MusicProvider');
  return ctx;
};
