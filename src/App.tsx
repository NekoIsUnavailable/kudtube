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
import { SettingsView } from './components/SettingsView';
import type { VideoItem, Playlist, DownloadProgress } from './types';
import {
  getWatchLater,
  getHistory,
  appendHistory,
  getSettings,
} from './utils/storage';
import {
  fetchCategoryFeedFallback,
  searchVideosFallback,
} from './utils/apiFallback';

export type ViewType =
  | 'home'
  | 'watch'
  | 'offline'
  | 'music_offline'
  | 'playlists'
  | 'watch_later'
  | 'history'
  | 'settings';

interface NavState {
  view: ViewType;
  category: CategoryKey;
  searchQuery: string;
  video: VideoItem | null;
  playlist: Playlist | null;
  videos: VideoItem[];
}

export function KudTubeApp() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Navigation History Stack (for Back / Forward on Desktop)
  const [historyStack, setHistoryStack] = useState<NavState[]>([]);
  const [forwardStack, setForwardStack] = useState<NavState[]>([]);

  // Playback state
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Global music player state
  const { currentTrack, isPlayerExpanded, closeMusic } = useMusic();

  // Playlist modal state
  const [playlistModalVideo, setPlaylistModalVideo] = useState<VideoItem | null>(null);
  const [isSettingsOverlayOpen, setIsSettingsOverlayOpen] = useState(false);

  // Downloads in progress: id -> percent
  const [downloadingIds, setDownloadingIds] = useState<Record<string, number>>({});

  const getCurrentNavState = useCallback((): NavState => ({
    view: currentView,
    category: activeCategory,
    searchQuery,
    video: currentVideo,
    playlist: currentPlaylist,
    videos,
  }), [currentView, activeCategory, searchQuery, currentVideo, currentPlaylist, videos]);

  const pushStateToHistory = useCallback(() => {
    const currentState = getCurrentNavState();
    setHistoryStack((prev) => [...prev.slice(-30), currentState]);
    setForwardStack([]);
  }, [getCurrentNavState]);

  // Fetch category or default feed
  const loadCategoryFeed = useCallback(async (category: CategoryKey) => {
    if (category !== activeCategory || currentView !== 'home') {
      pushStateToHistory();
    }

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
    if (category === 'settings') {
      setCurrentView('settings');
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
  }, [activeCategory, currentView, pushStateToHistory]);

  // Initial load: Trending feed
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      if (window.kudtubeAPI?.getCategoryFeed) {
        const res = await window.kudtubeAPI.getCategoryFeed('trending', 24);
        if (mounted && res.ok) {
          setVideos(res.results);
        }
      } else {
        const results = await fetchCategoryFeedFallback('trending', 24);
        if (mounted) {
          setVideos(results);
        }
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    pushStateToHistory();
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
    pushStateToHistory();
    appendHistory(video);
    setCurrentVideo(video);
    setCurrentPlaylist(playlist || null);
    setCurrentView('watch');
  };

  // Back Navigation Handler
  const handleGoBack = useCallback(() => {
    if (playlistModalVideo) {
      setPlaylistModalVideo(null);
      return;
    }
    if (isSettingsOverlayOpen) {
      setIsSettingsOverlayOpen(false);
      return;
    }
    if (historyStack.length > 0) {
      const prevState = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, -1));
      setForwardStack((prev) => [...prev, getCurrentNavState()]);

      setCurrentView(prevState.view);
      setActiveCategory(prevState.category);
      setSearchQuery(prevState.searchQuery);
      setCurrentVideo(prevState.video);
      setCurrentPlaylist(prevState.playlist);
      if (prevState.videos && prevState.videos.length > 0) {
        setVideos(prevState.videos);
      }
      return;
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      setActiveCategory('trending');
    }
  }, [playlistModalVideo, isSettingsOverlayOpen, historyStack, getCurrentNavState, currentView]);

  // Forward Navigation Handler
  const handleGoForward = useCallback(() => {
    if (forwardStack.length === 0) return;
    const nextState = forwardStack[forwardStack.length - 1];
    setForwardStack((prev) => prev.slice(0, -1));
    setHistoryStack((prev) => [...prev, getCurrentNavState()]);

    setCurrentView(nextState.view);
    setActiveCategory(nextState.category);
    setSearchQuery(nextState.searchQuery);
    setCurrentVideo(nextState.video);
    setCurrentPlaylist(nextState.playlist);
    if (nextState.videos && nextState.videos.length > 0) {
      setVideos(nextState.videos);
    }
  }, [forwardStack, getCurrentNavState]);

  const canGoBack = Boolean(
    playlistModalVideo ||
    isSettingsOverlayOpen ||
    historyStack.length > 0 ||
    currentView !== 'home'
  );
  const canGoForward = forwardStack.length > 0;

  // Listen for keyboard navigation (Alt+Left/Right) and mouse auxiliary back/forward buttons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
    };

    const handleMouseAux = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        handleGoBack();
      } else if (e.button === 4) {
        e.preventDefault();
        handleGoForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('auxclick', handleMouseAux);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('auxclick', handleMouseAux);
    };
  }, [handleGoBack, handleGoForward]);

  // Hide native video player while modal or settings overlay is open so it does not punch through
  useEffect(() => {
    if (playlistModalVideo || isSettingsOverlayOpen) {
      window.kudtubeAPI?.setPlayerVisible?.(false);
    } else {
      window.kudtubeAPI?.setPlayerVisible?.(true);
    }
  }, [playlistModalVideo, isSettingsOverlayOpen]);

  // Open Settings handler
  const handleOpenSettings = () => {
    if (currentView === 'watch') {
      setIsSettingsOverlayOpen(true);
    } else {
      pushStateToHistory();
      setCurrentView('settings');
    }
  };

  // Start Download (Electron native via yt-dlp)
  const handleDownload = async (video: VideoItem, quality: string) => {
    setDownloadingIds((prev) => ({ ...prev, [video.id]: 0 }));
    if (window.kudtubeAPI?.startDownload) {
      await window.kudtubeAPI.startDownload(video, quality, getSettings());
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white flex flex-col transition-colors">
      <Header
        onSearch={handleSearch}
        currentQuery={searchQuery}
        isWatchPage={currentView === 'watch'}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onBackToBrowse={() => loadCategoryFeed('trending')}
        onOpenSettings={handleOpenSettings}
      />

      {currentView === 'watch' && currentVideo ? (
        <WatchPage
          video={currentVideo}
          playlist={currentPlaylist}
          upNextVideos={videos.filter((v) => v.id !== currentVideo.id).slice(0, 15)}
          onSelectVideo={(v) => handlePlayVideo(v, currentPlaylist)}
          onDownload={handleDownload}
          onAddToPlaylist={(v) => setPlaylistModalVideo(v)}
          onOpenSettings={handleOpenSettings}
        />
      ) : (
        <main
          className={`flex-1 flex flex-col ${
            currentTrack && !isPlayerExpanded ? 'pb-24' : 'pb-6'
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

          {currentView === 'settings' && (
            <SettingsView onBack={handleGoBack} />
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

      {/* Add To Playlist Modal */}
      {playlistModalVideo && (
        <AddToPlaylistModal
          video={playlistModalVideo}
          onClose={() => setPlaylistModalVideo(null)}
        />
      )}

      {/* Settings Overlay for Watch Page (Keeps video mounted & playing) */}
      {isSettingsOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#0f0f0f] flex flex-col overflow-y-auto">
          <SettingsView onBack={() => setIsSettingsOverlayOpen(false)} />
        </div>
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
