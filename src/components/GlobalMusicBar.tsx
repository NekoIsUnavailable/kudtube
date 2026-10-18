import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronUp,
  X,
  Music2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../utils/format';

interface GlobalMusicBarProps {
  onOpenMusicView?: () => void;
}

export const GlobalMusicBar: React.FC<GlobalMusicBarProps> = ({ onOpenMusicView }) => {
  const {
    currentTrack,
    playerState,
    togglePlay,
    nextTrack,
    prevTrack,
    closeMusic,
    setIsPlayerExpanded,
  } = useMusic();

  if (!currentTrack) return null;

  const progressPercent =
    playerState.duration > 0
      ? Math.min(100, Math.max(0, (playerState.timePos / playerState.duration) * 100))
      : 0;

  const handleExpand = () => {
    setIsPlayerExpanded(true);
    if (onOpenMusicView) {
      onOpenMusicView();
    }
  };

  return (
    <div
      onClick={handleExpand}
      className="fixed inset-x-0 bottom-[56px] md:bottom-0 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 shadow-2xl flex flex-col gap-1 select-none cursor-pointer hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors"
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
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 max-w-xs md:max-w-md">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#202020] flex-shrink-0 shadow-md">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music2 className="w-5 h-5 text-gray-400 m-auto mt-2" />
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
            <span className="font-bold text-xs sm:text-sm truncate text-black dark:text-white leading-tight">
              {currentTrack.title}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{currentTrack.channel}</span>
          </div>
        </div>

        {/* Center Controls: Prev, Play/Pause, Next */}
        <div className="flex items-center gap-1.5 sm:gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={prevTrack}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
            title="Previous track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="p-2 sm:p-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 shadow-md transition"
            title={playerState.pause ? 'Play' : 'Pause'}
          >
            {playerState.pause ? (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            ) : (
              <Pause className="w-4 h-4 fill-current" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
            title="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Right: Duration, Expand & Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5" onClick={(e) => e.stopPropagation()}>
          <span className="hidden sm:inline font-mono text-[11px] text-gray-500 dark:text-gray-400">
            {formatDuration(playerState.timePos)} / {formatDuration(playerState.duration)}
          </span>

          <button
            onClick={handleExpand}
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
            title="Expand Player"
          >
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={closeMusic}
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
            title="Close music player"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
