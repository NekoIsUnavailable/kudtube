import React, { useEffect, useState, useRef } from 'react';
import {
  Music2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ListPlus,
  Trash2,
  Repeat,
  Shuffle,
  Plus,
  Disc3,
  ChevronDown,
  ChevronUp,
  Heart,
  Film,
  Sparkles,
  Headphones,
} from 'lucide-react';
import type { DownloadItem, VideoItem, Playlist, PlayerState } from '../types';
import { formatDuration } from '../utils/format';

interface MusicViewProps {
  onPlaySong: (video: VideoItem) => void;
}

const MUSIC_PLAYLISTS_KEY = 'kudtube_music_playlists';
const MUSIC_LIKES_KEY = 'kudtube_music_likes';

function getMusicPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(MUSIC_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMusicPlaylists(pls: Playlist[]) {
  try {
    localStorage.setItem(MUSIC_PLAYLISTS_KEY, JSON.stringify(pls));
  } catch {}
}

function getLikedSongs(): string[] {
  try {
    const raw = localStorage.getItem(MUSIC_LIKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLikedSongs(likes: string[]) {
  try {
    localStorage.setItem(MUSIC_LIKES_KEY, JSON.stringify(likes));
  } catch {}
}

export const MusicView: React.FC<MusicViewProps> = ({ onPlaySong }) => {
  const [songs, setSongs] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'quick_picks' | 'playlists'>('all');
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Active playing audio state
  const [currentTrack, setCurrentTrack] = useState<DownloadItem | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [playerTab, setPlayerTab] = useState<'song' | 'video'>('song');
  const [showQueue, setShowQueue] = useState(false);
  const [likedSongs, setLikedSongs] = useState<string[]>(() => getLikedSongs());

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

  const [isRepeat, setIsRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [addSongModalItem, setAddSongModalItem] = useState<DownloadItem | null>(null);

  const songsRef = useRef<DownloadItem[]>([]);
  songsRef.current = songs;
  const currentTrackRef = useRef<DownloadItem | null>(null);
  currentTrackRef.current = currentTrack;

  // Fetch downloaded songs
  const fetchSongs = async () => {
    setLoading(true);
    if (window.kudtubeAPI?.getSavedDownloads) {
      const all = await window.kudtubeAPI.getSavedDownloads();
      // Filter for audio tracks or mp3 files
      const audioOnly = all.filter(
        (item) =>
          item.isAudio ||
          item.quality === 'audio' ||
          item.filePath?.toLowerCase().endsWith('.mp3') ||
          item.filePath?.toLowerCase().endsWith('.m4a') ||
          item.filePath?.toLowerCase().endsWith('.wav') ||
          item.filePath?.toLowerCase().endsWith('.flac')
      );
      setSongs(audioOnly);
    }
    setPlaylists(getMusicPlaylists());
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Sync player state
  useEffect(() => {
    const unsub = window.kudtubeAPI?.onPlayerState?.((st) => {
      setPlayerState(st);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Handle track auto-advance on EOF
  useEffect(() => {
    if (playerState.eof && currentTrackRef.current) {
      if (isRepeat === 'one') {
        handlePlayTrack(currentTrackRef.current);
        return;
      }
      handleNextTrack();
    }
  }, [playerState.eof, isRepeat]);

  const getCurrentQueue = (): DownloadItem[] => {
    if (activePlaylist && activePlaylist.videos.length > 0) {
      return activePlaylist.videos.map((v) => ({
        id: v.id,
        title: v.title,
        channel: v.channel,
        duration: v.duration,
        thumbnail: v.thumbnail,
        url: v.url,
        filePath: v.filePath || v.url,
        fileSize: 0,
        quality: 'audio',
        downloadedAt: 0,
      }));
    }
    return songs;
  };

  const handlePlayTrack = async (track: DownloadItem) => {
    setCurrentTrack(track);

    // Audio-only playback: pass isAudio=true and NO bounds
    // to prevent any overlay window or dark box from spawning!
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

  const handleNextTrack = () => {
    const list = getCurrentQueue();
    if (list.length === 0 || !currentTrack) return;

    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * list.length);
      handlePlayTrack(list[randomIdx]);
      return;
    }

    const curIdx = list.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (curIdx + 1) % list.length;
    handlePlayTrack(list[nextIdx]);
  };

  const handlePrevTrack = () => {
    const list = getCurrentQueue();
    if (list.length === 0 || !currentTrack) return;
    const curIdx = list.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (curIdx - 1 + list.length) % list.length;
    handlePlayTrack(list[prevIdx]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSeek(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSetVolume(val);
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedSongs((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveLikedSongs(next);
      return next;
    });
  };

  const toggleRepeat = () => {
    setIsRepeat((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.kudtubeAPI?.deleteDownload) {
      await window.kudtubeAPI.deleteDownload(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (currentTrack?.id === id) {
        window.kudtubeAPI?.stopPlayer();
        setCurrentTrack(null);
        setIsPlayerExpanded(false);
      }
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return;
    const newPl: Playlist = {
      id: `pl_music_${Date.now()}`,
      title: newPlaylistTitle.trim(),
      createdAt: Date.now(),
      videos: [],
    };
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    saveMusicPlaylists(updated);
    setNewPlaylistTitle('');
    setShowNewPlaylistModal(false);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!addSongModalItem) return;
    const videoItem: VideoItem = {
      id: addSongModalItem.id,
      title: addSongModalItem.title,
      channel: addSongModalItem.channel,
      duration: addSongModalItem.duration,
      thumbnail: addSongModalItem.thumbnail,
      url: addSongModalItem.filePath,
      isOffline: true,
      isAudio: true,
      filePath: addSongModalItem.filePath,
    };

    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        const exists = pl.videos.some((v) => v.id === videoItem.id);
        if (!exists) {
          return { ...pl, videos: [...pl.videos, videoItem] };
        }
      }
      return pl;
    });

    setPlaylists(updated);
    saveMusicPlaylists(updated);
    setAddSongModalItem(null);
  };

  // Switch to Video Watch Mode
  const handleSwitchToVideo = (track: DownloadItem) => {
    setIsPlayerExpanded(false);
    onPlaySong({
      id: track.id,
      title: track.title,
      channel: track.channel,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.filePath,
      isOffline: true,
      filePath: track.filePath,
    });
  };

  const progressPercent = playerState.duration > 0
    ? Math.min(100, Math.max(0, (playerState.timePos / playerState.duration) * 100))
    : 0;

  const quickPicks = songs.slice(0, 8);
  const displaySongs = activePlaylist ? activePlaylist.videos.map((v) => ({
    id: v.id,
    title: v.title,
    channel: v.channel,
    duration: v.duration,
    thumbnail: v.thumbnail,
    url: v.url,
    filePath: v.filePath || v.url,
    fileSize: 0,
    quality: 'audio',
    downloadedAt: 0,
  })) : songs;

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] text-black dark:text-white selection:bg-red-600 selection:text-white pb-36 transition-colors">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-red-500/10 dark:from-red-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Header (Cleaned of fluff text and offline library label) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white flex items-center gap-1.5">
                  Kud<span className="text-red-600">Music</span>
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                {songs.length} audio {songs.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setActiveFilter('all');
                setActivePlaylist(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'all' && !activePlaylist
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20'
              }`}
            >
              All Songs
            </button>
            <button
              onClick={() => {
                setActiveFilter('quick_picks');
                setActivePlaylist(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'quick_picks'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20'
              }`}
            >
              Quick Picks
            </button>
            <button
              onClick={() => {
                setActiveFilter('playlists');
                setActivePlaylist(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'playlists'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20'
              }`}
            >
              Playlists ({playlists.length})
            </button>
            <button
              onClick={() => setShowNewPlaylistModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Playlist</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 text-sm">
            <Disc3 className="w-8 h-8 mx-auto animate-spin text-red-500 mb-3" />
            Loading music library...
          </div>
        ) : songs.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-20 px-4 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02] max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800/30">
              <Music2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-1.5">No MP3s found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              To download songs, click "Download" &gt; "Audio Only (MP3)" on any video!
            </p>
          </div>
        ) : (
          <>
            {/* 1. QUICK PICKS SHELF */}
            {(activeFilter === 'all' || activeFilter === 'quick_picks') && !activePlaylist && quickPicks.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-black dark:text-white flex items-center gap-2">
                    Quick Picks <Sparkles className="w-4 h-4 text-red-600" />
                  </h2>
                  {activeFilter !== 'quick_picks' && (
                    <button
                      onClick={() => setActiveFilter('quick_picks')}
                      className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                    >
                      See all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {quickPicks.map((track) => {
                    const isPlaying = currentTrack?.id === track.id;
                    return (
                      <div
                        key={`quick_${track.id}`}
                        onClick={() => handlePlayTrack(track)}
                        className="group relative flex flex-col p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:border-white/5 dark:hover:border-white/15 cursor-pointer transition-all duration-200 shadow-sm"
                      >
                        {/* Square Album Cover */}
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-200 dark:bg-[#181818] mb-3 shadow-md">
                          {track.thumbnail ? (
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                              <Music2 className="w-8 h-8" />
                            </div>
                          )}

                          {/* Floating Circular Play Overlay */}
                          <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all ${
                              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white text-black shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                              {isPlaying && !playerState.pause ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              )}
                            </div>
                          </div>

                          {/* Playing Equalizer Indicator Badge */}
                          {isPlaying && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-red-500/40 flex items-center gap-1">
                              <span className="w-1 bg-red-500 rounded-full animate-eq-1" />
                              <span className="w-1 bg-red-500 rounded-full animate-eq-2" />
                              <span className="w-1 bg-red-500 rounded-full animate-eq-3" />
                            </div>
                          )}
                        </div>

                        {/* Song Title & Artist */}
                        <h4
                          className={`text-sm font-bold truncate leading-tight mb-1 ${
                            isPlaying ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{track.channel}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. PLAYLISTS VIEW */}
            {activeFilter === 'playlists' && !activePlaylist && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-black dark:text-white">Your Playlists</h2>
                </div>

                {playlists.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/[0.02]">
                    <Music2 className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm font-semibold text-black dark:text-white">No playlists created yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "+ New Playlist" to group your favorite songs together.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => setActivePlaylist(pl)}
                        className="group p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:border-white/5 hover:border-red-500/30 cursor-pointer transition flex items-center gap-3.5 shadow-sm"
                      >
                        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-500 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform border border-red-200 dark:border-red-800/30">
                          <Disc3 className="w-7 h-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {pl.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pl.videos.length} tracks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 3. TRACKLIST TABLE */}
            {(activeFilter === 'all' || activePlaylist) && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  {activePlaylist ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActivePlaylist(null)}
                        className="text-xs text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition font-medium"
                      >
                        Playlists
                      </button>
                      <span className="text-xs text-gray-400 dark:text-gray-600">/</span>
                      <h2 className="text-lg font-black text-black dark:text-white">{activePlaylist.title}</h2>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({activePlaylist.videos.length} songs)</span>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-black dark:text-white">All Songs</h2>
                    </div>
                  )}
                </div>

                {/* Tracklist Rows */}
                <div className="divide-y divide-gray-100 border-t border-b border-gray-200 dark:divide-white/5 dark:border-white/5">
                  {displaySongs.map((track, idx) => {
                    const isPlaying = currentTrack?.id === track.id;
                    const isLiked = likedSongs.includes(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => handlePlayTrack(track as DownloadItem)}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all group ${
                          isPlaying
                            ? 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-500/30 shadow-inner'
                            : 'hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        {/* Left: Index / Equalizer + Thumbnail + Title + Channel */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                          <div className="w-6 flex items-center justify-center flex-shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">
                            {isPlaying && !playerState.pause ? (
                              <div className="flex items-end gap-0.5 h-3.5">
                                <span className="w-1 bg-red-600 rounded-full animate-eq-1" />
                                <span className="w-1 bg-red-600 rounded-full animate-eq-2" />
                                <span className="w-1 bg-red-600 rounded-full animate-eq-3" />
                              </div>
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#181818] flex-shrink-0 shadow">
                            {track.thumbnail ? (
                              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                            ) : (
                              <Music2 className="w-5 h-5 text-gray-400 dark:text-gray-500 m-auto mt-3" />
                            )}
                            <div
                              className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                                isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {isPlaying && !playerState.pause ? (
                                <Pause className="w-4 h-4 text-white fill-current" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex flex-col justify-center">
                            <h4
                              className={`text-sm font-semibold truncate leading-tight ${
                                isPlaying ? 'text-red-600 dark:text-red-400 font-bold' : 'text-black dark:text-white'
                              }`}
                            >
                              {track.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                              <span className="truncate">{track.channel}</span>
                              <span>•</span>
                              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">MP3</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Duration & Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Heart / Like Button */}
                          <button
                            onClick={(e) => toggleLike(track.id, e)}
                            className={`p-2 rounded-full transition ${
                              isLiked
                                ? 'text-red-600'
                                : 'text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                            title={isLiked ? 'Liked' : 'Like'}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </button>

                          {/* Duration */}
                          {track.duration > 0 && (
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12 text-right">
                              {formatDuration(track.duration)}
                            </span>
                          )}

                          {/* Add to Playlist */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddSongModalItem(track as DownloadItem);
                            }}
                            className="p-2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition rounded-full opacity-0 group-hover:opacity-100"
                            title="Add to Playlist"
                          >
                            <ListPlus className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteSong(track.id, e)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 transition rounded-full opacity-0 group-hover:opacity-100"
                            title="Delete track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* 4. COLLAPSED MINI-PLAYER DOCK */}
      {currentTrack && !isPlayerExpanded && (
        <div
          onClick={() => setIsPlayerExpanded(true)}
          className="fixed inset-x-0 bottom-[56px] md:bottom-0 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-4 py-2 shadow-2xl flex flex-col gap-1 select-none cursor-pointer hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors"
        >
          {/* Top Edge Red Progress Scrubber Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-white/10">
            <div
              className="h-full bg-red-600 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            {/* Left Track Info */}
            <div className="flex items-center gap-3 min-w-0 max-w-xs md:max-w-md">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#202020] flex-shrink-0 shadow-md">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                )}
                {!playerState.pause && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-red-500 rounded-full animate-eq-1" />
                      <span className="w-0.5 bg-red-500 rounded-full animate-eq-2" />
                      <span className="w-0.5 bg-red-500 rounded-full animate-eq-3" />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-bold text-sm truncate text-black dark:text-white leading-tight">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentTrack.channel}</span>
              </div>
            </div>

            {/* Center Controls: Prev, Play/Pause, Next */}
            <div className="flex items-center gap-2 sm:gap-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handlePrevTrack}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => window.kudtubeAPI?.playerTogglePlay()}
                className="p-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 shadow-md transition"
                title={playerState.pause ? 'Play' : 'Pause'}
              >
                {playerState.pause ? (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                ) : (
                  <Pause className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Right: Expand to Full Player Button */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-mono text-[11px] text-gray-500 dark:text-gray-400">
                {formatDuration(playerState.timePos)} / {formatDuration(playerState.duration)}
              </span>

              <button
                onClick={() => setIsPlayerExpanded(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
                title="Expand Player"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FULL EXPANDED NOW PLAYING VIEW */}
      {currentTrack && isPlayerExpanded && (
        <div className="fixed inset-0 z-50 bg-[#fafafa] dark:bg-[#030303] text-black dark:text-white flex flex-col justify-between overflow-y-auto selection:bg-red-600 transition-colors">
          {/* Ambient Album Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-100/40 via-gray-100 to-gray-50 dark:from-red-950/30 dark:via-[#0a0a0a] dark:to-[#030303] pointer-events-none" />

          {/* Top Bar: Down Chevron, [Song | Video] Switch, Queue button */}
          <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-200 dark:border-white/5">
            <button
              onClick={() => setIsPlayerExpanded(false)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
              title="Minimize player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* [ Song | Video ] Toggle Pill */}
            <div className="bg-gray-200 dark:bg-[#181818] p-1 rounded-full flex items-center border border-gray-300 dark:border-white/10 shadow-lg">
              <button
                onClick={() => setPlayerTab('song')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  playerTab === 'song'
                    ? 'bg-white text-black shadow dark:bg-white dark:text-black'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Song
              </button>
              <button
                onClick={() => handleSwitchToVideo(currentTrack)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all"
                title="Watch Video"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>
            </div>

            <button
              onClick={() => setShowQueue((q) => !q)}
              className={`p-2 rounded-full transition ${
                showQueue
                  ? 'bg-black text-white dark:bg-white/20 dark:text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
              title="Toggle Up Next Queue"
            >
              <ListPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 sm:p-10 max-w-5xl mx-auto w-full gap-8 lg:gap-14">
            {/* Left: Big Album Artwork with Ambient Shadow */}
            <div className="relative aspect-square w-64 sm:w-80 lg:w-96 rounded-3xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-[#121212] flex-shrink-0 border border-gray-200 dark:border-white/10">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover shadow-inner"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <Music2 className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Right: Info, Controls, Up Next Drawer */}
            <div className="flex-1 flex flex-col justify-center w-full max-w-md">
              {/* Title & Channel */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white leading-tight truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {currentTrack.channel}
                  </p>
                </div>
                <button
                  onClick={(e) => toggleLike(currentTrack.id, e)}
                  className={`p-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition ${
                    likedSongs.includes(currentTrack.id) ? 'text-red-600' : 'text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                  title="Like"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      likedSongs.includes(currentTrack.id) ? 'fill-current' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Scrubber Range Bar */}
              <div className="flex flex-col gap-1 mb-6">
                <input
                  type="range"
                  min={0}
                  max={playerState.duration || 100}
                  value={playerState.timePos || 0}
                  onChange={handleSeek}
                  style={{
                    background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${progressPercent}%, rgba(120, 120, 120, 0.25) ${progressPercent}%, rgba(120, 120, 120, 0.25) 100%)`,
                  }}
                  className="w-full h-1.5 appearance-none cursor-pointer rounded-full accent-red-600 hover:h-2 transition-all"
                />
                <div className="flex justify-between text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formatDuration(playerState.timePos)}</span>
                  <span>{formatDuration(playerState.duration)}</span>
                </div>
              </div>

              {/* Primary Playback Controls */}
              <div className="flex items-center justify-between mb-8 px-2">
                <button
                  onClick={() => setIsShuffle((s) => !s)}
                  className={`p-2 rounded-full transition ${
                    isShuffle ? 'text-red-600 bg-red-100 dark:bg-red-950/40' : 'text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePrevTrack}
                  className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white hover:scale-110 active:scale-95 transition"
                  title="Previous track"
                >
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={() => window.kudtubeAPI?.playerTogglePlay()}
                  className="w-16 h-16 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center font-bold transition-all"
                  title={playerState.pause ? 'Play' : 'Pause'}
                >
                  {playerState.pause ? (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  ) : (
                    <Pause className="w-7 h-7 fill-current" />
                  )}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white hover:scale-110 active:scale-95 transition"
                  title="Next track"
                >
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-2 rounded-full transition relative ${
                    isRepeat !== 'off' ? 'text-red-600 bg-red-100 dark:bg-red-950/40' : 'text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={`Repeat: ${isRepeat}`}
                >
                  <Repeat className="w-5 h-5" />
                  {isRepeat === 'one' && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-red-600 text-white rounded-full px-1">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* Volume Slider (Desktop) */}
              <div className="hidden sm:flex items-center gap-3 bg-gray-100 dark:bg-white/[0.04] p-3 rounded-2xl border border-gray-200 dark:border-white/5">
                <button
                  onClick={() => window.kudtubeAPI?.playerSetMute(!playerState.mute)}
                  className="p-1 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition"
                >
                  {playerState.mute || playerState.volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={playerState.mute ? 0 : playerState.volume}
                  onChange={handleVolume}
                  className="w-full h-1 appearance-none cursor-pointer rounded-full accent-red-600 bg-gray-300 dark:bg-white/20"
                />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-8 text-right">
                  {playerState.mute ? 0 : playerState.volume}%
                </span>
              </div>
            </div>
          </div>

          {/* Up Next Drawer */}
          {showQueue && (
            <div className="relative z-20 max-w-3xl mx-auto w-full px-6 pb-8">
              <div className="p-4 rounded-3xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-2">
                  Up Next ({getCurrentQueue().length})
                </h3>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                  {getCurrentQueue().map((track, i) => {
                    const isCur = currentTrack.id === track.id;
                    return (
                      <div
                        key={`queue_${track.id}_${i}`}
                        onClick={() => handlePlayTrack(track)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isCur
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : 'hover:bg-gray-100 text-black dark:hover:bg-white/[0.05] dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-center">
                            {isCur ? '▶' : i + 1}
                          </span>
                          <span className="text-sm font-semibold truncate">{track.title}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CREATE PLAYLIST MODAL */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 p-5 shadow-2xl text-black dark:text-white">
            <h3 className="text-base font-bold mb-3">Create Playlist</h3>
            <input
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="Playlist name..."
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d0d] px-3.5 py-2 text-sm text-black dark:text-white outline-none focus:border-red-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewPlaylistModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD SONG TO PLAYLIST MODAL */}
      {addSongModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 p-5 shadow-2xl text-black dark:text-white">
            <h3 className="text-base font-bold mb-2 truncate">
              Add "{addSongModalItem.title}" to:
            </h3>
            <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 my-3">
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No playlists yet. Create one first!</p>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-black dark:text-white transition flex items-center justify-between"
                  >
                    <span className="truncate">{pl.title}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{pl.videos.length} tracks</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setAddSongModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
