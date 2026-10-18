import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/Header';
import { CategoryPills, type CategoryKey } from './components/CategoryPills';
import { VideoGrid } from './components/VideoGrid';
import { WatchPage } from './components/WatchPage';
import { DownloadsView } from './components/DownloadsView';
import { MusicView } from './components/MusicView';
import { PlaylistsView } from './components/PlaylistsView';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { GlobalMusicBar } from './components/GlobalMusicBar';
import { ExpandedMusicPlayer } from './components/ExpandedMusicPlayer';
import type { VideoItem, Playlist, DownloadProgress } from './types';
import { Home, Headphones, Download, ListPlus, History } from 'lucide-react';
import {
  getWatchLater,
  getHistory,
  appendHistory,
} from './utils/storage';
import { fetchCategoryFeedFallback, searchVideosFallback } from './utils/apiFallback';

export type ViewType =
  | 'home'
  | 'watch'
  | 'offline'
  | 'music_offline'
  | 'playlists'
  | 'watch_later'
  | 'history';

export function KudTubeApp() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [previousView, setPreviousView] = useState<ViewType>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Playback state
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Global music player state
  const { currentTrack, isPlayerExpanded, closeMusic } = useMusic();

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
    if (category === 'music_offline') {
      setCurrentView('music_offline');
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
    } else {
      const results = await fetchCategoryFeedFallback(category, 24);
      setVideos(results);
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
    } else {
      const results = await searchVideosFallback(query, 30);
      setVideos(results);
    }
    setLoading(false);
  };

  // Play Video (Stops music playback if currently active)
  const handlePlayVideo = (video: VideoItem, playlist?: Playlist | null) => {
    closeMusic(false);
    setPreviousView(currentView === 'watch' ? previousView : currentView);
    appendHistory(video);
    setCurrentVideo(video);
    setCurrentPlaylist(playlist || null);
    setCurrentView('watch');
  };

  // Hide native video player while modal is open so it does not punch through
  useEffect(() => {
    if (playlistModalVideo) {
      window.kudtubeAPI?.setPlayerVisible?.(false);
    } else {
      window.kudtubeAPI?.setPlayerVisible?.(true);
    }
  }, [playlistModalVideo]);

  // Back to previous browse page
  const handleBackToBrowse = () => {
    setCurrentView(previousView || 'home');
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
        onBackToBrowse={handleBackToBrowse}
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
        <main
          className={`flex-1 flex flex-col ${
            currentTrack && !isPlayerExpanded ? 'pb-36 md:pb-24' : 'pb-20 md:pb-6'
          }`}
        >
          <CategoryPills
            activeCategory={activeCategory}
            onSelectCategory={loadCategoryFeed}
          />

          {currentView === 'offline' && (
            <DownloadsView onPlay={(v) => handlePlayVideo(v)} />
          )}

          {currentView === 'music_offline' && (
            <MusicView onPlaySong={(v) => handlePlayVideo(v)} />
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

      {/* Full-Screen Expanded Music Player */}
      {currentTrack && isPlayerExpanded && (
        <ExpandedMusicPlayer onPlayVideo={(v) => handlePlayVideo(v)} />
      )}

      {/* Sticky Bottom Global Music Bar (Persists across ALL views until closed or video played) */}
      {currentTrack && !isPlayerExpanded && currentView !== 'watch' && (
        <GlobalMusicBar onOpenMusicView={() => setCurrentView('music_offline')} />
      )}

      {/* Mobile Bottom Navigation Bar (YouTube / YouTube Music style) */}
      {currentView !== 'watch' && !isPlayerExpanded && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#272727] flex items-center justify-around py-1.5 px-2 select-none">
          <button
            onClick={() => loadCategoryFeed('trending')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
              currentView === 'home'
                ? 'text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => loadCategoryFeed('music_offline')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
              currentView === 'music_offline'
                ? 'text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Headphones className="w-5 h-5" />
            <span className="text-[10px]">Music</span>
          </button>

          <button
            onClick={() => loadCategoryFeed('offline')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
              currentView === 'offline'
                ? 'text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Downloads</span>
          </button>

          <button
            onClick={() => loadCategoryFeed('playlists')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
              currentView === 'playlists'
                ? 'text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <ListPlus className="w-5 h-5" />
            <span className="text-[10px]">Playlists</span>
          </button>

          <button
            onClick={() => loadCategoryFeed('history')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
              currentView === 'history'
                ? 'text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </button>
        </nav>
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
      <MusicProvider>
        <KudTubeApp />
      </MusicProvider>
    </ThemeProvider>
  );
}
