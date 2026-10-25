import React from 'react';
import {
  Home,
  Flame,
  Headphones,
  HardDrive,
  ListPlus,
  Clock,
  History,
  Settings,
} from 'lucide-react';
import type { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  isExpanded: boolean;
  downloadCount: number;
  onNavigate: (view: ViewType, category?: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  isExpanded,
  downloadCount,
  onNavigate,
  onOpenSettings,
}) => {
  const isSelected = (view: ViewType) => currentView === view;

  if (!isExpanded) {
    // Mini Sidebar (YouTube Desktop Compact Style: 72px wide)
    return (
      <aside className="hidden md:flex flex-col items-center w-[72px] flex-shrink-0 bg-white dark:bg-[#0f0f0f] py-2 px-1 select-none border-r border-[#e5e5e5] dark:border-[#272727] z-20">
        <button
          onClick={() => onNavigate('home', 'trending')}
          className={`w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl transition ${
            isSelected('home')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] leading-none">Home</span>
        </button>

        <button
          onClick={() => onNavigate('music_offline')}
          className={`w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl transition ${
            isSelected('music_offline')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
          title="Music"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-[10px] leading-none">Music</span>
        </button>

        <button
          onClick={() => onNavigate('offline')}
          className={`w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl transition relative ${
            isSelected('offline')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
          title="Downloads"
        >
          <HardDrive className="w-5 h-5" />
          <span className="text-[10px] leading-none">Downloads</span>
          {downloadCount > 0 && (
            <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => onNavigate('playlists')}
          className={`w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl transition ${
            isSelected('playlists')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
          title="Playlists"
        >
          <ListPlus className="w-5 h-5" />
          <span className="text-[10px] leading-none">Playlists</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl transition ${
            isSelected('history')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
          title="History"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] leading-none">History</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={onOpenSettings}
          className="w-16 py-3.5 flex flex-col items-center gap-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-[#f2f2f2] dark:hover:bg-[#202020] transition"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] leading-none">Settings</span>
        </button>
      </aside>
    );
  }

  // Expanded Classic YouTube Sidebar (240px wide)
  return (
    <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-white dark:bg-[#0f0f0f] py-3 px-3 select-none border-r border-[#e5e5e5] dark:border-[#272727] overflow-y-auto no-scrollbar z-20">
      {/* Primary Section */}
      <div className="flex flex-col gap-1 pb-3 border-b border-gray-200 dark:border-[#272727]">
        <button
          onClick={() => onNavigate('home', 'trending')}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('home')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('home', 'trending')}
          className="flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020] transition"
        >
          <Flame className="w-5 h-5 text-red-600 dark:text-red-500" />
          <span>Trending</span>
        </button>

        <button
          onClick={() => onNavigate('music_offline')}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('music_offline')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <Headphones className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Music Library</span>
        </button>
      </div>

      {/* Library Section */}
      <div className="flex flex-col gap-1 py-3 border-b border-gray-200 dark:border-[#272727]">
        <span className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
          Library
        </span>

        <button
          onClick={() => onNavigate('offline')}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('offline')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <div className="flex items-center gap-5">
            <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Downloads</span>
          </div>
          {downloadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {downloadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('playlists')}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('playlists')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <ListPlus className="w-5 h-5" />
          <span>Playlists</span>
        </button>

        <button
          onClick={() => onNavigate('watch_later')}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('watch_later')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Watch Later</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('history')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </button>
      </div>

      {/* Settings Section */}
      <div className="flex flex-col gap-1 pt-3 mt-auto">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition ${
            isSelected('settings')
              ? 'bg-[#f2f2f2] dark:bg-[#272727] text-black dark:text-white font-bold'
              : 'text-gray-800 dark:text-gray-200 hover:bg-[#f2f2f2] dark:hover:bg-[#202020]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
