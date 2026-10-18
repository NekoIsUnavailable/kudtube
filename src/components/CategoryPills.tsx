import React from 'react';
import { Flame, Radio, Music, Gamepad2, Film, Mic, Download, ListPlus, Clock, History, Headphones, Settings } from 'lucide-react';

export type CategoryKey =
  | 'trending'
  | 'live'
  | 'music'
  | 'music_offline'
  | 'gaming'
  | 'trailers'
  | 'podcasts'
  | 'offline'
  | 'playlists'
  | 'watch_later'
  | 'history'
  | 'settings';

interface CategoryPillsProps {
  activeCategory: CategoryKey;
  onSelectCategory: (cat: CategoryKey) => void;
}

const CATEGORIES: { key: CategoryKey; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'live', label: 'Live', icon: Radio },
  { key: 'settings', label: 'Settings & Presets', icon: Settings },
  { key: 'offline', label: 'Downloads', icon: Download },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'music_offline', label: 'My Music', icon: Headphones },
  { key: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { key: 'trailers', label: 'Trailers', icon: Film },
  { key: 'podcasts', label: 'Podcasts', icon: Mic },
  { key: 'playlists', label: 'Playlists', icon: ListPlus },
  { key: 'watch_later', label: 'Watch Later', icon: Clock },
  { key: 'history', label: 'History', icon: History },
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-[#e5e5e5] dark:border-[#272727] bg-white dark:bg-[#0f0f0f] sticky top-14 z-40">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-[#f2f2f2] dark:bg-[#272727] text-gray-700 dark:text-gray-300 hover:bg-[#e5e5e5] dark:hover:bg-[#383838]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
