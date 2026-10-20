import type { VideoItem } from '../types';

const INVIDIOUS_INSTANCES = [
  'https://invidious.flokinet.to',
  'https://yewtu.be',
  'https://invidious.f5.si',
];

function parseDurationText(str?: string): number {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function parseViewCount(str?: string): number | null {
  if (!str) return null;
  const match = str.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Direct YouTube InnerTube search (Native Android/Web client)
 */
async function searchViaInnerTube(query: string, limit = 24): Promise<VideoItem[]> {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00',
          },
        },
        query,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const sections =
      json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results: VideoItem[] = [];

    for (const sec of sections) {
      const items = sec.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (!v || !v.videoId) continue;

        const title =
          v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'Untitled Video';
        const channel =
          v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube';
        const duration = parseDurationText(v.lengthText?.simpleText);
        const thumbnails = v.thumbnail?.thumbnails || [];
        const thumb =
          thumbnails.length > 0
            ? thumbnails[thumbnails.length - 1].url
            : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
        const viewCount = parseViewCount(
          v.viewCountText?.simpleText || v.shortViewCountText?.simpleText
        );
        const uploadDate = v.publishedTimeText?.simpleText || null;
        const desc =
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || '';

        const badgesStr = JSON.stringify(v.badges || []);
        const isLive = Boolean(
          badgesStr.includes('LIVE') ||
            v.thumbnailOverlays?.some(
              (o: any) => o.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE'
            ) ||
            v.viewCountText?.runs?.some(
              (r: any) => r.text && r.text.toLowerCase().includes('watching')
            ) ||
            (!v.lengthText && v.viewCountText && !uploadDate)
        );

        results.push({
          id: v.videoId,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          title,
          channel,
          channelId:
            v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || null,
          duration,
          thumbnail: thumb,
          viewCount,
          uploadDate,
          description: desc,
          isLive,
        });

        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Fallback to healthy Invidious instances
 */
async function searchViaInvidious(query: string, limit = 24): Promise<VideoItem[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : [];
        if (items.length > 0) {
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
      }
    } catch {
      continue;
    }
  }
  return [];
}

export async function fetchCategoryFeedFallback(category: string, limit = 24): Promise<VideoItem[]> {
  // First try direct InnerTube search with category keyword
  const keyword =
    category === 'trending'
      ? 'trending videos'
      : category === 'live'
      ? 'live streams news music'
      : category === 'music'
      ? 'official music videos'
      : category === 'gaming'
      ? 'gaming gameplay'
      : category === 'podcasts'
      ? 'podcast episode'
      : category === 'trailers'
      ? 'official movie trailers'
      : category;

  const innerTubeResults = await searchViaInnerTube(keyword, limit);
  if (innerTubeResults.length > 0) {
    return innerTubeResults;
  }

  // Fallback to active Invidious instances
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const endpoint =
        category === 'trending'
          ? `${instance}/api/v1/trending`
          : `${instance}/api/v1/search?q=${encodeURIComponent(category)}&type=video`;
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.items || [];
        if (items.length > 0) {
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
      }
    } catch {
      continue;
    }
  }

  return [];
}

export async function searchVideosFallback(query: string, limit = 30): Promise<VideoItem[]> {
  // 1. First try direct InnerTube
  const innerTubeResults = await searchViaInnerTube(query, limit);
  if (innerTubeResults.length > 0) {
    return innerTubeResults;
  }

  // 2. Fallback to active Invidious instances
  return searchViaInvidious(query, limit);
}

/**
 * Fallback to resolve direct download streams for Android & Web
 */
export async function fetchDownloadStreamFallback(
  videoId: string,
  isAudio: boolean
): Promise<{ url: string; ext: string; mime: string } | null> {
  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${inst}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (isAudio) {
        const audio =
          data.adaptiveFormats?.find(
            (f: any) => f.itag === '140' || (f.type && f.type.startsWith('audio/mp4'))
          ) || data.adaptiveFormats?.find((f: any) => f.type && f.type.startsWith('audio/'));
        if (audio && audio.url) {
          return {
            url: audio.url,
            ext: audio.container || 'm4a',
            mime: audio.type || 'audio/mp4',
          };
        }
      } else {
        const stream =
          data.formatStreams?.find(
            (f: any) => f.itag === '18' || f.container === 'mp4'
          ) ||
          data.formatStreams?.[0] ||
          data.adaptiveFormats?.find((f: any) => f.container === 'mp4');
        if (stream && stream.url) {
          return {
            url: stream.url,
            ext: stream.container || 'mp4',
            mime: stream.type || 'video/mp4',
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

