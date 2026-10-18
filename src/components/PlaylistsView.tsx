import React, { useState } from 'react';
import { ListPlus, Play, Trash2, Plus, Music } from 'lucide-react';
import type { Playlist, VideoItem } from '../types';
import { getPlaylists, createPlaylist, deletePlaylist, removeVideoFromPlaylist } from '../utils/storage';
import { formatDuration } from '../utils/format';

interface PlaylistsViewProps {
  onPlayPlaylist: (playlist: Playlist) => void;
  onPlayVideo: (video: VideoItem, playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  onPlayPlaylist,
  onPlayVideo,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(() => playlists[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      const pl = createPlaylist(newTitle.trim());
      setPlaylists(getPlaylists());
      setSelectedPlaylist(pl);
      setNewTitle('');
      setShowCreateModal(false);
    }
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePlaylist(id);
    const updated = getPlaylists();
    setPlaylists(updated);
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist(updated[0] || null);
    }
  };

  const handleRemoveVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    removeVideoFromPlaylist(selectedPlaylist.id, videoId);
    const updated = getPlaylists();
    setPlaylists(updated);
    setSelectedPlaylist(updated.find((p) => p.id === selectedPlaylist.id) || null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-[#272727]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <ListPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Playlists</h1>
            <p className="text-xs text-gray-500">{playlists.length} playlists</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Playlists Sidebar */}
        <div className="flex flex-col gap-2">
          {playlists.map((pl) => {
            const isSelected = selectedPlaylist?.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  isSelected
                    ? 'bg-gray-200 dark:bg-[#272727] text-black dark:text-white font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Music className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span className="text-sm truncate">{pl.title}</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    ({pl.videos.length})
                  </span>
                </div>
                {pl.id !== 'favorites' && (
                  <button
                    onClick={(e) => handleDeletePlaylist(pl.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Playlist Content */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {selectedPlaylist ? (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#272727]">
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">
                    {selectedPlaylist.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedPlaylist.videos.length} videos
                  </p>
                </div>
                {selectedPlaylist.videos.length > 0 && (
                  <button
                    onClick={() => onPlayPlaylist(selectedPlaylist)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All</span>
                  </button>
                )}
              </div>

              {selectedPlaylist.videos.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs">
                  This playlist is empty. Add videos from search results or the watch page.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedPlaylist.videos.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onPlayVideo(item, selectedPlaylist)}
                      className="group flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50 dark:bg-[#181818] hover:bg-gray-100 dark:hover:bg-[#222222] cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-gray-400 w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="relative aspect-video w-24 rounded-lg overflow-hidden bg-black flex-shrink-0">
                          <img
                            src={item.thumbnail || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-medium text-[9px]">
                            {formatDuration(item.duration)}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-black dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">
                            {item.channel}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleRemoveVideo(item.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">Select or create a playlist</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-white dark:bg-[#202020] rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-[#333333] flex flex-col gap-4"
          >
            <h3 className="text-base font-bold text-black dark:text-white">Create New Playlist</h3>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name..."
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#121212] border border-gray-300 dark:border-[#303030] text-sm text-black dark:text-white outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
