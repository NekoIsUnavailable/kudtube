import React, { useState } from 'react';
import {
  Play,
  Clock,
  Download,
  Check,
  ListPlus,
  HardDrive,
  MoreVertical,
  X,
  Share2,
} from 'lucide-react';
import type { VideoItem } from '../types';
import { formatDuration, formatViews } from '../utils/format';
import { toggleWatchLater, isWatchLater } from '../utils/storage';

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  onDownload: (video: VideoItem, quality: string) => void;
  onAddToPlaylist?: (video: VideoItem) => void;
  isDownloading?: boolean;
  downloadPercent?: number;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlay,
  onDownload,
  onAddToPlaylist,
  isDownloading,
  downloadPercent,
}) => {
  const [inWatchLater, setInWatchLater] = useState(() => isWatchLater(video.id));
  const [showDesktopDownloadMenu, setShowDesktopDownloadMenu] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [mobileDownloadMode, setMobileDownloadMode] = useState(false);

  const handleWatchLaterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleWatchLater(video);
    setInWatchLater(next);
  };

  const handleDownloadClick = (e: React.MouseEvent, quality: string) => {
    e.stopPropagation();
    setShowDesktopDownloadMenu(false);
    setShowMobileSheet(false);
    setMobileDownloadMode(false);
    onDownload(video, quality);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMobileSheet(true);
    setMobileDownloadMode(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = video.url || `https://www.youtube.com/watch?v=${video.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    setShowMobileSheet(false);
  };

  return (
    <>
      <div
        onClick={() => onPlay(video)}
        className="group flex flex-col gap-2 cursor-pointer select-none pb-2 sm:pb-0"
      >
        {/* Thumbnail Container (Edge-to-edge on mobile, rounded on desktop) */}
        <div className="relative aspect-video w-full rounded-none sm:rounded-xl overflow-hidden bg-gray-200 dark:bg-[#202020] shadow-sm">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Play className="w-10 h-10 opacity-30" />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white font-medium text-[11px] tracking-wide">
              {formatDuration(video.duration)}
            </span>
          )}

          {/* Offline Badge */}
          {video.isOffline && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold text-[10px] flex items-center gap-1 shadow">
              <HardDrive className="w-3 h-3" />
              Downloaded
            </span>
          )}

          {/* Downloading Progress Overlay */}
          {isDownloading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white px-4 z-20">
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-red-600 h-full transition-all duration-200"
                  style={{ width: `${downloadPercent || 0}%` }}
                />
              </div>
              <span className="text-xs font-semibold">Downloading {Math.round(downloadPercent || 0)}%</span>
            </div>
          )}

          {/* Desktop Hover Quick Actions */}
          <div className="hidden sm:flex absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
            {/* Watch Later Button */}
            <button
              onClick={handleWatchLaterClick}
              title={inWatchLater ? 'Remove from Watch Later' : 'Watch Later'}
              className={`p-1.5 rounded-md backdrop-blur-md shadow transition ${
                inWatchLater
                  ? 'bg-red-600 text-white'
                  : 'bg-black/70 hover:bg-black text-white'
              }`}
            >
              {inWatchLater ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            </button>

            {/* Download Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDesktopDownloadMenu((prev) => !prev);
                }}
                title="Download for offline playback"
                className="p-1.5 rounded-md bg-black/70 hover:bg-black text-white backdrop-blur-md shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Desktop Download Popover */}
              {showDesktopDownloadMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 w-36 bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg shadow-xl py-1 z-50 text-xs font-medium text-gray-800 dark:text-gray-100"
                >
                  <div className="px-3 py-1 font-semibold text-[10px] text-gray-400 uppercase tracking-wider">
                    Download Quality
                  </div>
                  <button
                    onClick={(e) => handleDownloadClick(e, '1080p')}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                  >
                    <span>1080p Full HD</span>
                  </button>
                  <button
                    onClick={(e) => handleDownloadClick(e, '720p')}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                  >
                    <span>720p HD</span>
                  </button>
                  <button
                    onClick={(e) => handleDownloadClick(e, 'audio')}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#303030] transition flex items-center justify-between"
                  >
                    <span>Audio (.mp3)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Add to Playlist Button */}
            {onAddToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(video);
                }}
                title="Add to playlist"
                className="p-1.5 rounded-md bg-black/70 hover:bg-black text-white backdrop-blur-md shadow transition"
              >
                <ListPlus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Info Row (Avatar, Title, Channel/Views/Date, 3-Dots Button) */}
        <div className="flex items-start gap-3 px-3 sm:px-0">
          {/* Channel Avatar */}
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#252525] flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300 uppercase overflow-hidden shadow-inner mt-0.5">
            {video.channel ? video.channel.charAt(0) : 'Y'}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold line-clamp-2 text-black dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
              title={video.title}
            >
              {video.title}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-1 leading-none">
              <span className="truncate max-w-[140px] sm:max-w-none">{video.channel}</span>
              {video.viewCount && <span>•</span>}
              {video.viewCount && <span>{formatViews(video.viewCount)}</span>}
              {video.uploadDate && <span>•</span>}
              {video.uploadDate && <span>{video.uploadDate}</span>}
            </div>
          </div>

          {/* 3-Dots Kebab Menu Button (Mobile & Desktop) */}
          <button
            onClick={handleMoreClick}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition flex-shrink-0"
            title="Action options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE YOUTUBE BOTTOM SHEET MODAL */}
      {showMobileSheet && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowMobileSheet(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#181818] border-t sm:border border-gray-200 dark:border-white/10 p-4 shadow-2xl text-black dark:text-white flex flex-col gap-2 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Header: Title snippet and Close button */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Options
                </span>
                <p className="text-sm font-semibold truncate leading-tight">{video.title}</p>
              </div>
              <button
                onClick={() => setShowMobileSheet(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options */}
            {!mobileDownloadMode ? (
              <div className="flex flex-col py-1">
                {/* Watch Later */}
                <button
                  onClick={(e) => {
                    handleWatchLaterClick(e);
                    setShowMobileSheet(false);
                  }}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium transition text-left"
                >
                  {inWatchLater ? (
                    <Check className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  )}
                  <span>{inWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}</span>
                </button>

                {/* Save to Playlist */}
                {onAddToPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobileSheet(false);
                      onAddToPlaylist(video);
                    }}
                    className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium transition text-left"
                  >
                    <ListPlus className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>Save to playlist</span>
                  </button>
                )}

                {/* Download video */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileDownloadMode(true);
                  }}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium transition text-left"
                >
                  <Download className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span>Download video</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium transition text-left"
                >
                  <Share2 className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span>Share</span>
                </button>
              </div>
            ) : (
              /* Quality Selector when Download is tapped */
              <div className="flex flex-col py-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1">
                  Choose Download Quality
                </span>
                <button
                  onClick={(e) => handleDownloadClick(e, '1080p')}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold transition"
                >
                  <span>1080p Full HD</span>
                  <span className="text-xs text-gray-400">High Quality</span>
                </button>
                <button
                  onClick={(e) => handleDownloadClick(e, '720p')}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold transition"
                >
                  <span>720p HD</span>
                  <span className="text-xs text-gray-400">Standard</span>
                </button>
                <button
                  onClick={(e) => handleDownloadClick(e, 'audio')}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold transition"
                >
                  <span>Audio Only (.mp3)</span>
                  <span className="text-xs text-gray-400">For KudMusic</span>
                </button>
                <button
                  onClick={() => setMobileDownloadMode(false)}
                  className="mt-2 py-2 text-center text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white"
                >
                  ← Back to options
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
