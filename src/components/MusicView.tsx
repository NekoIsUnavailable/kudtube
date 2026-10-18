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
} from 'lucide-react';
import type { DownloadItem, VideoItem, Playlist, PlayerState } from '../types';
import { formatDuration } from '../utils/format';

interface MusicViewProps {
  onPlaySong: (video: VideoItem) => void;
}

const MUSIC_PLAYLISTS_KEY = 'kudtube_music_playlists';

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

export const MusicView: React.FC<MusicViewProps> = ({ onPlaySong }) => {
  const [songs, setSongs] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>('songs');
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Active playing audio state
  const [currentTrack, setCurrentTrack] = useState<DownloadItem | null>(null);
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

  const [isRepeat, setIsRepeat] = useState(false);
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
      if (isRepeat) {
        handlePlayTrack(currentTrackRef.current);
        return;
      }
      handleNextTrack();
    }
  }, [playerState.eof, isRepeat]);

  const handlePlayTrack = async (track: DownloadItem) => {
    setCurrentTrack(track);
    const videoItem: VideoItem = {
      id: track.id,
      title: track.title,
      channel: track.channel,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.filePath,
      isOffline: true,
      isAudio: true,
      filePath: track.filePath,
    };

    onPlaySong(videoItem);

    if (window.kudtubeAPI?.startPlayer) {
      await window.kudtubeAPI.startPlayer({
        url: track.filePath,
        volume: playerState.volume,
        isOffline: true,
      });
    }
  };

  const handleNextTrack = () => {
    const list = activePlaylist ? activePlaylist.videos.map((v) => ({
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
    const list = activePlaylist ? activePlaylist.videos.map((v) => ({
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

  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.kudtubeAPI?.deleteDownload) {
      await window.kudtubeAPI.deleteDownload(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (currentTrack?.id === id) {
        window.kudtubeAPI?.stopPlayer();
        setCurrentTrack(null);
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

  const progressPercent = playerState.duration > 0
    ? Math.min(100, Math.max(0, (playerState.timePos / playerState.duration) * 100))
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 pb-36">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-[#272727]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 shadow-sm">
            <Music2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">
              Music Player & MP3s
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {songs.length} offline audio tracks • Playlists for Android & Desktop
            </p>
          </div>
        </div>

        {/* Tab switchers & New Playlist */}
        <div className="flex items-center gap-2">
          <div className="bg-[#f2f2f2] dark:bg-[#202020] p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('songs');
                setActivePlaylist(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'songs'
                  ? 'bg-white dark:bg-[#333333] text-black dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All Tracks
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'playlists'
                  ? 'bg-white dark:bg-[#333333] text-black dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Playlists ({playlists.length})
            </button>
          </div>

          <button
            onClick={() => setShowNewPlaylistModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading audio tracks...</div>
      ) : activeTab === 'playlists' && !activePlaylist ? (
        /* Playlists Grid */
        <div>
          {playlists.length === 0 ? (
            <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
              <Music2 className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-semibold">No music playlists yet.</p>
              <p className="text-xs text-gray-500 mt-1">Create a playlist and add your downloaded songs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl)}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#282828] hover:border-pink-500 dark:hover:border-pink-500 cursor-pointer transition flex items-center gap-3.5 group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Disc3 className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate text-black dark:text-white group-hover:text-pink-500 transition-colors">
                      {pl.title}
                    </h4>
                    <p className="text-xs text-gray-500">{pl.videos.length} tracks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Songs List (All or Active Playlist) */
        <div className="flex flex-col gap-2">
          {activePlaylist && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-[#222]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 cursor-pointer hover:underline" onClick={() => setActivePlaylist(null)}>
                  Playlists
                </span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-xs font-bold text-pink-500">{activePlaylist.title}</span>
              </div>
            </div>
          )}

          {songs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
              <Music2 className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-semibold">No downloaded MP3s found.</p>
              <p className="text-xs text-gray-500 mt-1">
                To download music, click "Download" &gt; "Audio Only (MP3)" on any video!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#202020]">
              {(activePlaylist ? activePlaylist.videos : songs).map((track, idx) => {
                const isPlaying = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayTrack(track as DownloadItem)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition group ${
                      isPlaying
                        ? 'bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40'
                        : 'hover:bg-gray-100 dark:hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-xs font-mono text-gray-400 w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#282828] flex-shrink-0">
                        {track.thumbnail ? (
                          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music2 className="w-5 h-5 text-gray-400 m-auto mt-3" />
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
                            isPlaying ? 'text-pink-600 dark:text-pink-400' : 'text-black dark:text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {track.channel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {track.duration > 0 && (
                        <span className="text-xs font-mono text-gray-400">
                          {formatDuration(track.duration)}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddSongModalItem(track as DownloadItem);
                        }}
                        className="p-1.5 text-gray-400 hover:text-pink-500 transition rounded"
                        title="Add to Playlist"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteSong(track.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition rounded"
                        title="Delete track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Bottom Audio Player Bar */}
      {currentTrack && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#272727] px-4 py-2.5 shadow-2xl flex flex-col gap-1.5 select-none">
          {/* Scrubber Range Bar with Red Progress Trail */}
          <div className="relative flex items-center group/scrubber cursor-pointer">
            <input
              type="range"
              min={0}
              max={playerState.duration || 100}
              value={playerState.timePos || 0}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${progressPercent}%, rgba(120, 120, 120, 0.3) ${progressPercent}%, rgba(120, 120, 120, 0.3) 100%)`,
              }}
              className="w-full h-1 appearance-none cursor-pointer rounded-lg accent-red-600 hover:h-1.5 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            {/* Left Track Info */}
            <div className="flex items-center gap-3 min-w-0 max-w-xs md:max-w-md">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#282828] flex-shrink-0 shadow">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                )}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-bold text-sm truncate text-black dark:text-white leading-tight">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-gray-500 truncate">{currentTrack.channel}</span>
              </div>
            </div>

            {/* Center Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsShuffle((p) => !p)}
                className={`p-1.5 rounded transition ${
                  isShuffle ? 'text-pink-500' : 'text-gray-400 hover:text-black dark:hover:text-white'
                }`}
                title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrevTrack}
                className="p-1.5 text-gray-700 dark:text-gray-200 hover:text-pink-500 transition"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => window.kudtubeAPI?.playerTogglePlay()}
                className="p-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-md transition"
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
                className="p-1.5 text-gray-700 dark:text-gray-200 hover:text-pink-500 transition"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat((p) => !p)}
                className={`p-1.5 rounded transition ${
                  isRepeat ? 'text-pink-500' : 'text-gray-400 hover:text-black dark:hover:text-white'
                }`}
                title={isRepeat ? 'Repeat track enabled' : 'Repeat track disabled'}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Time & Volume */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-gray-500">
                {formatDuration(playerState.timePos)} / {formatDuration(playerState.duration)}
              </span>

              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => window.kudtubeAPI?.playerSetMute(!playerState.mute)}
                  className="p-1 text-gray-500 hover:text-black dark:hover:text-white transition"
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
                  className="w-16 h-1 rounded appearance-none cursor-pointer accent-pink-600 bg-gray-300 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Playlist Modal */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-black dark:text-white mb-3">Create Music Playlist</h3>
            <input
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="Playlist name (e.g. Gym, Chill)..."
              className="w-full rounded-xl border border-gray-300 dark:border-[#404040] bg-gray-50 dark:bg-[#121212] px-3.5 py-2 text-sm text-black dark:text-white outline-none focus:border-pink-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewPlaylistModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2b2b] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Song to Playlist Modal */}
      {addSongModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-black dark:text-white mb-2 truncate">
              Add "{addSongModalItem.title}" to:
            </h3>
            <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 my-3">
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No playlists yet. Create one first!</p>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950/20 text-xs font-semibold text-black dark:text-white transition flex items-center justify-between"
                  >
                    <span className="truncate">{pl.title}</span>
                    <span className="text-[11px] text-gray-400">{pl.videos.length} tracks</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setAddSongModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2b2b] transition"
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
