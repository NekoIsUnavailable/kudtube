import React from 'react';
import { VideoCard } from './VideoCard';
import type { VideoItem } from '../types';
import { Film } from 'lucide-react';

interface VideoGridProps {
  videos: VideoItem[];
  loading?: boolean;
  onPlay: (video: VideoItem) => void;
  onDownload: (video: VideoItem, quality: string) => void;
  onAddToPlaylist?: (video: VideoItem) => void;
  downloadingIds?: Record<string, number>;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  loading,
  onPlay,
  onDownload,
  onAddToPlaylist,
  downloadingIds = {},
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 animate-pulse">
            <div className="aspect-video w-full rounded-xl bg-gray-200 dark:bg-[#202020]" />
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#202020] flex-shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="h-4 bg-gray-200 dark:bg-[#202020] rounded w-5/6" />
                <div className="h-3 bg-gray-200 dark:bg-[#202020] rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 text-gray-500">
        <Film className="w-16 h-16 opacity-30 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No videos found</h3>
        <p className="text-xs text-gray-400 mt-1">Try a different search query or select another category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 p-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onPlay={onPlay}
          onDownload={onDownload}
          onAddToPlaylist={onAddToPlaylist}
          isDownloading={downloadingIds[video.id] !== undefined}
          downloadPercent={downloadingIds[video.id]}
        />
      ))}
    </div>
  );
};
