import React, { useState } from 'react';
import { Search, Sun, Moon, Minus, Square, X, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import kudLogo from '../assets/logo.png';

interface HeaderProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  isWatchPage?: boolean;
  onBackToBrowse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  currentQuery,
  isWatchPage,
  onBackToBrowse,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState(currentQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleMinimize = () => window.kudtubeAPI?.minimize();
  const handleMaximize = () => window.kudtubeAPI?.maximize();
  const handleClose = () => window.kudtubeAPI?.closeWindow();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-white dark:bg-[#0f0f0f] border-b border-[#e5e5e5] dark:border-[#272727] select-none transition-colors"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: Logo & Back Button */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {isWatchPage && onBackToBrowse && (
          <button
            onClick={onBackToBrowse}
            title="Back to browse"
            className="p-2 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
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
            className="w-7 h-7 rounded-md object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight text-black dark:text-white flex items-center">
            Kud<span className="text-[#ff0000]">Tube</span>
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full max-w-xl mx-4"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className="flex items-center w-full rounded-l-full border border-gray-300 dark:border-[#303030] bg-white dark:bg-[#121212] px-4 py-1.5 focus-within:border-blue-500 dark:focus-within:border-blue-500 shadow-inner">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search YouTube or paste URL / Playlist..."
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
          className="px-5 py-2 rounded-r-full border border-l-0 border-gray-300 dark:border-[#303030] bg-[#f8f8f8] dark:bg-[#222222] hover:bg-[#f0f0f0] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Right: Theme Toggle & Window Controls */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Windows Caption Controls */}
        <div className="flex items-center ml-2 border-l border-gray-200 dark:border-[#272727] pl-2">
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
            <Square className="w-3 h-3" />
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
    </header>
  );
};
