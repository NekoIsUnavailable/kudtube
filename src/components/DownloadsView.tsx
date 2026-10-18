import React, { useEffect, useState } from 'react';
import { Download, Trash2, Play, HardDrive } from 'lucide-react';
import type { DownloadItem, VideoItem } from '../types';
import { formatDuration, formatFileSize } from '../utils/format';

interface DownloadsViewProps {
  onPlay: (video: VideoItem) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({ onPlay }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDownloads = async () => {
    setLoading(true);
    if (window.kudtubeAPI?.getSavedDownloads) {
      const list = await window.kudtubeAPI.getSavedDownloads();
      setDownloads(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.kudtubeAPI?.deleteDownload) {
      await window.kudtubeAPI.deleteDownload(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handlePlayDownloaded = (item: DownloadItem) => {
    onPlay({
      id: item.id,
      title: item.title,
      channel: item.channel,
      duration: item.duration,
      thumbnail: item.thumbnail,
      url: item.filePath, // Use local file path for true offline playback!
      isOffline: true,
      filePath: item.filePath,
    });
  };

  const totalBytes = downloads.reduce((acc, cur) => acc + (cur.fileSize || 0), 0);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading downloads...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      {/* Header Summary */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-[#272727]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Offline Downloads</h1>
            <p className="text-xs text-gray-500">
              {downloads.length} videos • {formatFileSize(totalBytes)} used on disk
            </p>
          </div>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
          <Download className="w-16 h-16 opacity-30 mb-3" />
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            No offline downloads yet
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Hover over any video card or open the watch page and click Download to save videos for offline playback.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {downloads.map((item) => (
            <div
              key={item.id}
              onClick={() => handlePlayDownloaded(item)}
              className="group flex items-center justify-between gap-2.5 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-[#181818] hover:bg-gray-100 dark:hover:bg-[#202020] border border-gray-200 dark:border-[#272727] cursor-pointer transition shadow-sm"
            >
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <div className="relative aspect-video w-28 sm:w-36 rounded-lg overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={item.thumbnail || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white font-medium text-[10px]">
                    {formatDuration(item.duration)}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                    {item.title}
                  </h3>
                  <span className="text-xs text-gray-500 truncate">{item.channel}</span>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-semibold uppercase text-[10px]">
                      {item.quality}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete from disk"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2.5 rounded-full bg-red-600 text-white group-hover:scale-110 transition shadow">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
