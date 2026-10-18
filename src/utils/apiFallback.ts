import type { VideoItem } from '../types';

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de',
];

export async function fetchCategoryFeedFallback(category: string, limit = 24): Promise<VideoItem[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const endpoint = category === 'trending' ? `${instance}/api/v1/trending` : `${instance}/api/v1/search?q=${encodeURIComponent(category)}&type=video`;
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.items || [];
        return items.slice(0, limit).map((v: any) => ({
          id: v.videoId || v.id,
          url: `https://www.youtube.com/watch?v=${v.videoId || v.id}`,
          title: v.title || 'Untitled',
          channel: v.author || v.channelTitle || 'YouTube',
          duration: typeof v.lengthSeconds === 'number' ? v.lengthSeconds : 0,
          thumbnail: v.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId || v.id}/hqdefault.jpg`,
          viewCount: typeof v.viewCount === 'number' ? v.viewCount : null,
          description: v.description || '',
          isLive: Boolean(v.liveNow),
        }));
      }
    } catch {
      continue;
    }
  }
  return [];
}

export async function searchVideosFallback(query: string, limit = 30): Promise<VideoItem[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : [];
        return items.slice(0, limit).map((v: any) => ({
          id: v.videoId || v.id,
          url: `https://www.youtube.com/watch?v=${v.videoId || v.id}`,
          title: v.title || 'Untitled',
          channel: v.author || 'YouTube',
          duration: typeof v.lengthSeconds === 'number' ? v.lengthSeconds : 0,
          thumbnail: v.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId || v.id}/hqdefault.jpg`,
          viewCount: typeof v.viewCount === 'number' ? v.viewCount : null,
          description: v.description || '',
          isLive: Boolean(v.liveNow),
        }));
      }
    } catch {
      continue;
    }
  }
  return [];
}
