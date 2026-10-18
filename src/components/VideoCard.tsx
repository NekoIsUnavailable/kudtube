import React, { useState } from 'react';
import { Play, Clock, Download, Check, ListPlus, HardDrive } from 'lucide-react';
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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleWatchLaterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleWatchLater(video);
    setInWatchLater(next);
  };

  const handleDownloadClick = (e: React.MouseEvent, quality: string) => {
    e.stopPropagation();
    setShowDownloadMenu(false);
    onDownload(video, quality);
  };

  return (
    <div
      onClick={() => onPlay(video)}
      className="group flex flex-col gap-2.5 cursor-pointer select-none"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-200 dark:bg-[#202020] shadow-sm">
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
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white font-medium text-[11px] tracking-wide">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Offline Badge */}
        {video.isOffline && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold text-[10px] flex items-center gap-1 shadow">
            <HardDrive className="w-3 h-3" />
            Downloaded
          </span>
        )}

        {/* Downloading Progress Overlay */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white px-4">
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-red-600 h-full transition-all duration-200"
                style={{ width: `${downloadPercent || 0}%` }}
              />
            </div>
            <span className="text-xs font-semibold">Downloading {Math.round(downloadPercent || 0)}%</span>
          </div>
        )}

        {/* Hover Quick Actions */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
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

          {/* Download Quality Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDownloadMenu((prev) => !prev);
              }}
              title="Download for offline playback"
              className="p-1.5 rounded-md bg-black/70 hover:bg-black text-white backdrop-blur-md shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Quality Popover */}
            {showDownloadMenu && (
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

      {/* Video Details */}
      <div className="flex gap-3 px-0.5">
        {/* Channel Icon Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#252525] flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-500 uppercase overflow-hidden">
          {video.channel ? video.channel.charAt(0) : 'Y'}
        </div>

        {/* Text Info */}
        <div className="flex flex-col min-w-0">
          <h3
            className="text-sm font-semibold line-clamp-2 text-black dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
            {video.channel}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            {video.viewCount ? <span>{formatViews(video.viewCount)}</span> : null}
            {video.viewCount && video.uploadDate ? <span>•</span> : null}
            {video.uploadDate ? <span>{video.uploadDate}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
