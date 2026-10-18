import React, { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import type { VideoItem, Playlist } from '../types';
import { getPlaylists, addVideoToPlaylist, removeVideoFromPlaylist, createPlaylist } from '../utils/storage';

interface AddToPlaylistModalProps {
  video: VideoItem;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ video, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleToggle = (pl: Playlist) => {
    const exists = pl.videos.some((v) => v.id === video.id);
    if (exists) {
      removeVideoFromPlaylist(pl.id, video.id);
    } else {
      addVideoToPlaylist(pl.id, video);
    }
    setPlaylists(getPlaylists());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      const pl = createPlaylist(newTitle.trim());
      addVideoToPlaylist(pl.id, video);
      setPlaylists(getPlaylists());
      setNewTitle('');
      setShowNew(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#202020] rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-[#333333] flex flex-col gap-4 text-black dark:text-white">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#2e2e2e]">
          <h3 className="text-sm font-bold">Save video to...</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
          {playlists.map((pl) => {
            const hasVideo = pl.videos.some((v) => v.id === video.id);
            return (
              <label
                key={pl.id}
                onClick={() => handleToggle(pl)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer text-xs font-semibold"
              >
                <span>{pl.title}</span>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    hasVideo
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {hasVideo && <Check className="w-3 h-3" />}
                </div>
              </label>
            );
          })}
        </div>

        {showNew ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-[#2e2e2e]">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New playlist name..."
              className="w-full px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#121212] border border-gray-300 dark:border-[#303030] text-xs outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-red-600 text-white rounded font-semibold"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 pt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline border-t border-gray-200 dark:border-[#2e2e2e]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create new playlist</span>
          </button>
        )}
      </div>
    </div>
  );
};
