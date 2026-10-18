import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Check,
} from 'lucide-react';
import type { PlayerState } from './types';
import { formatDuration } from './utils/format';

export const PlayerOverlay: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    timePos: 0,
    duration: 0,
    pause: false,
    volume: 100,
    mute: false,
    speed: 1,
    buffering: true,
    seeking: false,
    eof: false,
    loaded: false,
    error: null,
    quality: '1080p',
  });

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsubState = window.kudtubeAPI?.onPlayerState((state) => {
      setPlayerState(state);
    });
    const unsubFs = window.kudtubeAPI?.onPlayerFullscreenChange?.((fs) => {
      setIsFullscreen(fs);
    });
    return () => {
      if (unsubState) unsubState();
      if (unsubFs) unsubFs();
    };
  }, []);

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!playerState.pause) {
        setControlsVisible(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }
    }, 2800);
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.kudtubeAPI?.playerTogglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSeek(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSetVolume(val);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.kudtubeAPI?.playerSetMute(!playerState.mute);
  };

  const handleQuality = (q: string) => {
    setShowQualityMenu(false);
    try {
      localStorage.setItem('kudtube_preferred_quality', q);
    } catch {}
    window.kudtubeAPI?.playerSetQuality(q);
  };

  const handleSpeed = (s: number) => {
    setShowSpeedMenu(false);
    window.kudtubeAPI?.playerSetSpeed(s);
  };

  const handleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !isFullscreen;
    setIsFullscreen(next);
    window.kudtubeAPI?.playerSetFullscreen(next);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.kudtubeAPI?.playerNext();
  };

  // YouTube Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        window.kudtubeAPI?.playerTogglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        handleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        window.kudtubeAPI?.playerSetMute(!playerState.mute);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        window.kudtubeAPI?.playerSeek(Math.min(playerState.duration || 0, playerState.timePos + 5));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        window.kudtubeAPI?.playerSeek(Math.max(0, playerState.timePos - 5));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.kudtubeAPI?.playerSetVolume(Math.min(100, playerState.volume + 5));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.kudtubeAPI?.playerSetVolume(Math.max(0, playerState.volume - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerState, isFullscreen]);

  const progressPercent = playerState.duration > 0
    ? Math.min(100, Math.max(0, (playerState.timePos / playerState.duration) * 100))
    : 0;

  const volumePercent = playerState.mute ? 0 : playerState.volume;

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => handlePlayPause()}
      onDoubleClick={handleFullscreen}
      className="w-screen h-screen relative select-none cursor-pointer overflow-hidden bg-transparent"
    >
      {/* Buffering Spinner */}
      {playerState.buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Notice */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center">
          <p className="text-sm text-red-400 font-semibold">{playerState.error}</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-4 pb-3 pt-10 flex flex-col gap-2 transition-opacity duration-300 ${
          controlsVisible || playerState.pause ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Range Bar with Red Progress Trail */}
        <div className="relative flex items-center group/scrubber cursor-pointer">
          <input
            type="range"
            min={0}
            max={playerState.duration || 100}
            value={playerState.timePos || 0}
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%, rgba(255, 255, 255, 0.25) 100%)`,
            }}
            className="w-full h-1 appearance-none cursor-pointer rounded-lg accent-red-600 hover:h-1.5 transition-all"
          />
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between text-white text-xs select-none">
          {/* Left: Play/Pause, Next, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="p-1 hover:text-red-500 transition"
              title={playerState.pause ? 'Play (k / Space)' : 'Pause (k / Space)'}
            >
              {playerState.pause ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={handleNext}
              className="p-1 hover:text-red-500 transition"
              title="Next video"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={handleToggleMute} className="p-1 hover:text-red-500 transition" title="Mute (m)">
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
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volumePercent}%, rgba(255, 255, 255, 0.25) ${volumePercent}%, rgba(255, 255, 255, 0.25) 100%)`,
                }}
                className="w-16 h-1 rounded appearance-none cursor-pointer accent-white"
              />
            </div>

            <span className="text-[11px] font-mono text-gray-300 ml-1">
              {formatDuration(playerState.timePos)} / {formatDuration(playerState.duration)}
            </span>
          </div>

          {/* Right: Quality, Speed, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Quality Menu (Hidden for offline / downloaded files) */}
            {!playerState.isOffline && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-red-500 transition px-1.5 py-0.5 rounded text-[11px] font-semibold bg-white/10"
                  title="Video Quality"
                >
                  <span>{playerState.quality.toUpperCase()}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute right-0 bottom-8 w-28 bg-[#1f1f1f] border border-[#333333] rounded-lg shadow-2xl py-1 text-xs z-50">
                    {['1080p', '720p', '480p', '360p', 'auto'].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuality(q)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#333333] flex items-center justify-between ${
                          playerState.quality === q ? 'text-red-500 font-bold' : 'text-gray-200'
                        }`}
                      >
                        <span>{q.toUpperCase()}</span>
                        {playerState.quality === q && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Speed Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                className="hover:text-red-500 transition text-[11px] font-semibold px-1"
                title="Playback Speed"
              >
                {playerState.speed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-8 w-24 bg-[#1f1f1f] border border-[#333333] rounded-lg shadow-2xl py-1 text-xs z-50">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeed(s)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#333333] flex items-center justify-between ${
                        playerState.speed === s ? 'text-red-500 font-bold' : 'text-gray-200'
                      }`}
                    >
                      <span>{s}x</span>
                      {playerState.speed === s && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-1 hover:text-red-500 transition"
              title="Fullscreen (f)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
