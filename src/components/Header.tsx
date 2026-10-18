import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Minus, Square, X, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import kudLogo from '../assets/logo.png';

interface HeaderProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  isWatchPage?: boolean;
  onBackToBrowse?: () => void;
}

const SEARCH_HISTORY_KEY = 'kudtube_search_history';

function getStoredHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredHistory(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 15)));
  } catch {}
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  currentQuery,
  isWatchPage,
  onBackToBrowse,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchHistory(getStoredHistory());
  }, []);

  useEffect(() => {
    setSearchInput(currentQuery);
  }, [currentQuery]);

  // Focus mobile input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [isMobileSearchOpen]);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide native video player when search history or mobile search overlay is active
  // so the native player window never renders on top of the search dropdown!
  useEffect(() => {
    if (showHistory || isMobileSearchOpen) {
      window.kudtubeAPI?.setPlayerVisible?.(false);
    } else {
      window.kudtubeAPI?.setPlayerVisible?.(true);
    }
  }, [showHistory, isMobileSearchOpen]);

  const triggerSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15);
    setSearchHistory(updated);
    saveStoredHistory(updated);
    setShowHistory(false);
    setIsMobileSearchOpen(false);
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchInput);
  };

  const handleSelectHistoryItem = (query: string) => {
    setSearchInput(query);
    triggerSearch(query);
  };

  const handleRemoveHistoryItem = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searchHistory.filter((q) => q !== query);
    setSearchHistory(updated);
    saveStoredHistory(updated);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    saveStoredHistory([]);
  };

  const handleMinimize = () => window.kudtubeAPI?.minimize();
  const handleMaximize = () => window.kudtubeAPI?.maximize();
  const handleClose = () => window.kudtubeAPI?.closeWindow();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-4 h-14 bg-white dark:bg-[#0f0f0f] border-b border-[#e5e5e5] dark:border-[#272727] select-none transition-colors"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* MOBILE FULL-WIDTH SEARCH BAR (YouTube Mobile Style) */}
      {isMobileSearchOpen ? (
        <div
          className="flex sm:hidden items-center w-full gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="flex-1 flex items-center">
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-[#202020] rounded-full px-3 py-1.5 border border-gray-200 dark:border-[#303030]">
              <input
                ref={mobileInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search YouTube..."
                className="w-full bg-transparent text-sm text-black dark:text-white outline-none placeholder-gray-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={() => triggerSearch(searchInput)}
            className="p-2 rounded-full bg-red-600 text-white shadow transition"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile Search History Dropdown */}
          {searchHistory.length > 0 && (
            <div className="fixed inset-x-0 top-14 bottom-0 bg-white dark:bg-[#0f0f0f] z-50 overflow-y-auto p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-[#272727] text-xs font-semibold text-gray-500">
                <span>RECENT SEARCHES</span>
                <button
                  onClick={handleClearHistory}
                  className="text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                {searchHistory.map((query) => (
                  <div
                    key={query}
                    onClick={() => handleSelectHistoryItem(query)}
                    className="flex items-center justify-between py-3 px-2 text-sm text-black dark:text-white active:bg-gray-100 dark:active:bg-[#202020]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{query}</span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveHistoryItem(query, e)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Left: Logo & Back Button */}
          <div className="flex items-center gap-2 sm:gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {isWatchPage && onBackToBrowse && (
              <button
                onClick={onBackToBrowse}
                title="Back to previous page"
                className="p-2 -ml-1 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div
              onClick={onBackToBrowse}
              className="flex items-center gap-2 cursor-pointer group"
              title="KudTube Home"
            >
              <img
                src={kudLogo}
                alt="KudTube"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform border border-pink-400/30"
              />
              <span className="font-bold text-base sm:text-lg tracking-tight text-black dark:text-white flex items-center">
                Kud<span className="text-[#ff0000]">Tube</span>
              </span>
            </div>
          </div>

          {/* Center: Search Bar with History Dropdown (Desktop Only) */}
          <div
            ref={searchContainerRef}
            className="hidden sm:flex relative items-center w-full max-w-xl mx-4 flex-1 min-w-0"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <form onSubmit={handleSubmit} className="flex items-center w-full">
              <div className="flex items-center w-full rounded-l-full border border-gray-300 dark:border-[#303030] bg-white dark:bg-[#121212] px-4 py-1.5 focus-within:border-blue-500 dark:focus-within:border-blue-500 shadow-inner">
                <input
                  type="text"
                  value={searchInput}
                  onFocus={() => setShowHistory(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search YouTube or URL..."
                  className="w-full bg-transparent text-sm text-black dark:text-white outline-none placeholder-gray-500"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-r-full border border-l-0 border-gray-300 dark:border-[#303030] bg-[#f8f8f8] dark:bg-[#222222] hover:bg-[#f0f0f0] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition flex items-center justify-center flex-shrink-0"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Desktop Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-12 left-0 right-14 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333333] rounded-2xl shadow-2xl py-2 z-50 text-xs font-medium">
                <div className="flex items-center justify-between px-4 py-1 pb-1.5 text-gray-400 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Recent Searches</span>
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto mt-1">
                  {searchHistory.map((query) => (
                    <div
                      key={query}
                      onClick={() => handleSelectHistoryItem(query)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2b2b2b] cursor-pointer transition text-black dark:text-gray-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{query}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistoryItem(query, e)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                        title="Remove from history"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Search Icon (Mobile), Theme Toggle & Window Controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              title="Search"
              className="sm:hidden p-2 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className="p-2 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Windows Caption Controls - Desktop only */}
            <div className="hidden sm:flex items-center ml-2 border-l border-gray-200 dark:border-[#272727] pl-2">
              <button
                onClick={handleMinimize}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#272727] text-gray-600 dark:text-gray-300 transition"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#272727] text-gray-600 dark:text-gray-300 transition"
                title="Maximize"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#e81123] hover:text-white text-gray-600 dark:text-gray-300 transition"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
