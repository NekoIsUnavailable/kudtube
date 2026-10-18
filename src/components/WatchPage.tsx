import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Clock,
  Download,
  ListPlus,
  ThumbsUp,
  Check,
  Tv,
} from 'lucide-react';
import type { VideoItem, PlayerState, Playlist } from '../types';
import { formatDuration, formatViews } from '../utils/format';
import { toggleWatchLater, isWatchLater } from '../utils/storage';

interface WatchPageProps {
  video: VideoItem;
  playlist?: Playlist | null;
  upNextVideos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onDownload: (video: VideoItem, quality: string) => void;
  onAddToPlaylist?: (video: VideoItem) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  video,
  playlist,
  upNextVideos,
  onSelectVideo,
  onDownload,
  onAddToPlaylist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [inWatchLater, setInWatchLater] = useState(() => isWatchLater(video.id));
  const [descExpanded, setDescExpanded] = useState(false);

  // Sync player position with Electron native MPV window
  const updatePlayerBounds = useCallback(() => {
    if (!containerRef.current || isFullscreen) return;
    const rect = containerRef.current.getBoundingClientRect();
    window.kudtubeAPI?.syncPlayerBounds({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [isFullscreen]);

  // Start playback on mount or when video changes
  useEffect(() => {
    setInWatchLater(isWatchLater(video.id));
    let unsubState: (() => void) | null = null;

    const start = async () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      await window.kudtubeAPI?.startPlayer({
        url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
        quality: '1080p',
        volume: 100,
        bounds: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });

      unsubState = window.kudtubeAPI?.onPlayerState((state) => {
        setPlayerState(state);
      });
    };

    start();

    // Listen to resize and scroll to sync window position
    window.addEventListener('resize', updatePlayerBounds);
    window.addEventListener('scroll', updatePlayerBounds);

    const interval = setInterval(updatePlayerBounds, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePlayerBounds);
      window.removeEventListener('scroll', updatePlayerBounds);
      if (unsubState) unsubState();
      window.kudtubeAPI?.stopPlayer();
    };
  }, [video.id, video.url, updatePlayerBounds]);

  // Auto-advance to next video on EOF
  useEffect(() => {
    if (playerState.eof) {
      if (playlist && playlist.videos.length > 0) {
        const curIdx = playlist.videos.findIndex((v) => v.id === video.id);
        if (curIdx >= 0 && curIdx < playlist.videos.length - 1) {
          onSelectVideo(playlist.videos[curIdx + 1]);
          return;
        }
      }
      if (upNextVideos.length > 0) {
        onSelectVideo(upNextVideos[0]);
      }
    }
  }, [playerState.eof, playlist, video.id, upNextVideos, onSelectVideo]);

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (!playerState.pause) {
        setControlsVisible(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }
    }, 2800);
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.kudtubeAPI?.playerTogglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSeek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    window.kudtubeAPI?.playerSetVolume(val);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.kudtubeAPI?.playerSetMute(!playerState.mute);
  };

  const handleQualitySelect = (quality: string) => {
    setShowQualityMenu(false);
    window.kudtubeAPI?.playerSetQuality(quality);
  };

  const handleSpeedSelect = (speed: number) => {
    setShowSpeedMenu(false);
    window.kudtubeAPI?.playerSetSpeed(speed);
  };

  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    window.kudtubeAPI?.playerSetFullscreen(next);
  };

  const handleToggleTheater = () => {
    setIsTheater((prev) => !prev);
    setTimeout(updatePlayerBounds, 100);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pb-24 transition-colors"
    >
      <div
        className={`mx-auto p-4 lg:p-6 flex flex-col gap-6 transition-all ${
          isTheater ? 'max-w-full' : 'max-w-[1700px] lg:flex-row'
        }`}
      >
        {/* Left Column: Player & Video Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Video Player Box */}
          <div
            ref={containerRef}
            onClick={handlePlayPause}
            className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl group cursor-pointer ${
              isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''
            }`}
          >
            {/* Buffering Indicator */}
            {playerState.buffering && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error Message */}
            {playerState.error && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 text-white p-6 text-center">
                <p className="text-sm text-red-400 font-medium">{playerState.error}</p>
              </div>
            )}

            {/* In-Player YouTube Controls Overlay */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-8 flex flex-col gap-2 transition-opacity duration-300 ${
                controlsVisible || playerState.pause ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Progress Bar (Scrubber) */}
              <div className="relative flex items-center group/scrubber cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={playerState.duration || 100}
                  value={playerState.timePos || 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-1.5 transition-all"
                />
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between text-white text-xs select-none">
                {/* Left Controls: Play, Next, Volume, Time */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-1 hover:text-red-500 transition"
                    title={playerState.pause ? 'Play (Space)' : 'Pause (Space)'}
                  >
                    {playerState.pause ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => {
                      if (upNextVideos.length > 0) onSelectVideo(upNextVideos[0]);
                    }}
                    className="p-1 hover:text-red-500 transition"
                    title="Next (Shift+N)"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button onClick={handleToggleMute} className="p-1 hover:text-red-500 transition">
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
                      className="w-16 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Time Stamp */}
                  <span className="text-[11px] font-mono font-medium text-gray-300 ml-1">
                    {formatDuration(playerState.timePos)} / {formatDuration(playerState.duration)}
                  </span>
                </div>

                {/* Right Controls: Quality, Speed, Theater, Fullscreen */}
                <div className="flex items-center gap-3">
                  {/* Quality Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowQualityMenu((prev) => !prev)}
                      className="flex items-center gap-1 hover:text-red-500 transition px-1.5 py-0.5 rounded text-[11px] font-semibold bg-white/10"
                      title="Quality"
                    >
                      <span>{playerState.quality.toUpperCase()}</span>
                    </button>

                    {showQualityMenu && (
                      <div className="absolute right-0 bottom-8 w-28 bg-[#1f1f1f] border border-[#333333] rounded-lg shadow-xl py-1 text-xs z-50">
                        {['1080p', '720p', '480p', '360p', 'auto'].map((q) => (
                          <button
                            key={q}
                            onClick={() => handleQualitySelect(q)}
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

                  {/* Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu((prev) => !prev)}
                      className="hover:text-red-500 transition text-[11px] font-semibold px-1"
                      title="Playback Speed"
                    >
                      {playerState.speed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute right-0 bottom-8 w-24 bg-[#1f1f1f] border border-[#333333] rounded-lg shadow-xl py-1 text-xs z-50">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSpeedSelect(s)}
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

                  {/* Theater Mode Toggle */}
                  <button
                    onClick={handleToggleTheater}
                    className="p-1 hover:text-red-500 transition hidden md:block"
                    title={isTheater ? 'Default view (t)' : 'Theater mode (t)'}
                  >
                    <Tv className="w-4 h-4" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-1 hover:text-red-500 transition"
                    title="Fullscreen (f)"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Title */}
          <h1 className="text-xl font-bold tracking-tight text-black dark:text-white leading-tight">
            {video.title}
          </h1>

          {/* Channel Row & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-[#272727]">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#252525] flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300 uppercase shadow-inner">
                {video.channel.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-black dark:text-white leading-tight">
                  {video.channel}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {video.viewCount ? formatViews(video.viewCount) : 'YouTube Video'}
                </span>
              </div>
            </div>

            {/* Actions: Like, Watch Later, Download, Playlist */}
            <div className="flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={() => setLiked((l) => !l)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition ${
                  liked
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838]'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>

              {/* Watch Later Button */}
              <button
                onClick={() => setInWatchLater(toggleWatchLater(video))}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition ${
                  inWatchLater
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838]'
                }`}
              >
                {inWatchLater ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{inWatchLater ? 'Saved' : 'Watch Later'}</span>
              </button>

              {/* Download Offline Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-10 w-44 bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium">
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        onDownload(video, '1080p');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                    >
                      <span>1080p Full HD</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        onDownload(video, '720p');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                    >
                      <span>720p HD</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        onDownload(video, 'audio');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                    >
                      <span>Audio Only (MP3)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add to Playlist */}
              {onAddToPlaylist && (
                <button
                  onClick={() => onAddToPlaylist(video)}
                  className="p-2 rounded-full bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                  title="Add to Playlist"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Description Box */}
          <div
            onClick={() => setDescExpanded((p) => !p)}
            className="p-3.5 rounded-xl bg-[#f2f2f2] dark:bg-[#202020] cursor-pointer hover:bg-[#e8e8e8] dark:hover:bg-[#252525] transition"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-black dark:text-white mb-1.5">
              {video.viewCount ? <span>{formatViews(video.viewCount)}</span> : null}
              {video.uploadDate ? <span>• {video.uploadDate}</span> : null}
            </div>
            <p
              className={`text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed ${
                descExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {video.description || 'No description provided.'}
            </p>
            <button className="mt-2 text-xs font-semibold text-gray-900 dark:text-gray-100 hover:underline">
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>

        {/* Right Column: Up Next & Active Playlist */}
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-3">
          {/* Active Playlist Box */}
          {playlist && (
            <div className="rounded-xl border border-gray-200 dark:border-[#272727] bg-[#f8f8f8] dark:bg-[#1a1a1a] p-3 mb-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white truncate">
                    {playlist.title}
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    {playlist.videos.length} videos
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {playlist.videos.map((item, idx) => {
                  const isCurrent = item.id === video.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectVideo(item)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition ${
                        isCurrent
                          ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50'
                          : 'hover:bg-gray-200 dark:hover:bg-[#252525]'
                      }`}
                    >
                      <span className="text-xs font-mono text-gray-400 w-4 text-center">
                        {idx + 1}
                      </span>
                      <img
                        src={item.thumbnail || ''}
                        alt=""
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCurrent ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">
                          {item.channel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Up Next List */}
          <h2 className="text-sm font-bold text-black dark:text-white px-1">Up Next</h2>
          <div className="flex flex-col gap-3">
            {upNextVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectVideo(item)}
                className="group flex gap-2.5 cursor-pointer select-none"
              >
                <div className="relative aspect-video w-40 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#202020] flex-shrink-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : null}
                  {item.duration > 0 && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white font-medium text-[10px]">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0 justify-center">
                  <h4
                    className="text-xs font-semibold line-clamp-2 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug"
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {item.channel}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {formatViews(item.viewCount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
