import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { CategoryPills, type CategoryKey } from './components/CategoryPills';
import { VideoGrid } from './components/VideoGrid';
import { WatchPage } from './components/WatchPage';
import { DownloadsView } from './components/DownloadsView';
import { PlaylistsView } from './components/PlaylistsView';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import type { VideoItem, Playlist, DownloadProgress } from './types';
import {
  getWatchLater,
  getHistory,
  appendHistory,
} from './utils/storage';

export function KudTubeApp() {
  const [currentView, setCurrentView] = useState<'home' | 'watch' | 'offline' | 'playlists' | 'watch_later' | 'history'>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Playback state
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Playlist modal state
  const [playlistModalVideo, setPlaylistModalVideo] = useState<VideoItem | null>(null);

  // Downloads in progress: id -> percent
  const [downloadingIds, setDownloadingIds] = useState<Record<string, number>>({});

  // Fetch category or default feed
  const loadCategoryFeed = useCallback(async (category: CategoryKey) => {
    setActiveCategory(category);
    if (category === 'offline') {
      setCurrentView('offline');
      return;
    }
    if (category === 'playlists') {
      setCurrentView('playlists');
      return;
    }
    if (category === 'watch_later') {
      setCurrentView('watch_later');
      setVideos(getWatchLater());
      return;
    }
    if (category === 'history') {
      setCurrentView('history');
      setVideos(getHistory());
      return;
    }

    setCurrentView('home');
    setLoading(true);

    if (window.kudtubeAPI?.getCategoryFeed) {
      const res = await window.kudtubeAPI.getCategoryFeed(category, 24);
      if (res.ok) {
        setVideos(res.results);
      }
    }
    setLoading(false);
  }, []);

  // Initial load: Trending feed
  useEffect(() => {
    loadCategoryFeed('trending');
  }, [loadCategoryFeed]);

  // Listen to download progress
  useEffect(() => {
    const unsub = window.kudtubeAPI?.onDownloadProgress?.((data: DownloadProgress) => {
      setDownloadingIds((prev) => {
        const next = { ...prev };
        if (data.status === 'completed' || data.status === 'error') {
          delete next[data.id];
        } else {
          next[data.id] = data.percent;
        }
        return next;
      });
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentView('home');
    setLoading(true);

    if (window.kudtubeAPI?.searchVideos) {
      const res = await window.kudtubeAPI.searchVideos(query, 30);
      if (res.ok) {
        setVideos(res.results);
      }
    }
    setLoading(false);
  };

  // Play Video
  const handlePlayVideo = (video: VideoItem, playlist?: Playlist | null) => {
    appendHistory(video);
    setCurrentVideo(video);
    setCurrentPlaylist(playlist || null);
    setCurrentView('watch');
  };

  // Start Download
  const handleDownload = async (video: VideoItem, quality: string) => {
    setDownloadingIds((prev) => ({ ...prev, [video.id]: 0 }));
    if (window.kudtubeAPI?.startDownload) {
      await window.kudtubeAPI.startDownload(video, quality);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white flex flex-col transition-colors">
      <Header
        onSearch={handleSearch}
        currentQuery={searchQuery}
        isWatchPage={currentView === 'watch'}
        onBackToBrowse={() => setCurrentView('home')}
      />

      {currentView === 'watch' && currentVideo ? (
        <WatchPage
          video={currentVideo}
          playlist={currentPlaylist}
          upNextVideos={videos.filter((v) => v.id !== currentVideo.id).slice(0, 15)}
          onSelectVideo={(v) => handlePlayVideo(v, currentPlaylist)}
          onDownload={handleDownload}
          onAddToPlaylist={(v) => setPlaylistModalVideo(v)}
        />
      ) : (
        <main className="flex-1 flex flex-col">
          <CategoryPills
            activeCategory={activeCategory}
            onSelectCategory={loadCategoryFeed}
          />

          {currentView === 'offline' && (
            <DownloadsView onPlay={(v) => handlePlayVideo(v)} />
          )}

          {currentView === 'playlists' && (
            <PlaylistsView
              onPlayPlaylist={(pl) => {
                if (pl.videos.length > 0) {
                  handlePlayVideo(pl.videos[0], pl);
                }
              }}
              onPlayVideo={(v, pl) => handlePlayVideo(v, pl)}
            />
          )}

          {(currentView === 'home' || currentView === 'watch_later' || currentView === 'history') && (
            <VideoGrid
              videos={videos}
              loading={loading}
              onPlay={(v) => handlePlayVideo(v)}
              onDownload={handleDownload}
              onAddToPlaylist={(v) => setPlaylistModalVideo(v)}
              downloadingIds={downloadingIds}
            />
          )}
        </main>
      )}

      {/* Add To Playlist Modal */}
      {playlistModalVideo && (
        <AddToPlaylistModal
          video={playlistModalVideo}
          onClose={() => setPlaylistModalVideo(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <KudTubeApp />
    </ThemeProvider>
  );
}
