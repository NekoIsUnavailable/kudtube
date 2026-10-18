import React, { useState } from 'react';
import {
  ChevronDown,
  Film,
  ListPlus,
  Music2,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../utils/format';
import type { DownloadItem, VideoItem } from '../types';

interface ExpandedMusicPlayerProps {
  onPlayVideo?: (video: VideoItem) => void;
}

export const ExpandedMusicPlayer: React.FC<ExpandedMusicPlayerProps> = ({ onPlayVideo }) => {
  const {
    currentTrack,
    queue,
    playerState,
    isShuffle,
    isRepeat,
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
    setIsPlayerExpanded,
  } = useMusic();

  const [playerTab, setPlayerTab] = useState<'song' | 'video'>('song');
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack) return null;

  const progressPercent =
    playerState.duration > 0
      ? Math.min(100, Math.max(0, (playerState.timePos / playerState.duration) * 100))
      : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleSwitchToVideo = (track: DownloadItem) => {
    setIsPlayerExpanded(false);
    if (onPlayVideo) {
      onPlayVideo({
        id: track.id,
        title: track.title,
        channel: track.channel,
        duration: track.duration,
        thumbnail: track.thumbnail,
        url: track.filePath || track.url,
        isOffline: true,
        filePath: track.filePath,
      });
    }
  };

  const isLiked = likedSongs.includes(currentTrack.id);

  return (
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
                isLiked ? 'text-red-600' : 'text-gray-400 hover:text-black dark:hover:text-white'
              }`}
              title={isLiked ? 'Liked' : 'Like'}
            >
              <Heart
                className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`}
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
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition ${
                isShuffle ? 'text-red-600 bg-red-100 dark:bg-red-950/40' : 'text-gray-400 hover:text-black dark:hover:text-white'
              }`}
              title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={prevTrack}
              className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white hover:scale-110 active:scale-95 transition"
              title="Previous track"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={togglePlay}
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
              onClick={nextTrack}
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
              onClick={() => setMute(!playerState.mute)}
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
              onChange={handleVolumeChange}
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
              Up Next ({queue.length})
            </h3>
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
              {queue.map((track, i) => {
                const isCur = currentTrack.id === track.id;
                return (
                  <div
                    key={`queue_${track.id}_${i}`}
                    onClick={() => playTrack(track)}
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
  );
};
