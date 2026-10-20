import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Clock,
  Download,
  ListPlus,
  ThumbsUp,
  Check,
  Share2,
  Settings,
} from 'lucide-react';
import type { VideoItem, PlayerState, Playlist } from '../types';
import { formatDuration, formatViews } from '../utils/format';
import { toggleWatchLater, isWatchLater, getSettings } from '../utils/storage';

interface WatchPageProps {
  video: VideoItem;
  playlist?: Playlist | null;
  upNextVideos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onDownload: (video: VideoItem, quality: string) => void;
  onAddToPlaylist?: (video: VideoItem) => void;
  onOpenSettings?: () => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  video,
  playlist,
  upNextVideos,
  onSelectVideo,
  onDownload,
  onAddToPlaylist,
  onOpenSettings,
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

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isTheater] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [inWatchLater, setInWatchLater] = useState(() => isWatchLater(video.id));
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Sync player position with Electron native MPV window without triggering effect restarts
  const isFullscreenRef = useRef(false);
  isFullscreenRef.current = isFullscreen;

  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const upNextRef = useRef(upNextVideos);
  upNextRef.current = upNextVideos;
  const onSelectRef = useRef(onSelectVideo);
  onSelectRef.current = onSelectVideo;

  const lastBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const updatePlayerBounds = useCallback(() => {
    if (!containerRef.current || isFullscreenRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const HEADER_HEIGHT = 56;

    // When the video container has completely scrolled off-screen above the header:
    if (rect.bottom <= HEADER_HEIGHT) {
      if (lastBoundsRef.current?.height !== 0) {
        lastBoundsRef.current = { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: 0 };
        window.kudtubeAPI?.syncPlayerBounds({
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(Math.round(rect.width), 10),
          height: 0,
        });
      }
      return;
    }

    const targetX = Math.round(rect.left);
    const targetY = Math.round(rect.top);
    const targetWidth = Math.max(Math.round(rect.width), 10);
    const targetHeight = Math.round(targetWidth * (9 / 16));

    const prev = lastBoundsRef.current;
    if (
      prev &&
      prev.x === targetX &&
      prev.y === targetY &&
      prev.width === targetWidth &&
      prev.height === targetHeight
    ) {
      return;
    }
    lastBoundsRef.current = { x: targetX, y: targetY, width: targetWidth, height: targetHeight };

    window.kudtubeAPI?.syncPlayerBounds({
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
    });
  }, []);

  // Start playback on mount or when video changes
  useEffect(() => {
    setInWatchLater(isWatchLater(video.id));
    let unsubState: (() => void) | null = null;
    let unsubNext: (() => void) | null = null;
    let unsubFs: (() => void) | null = null;

    const start = async () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetX = Math.round(rect.left);
      const targetY = Math.round(rect.top);
      const targetWidth = Math.max(Math.round(rect.width), 10);
      const targetHeight = Math.round(targetWidth * (9 / 16));

      const appSettings = getSettings();
      const preferredQuality =
        appSettings.defaultQuality === 'auto'
          ? '720p'
          : appSettings.defaultQuality || localStorage.getItem('kudtube_preferred_quality') || '720p';

      await window.kudtubeAPI?.startPlayer({
        url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
        quality: preferredQuality,
        volume: appSettings.defaultVolume ?? 100,
        isOffline: Boolean(video.isOffline || video.filePath),
        isLive: Boolean(video.isLive),
        isAudio: Boolean(
          video.isAudio ||
          video.filePath?.toLowerCase().endsWith('.mp3') ||
          video.filePath?.toLowerCase().endsWith('.m4a') ||
          video.filePath?.toLowerCase().endsWith('.wav') ||
          video.filePath?.toLowerCase().endsWith('.flac')
        ),
        settings: appSettings,
        bounds: {
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight,
        },
      });

      unsubState = window.kudtubeAPI?.onPlayerState((state) => {
        setPlayerState(state);
      });

      unsubNext = window.kudtubeAPI?.onPlayerNext?.(() => {
        const curPl = playlistRef.current;
        if (curPl && curPl.videos.length > 0) {
          const curIdx = curPl.videos.findIndex((v) => v.id === video.id);
          if (curIdx >= 0 && curIdx < curPl.videos.length - 1) {
            onSelectRef.current(curPl.videos[curIdx + 1]);
            return;
          }
        }
        if (upNextRef.current.length > 0) {
          onSelectRef.current(upNextRef.current[0]);
        }
      });

      unsubFs = window.kudtubeAPI?.onPlayerFullscreenChange?.((fs) => {
        setIsFullscreen(fs);
      });
    };

    start();

    // Listen to resize and scroll with passive listeners (zero polling overhead for Atom netbook)
    window.addEventListener('resize', updatePlayerBounds, { passive: true });
    window.addEventListener('scroll', updatePlayerBounds, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePlayerBounds);
      window.removeEventListener('scroll', updatePlayerBounds);
      if (unsubState) unsubState();
      if (unsubNext) unsubNext();
      if (unsubFs) unsubFs();
      window.kudtubeAPI?.stopPlayer();
    };
  }, [video.id, video.url, updatePlayerBounds]);

  // Auto-advance to next video on EOF (respects settings.autoplayNext)
  useEffect(() => {
    if (playerState.eof) {
      const appSettings = getSettings();
      if (!appSettings.autoplayNext) return;

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

  const handleShare = async () => {
    const url = video.url || `https://www.youtube.com/watch?v=${video.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  const renderUpNext = () => (
    <>
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
            <div className="relative aspect-video w-36 sm:w-40 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#202020] flex-shrink-0">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : null}
              {item.isLive ? (
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] uppercase tracking-wide flex items-center gap-0.5 shadow">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              ) : item.duration > 0 ? (
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white font-medium text-[10px]">
                  {formatDuration(item.duration)}
                </span>
              ) : null}
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
    </>
  );

  return (
    <div
      className="w-full min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pb-24 transition-colors"
    >
      <div
        className={`mx-auto p-0 sm:p-4 lg:p-6 flex flex-col gap-4 sm:gap-6 transition-all ${
          isTheater ? 'max-w-full' : 'max-w-[1700px] lg:flex-row'
        }`}
      >
        {/* Left Column: Player & Video Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4">
          {/* Video Player Box Anchor (Edge-to-edge on mobile, rounded on desktop, naturally scrolls with page) */}
          <div
            ref={containerRef}
            className={`relative aspect-video w-full rounded-none sm:rounded-2xl overflow-hidden bg-black shadow-lg transition-all ${
              isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''
            }`}
          >
            {/* Fallback player for preview/web development where Electron native MPV is unavailable */}
            {!window.kudtubeAPI && (
              video.filePath ? (
                <video
                  src={video.filePath}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1&enablejsapi=1`}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )
            )}
          </div>

          {/* Details Section (Indented slightly on mobile for padding) */}
          <div className="px-3 sm:px-0 flex flex-col gap-3 sm:gap-4">
            {/* Video Title */}
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-black dark:text-white leading-snug">
              {video.title}
            </h1>

            {/* Channel Row & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-[#272727]">
              {/* Channel Info & Subscribe Button */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-[#252525] flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300 uppercase shadow-inner flex-shrink-0">
                    {video.channel.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-black dark:text-white leading-tight truncate">
                      {video.channel}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      {video.isLive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                          LIVE NOW
                        </span>
                      ) : video.viewCount ? (
                        formatViews(video.viewCount)
                      ) : (
                        'YouTube Video'
                      )}
                    </span>
                  </div>
                </div>

                {/* YouTube Style Subscribe Button */}
                <button
                  onClick={() => setIsSubscribed((s) => !s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm ml-2 ${
                    isSubscribed
                      ? 'bg-gray-200 text-gray-800 dark:bg-[#272727] dark:text-white'
                      : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Actions: Like, Watch Later, Download, Playlist, Share */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Like Button */}
                <button
                  onClick={() => setLiked((l) => !l)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    inWatchLater
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838]'
                  }`}
                >
                  {inWatchLater ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{inWatchLater ? 'Saved' : 'Watch Later'}</span>
                </button>

                {/* Download Offline Button / Saved Badge */}
                {video.isOffline ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 select-none whitespace-nowrap">
                    <Check className="w-3.5 h-3.5" />
                    <span>Downloaded</span>
                  </div>
                ) : video.isLive ? null : (
                  <div className="relative">
                    <button
                      onClick={() => setShowDownloadMenu((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {showDownloadMenu && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-9 w-48 bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium">
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
                            onDownload(video, '480p');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                        >
                          <span>480p SD</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDownloadMenu(false);
                            onDownload(video, '360p');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                        >
                          <span>360p (Low-Spec / Netbook)</span>
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
                )}

                {/* Add to Playlist */}
                {onAddToPlaylist && (
                  <button
                    onClick={() => onAddToPlaylist(video)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                    title="Add to Playlist"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                {/* Hardware Presets & Settings */}
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-200 hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition"
                    title="Hardware Presets & Optimization"
                  >
                    <Settings className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                    <span>Presets</span>
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Description Box */}
            <div
              onClick={() => setDescExpanded((p) => !p)}
              className="p-3.5 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] cursor-pointer hover:bg-gray-200 dark:hover:bg-[#252525] transition"
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

            {/* Mobile Up Next List (Inside left column so sticky player sticks across full page scroll) */}
            <div className="lg:hidden flex flex-col gap-3 mt-3">
              {renderUpNext()}
            </div>
          </div>
        </div>

        {/* Right Column: Up Next & Active Playlist (Desktop only) */}
        <div className="hidden lg:flex w-full lg:w-80 xl:w-[400px] flex-shrink-0 flex-col gap-3 px-3 sm:px-0">
          {renderUpNext()}
        </div>
      </div>
    </div>
  );
};
