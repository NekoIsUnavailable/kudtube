const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { app } = require('electron');

function getYtDlpPath() {
  if (app && app.isPackaged) {
    const pkg = path.join(process.resourcesPath, 'mpv', 'yt-dlp.exe');
    if (fs.existsSync(pkg)) return pkg;
  }
  const local = path.join(__dirname, 'bin', 'mpv', 'yt-dlp.exe');
  if (fs.existsSync(local)) return local;
  return 'yt-dlp';
}

function normalizeEntry(entry) {
  if (!entry) return null;
  let thumb = null;
  if (Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0) {
    const sorted = [...entry.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    thumb = sorted[0]?.url || null;
  } else if (entry.id) {
    thumb = `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
  }

  const videoId = entry.id || null;
  const videoUrl = entry.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);

  return {
    id: videoId,
    url: videoUrl,
    title: entry.title || 'Untitled Video',
    channel: entry.channel || entry.uploader || 'YouTube',
    channelId: entry.channel_id || entry.uploader_id || null,
    duration: typeof entry.duration === 'number' ? entry.duration : 0,
    thumbnail: thumb,
    viewCount: typeof entry.view_count === 'number' ? entry.view_count : null,
    uploadDate: entry.upload_date || null,
    description: entry.description || '',
  };
}

// In-memory TTL Cache (15 minutes) for instant repeated searches & category switches
const searchCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const item = searchCache.get(key.toLowerCase().trim());
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL_MS) {
    searchCache.delete(key.toLowerCase().trim());
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  searchCache.set(key.toLowerCase().trim(), {
    time: Date.now(),
    data,
  });
}

function parseDurationText(str) {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function parseViewCount(str) {
  if (!str) return null;
  const match = str.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Ultra-fast Direct InnerTube HTTPS Search (~500ms vs 6s for yt-dlp spawn)
 */
function fetchInnerTubeSearch(query, limit = 24) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
        },
      },
      query,
    });

    const req = https.request(
      'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        timeout: 6000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const sections =
              json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
            const results = [];

            for (const sec of sections) {
              const items = sec.itemSectionRenderer?.contents || [];
              for (const item of items) {
                const v = item.videoRenderer;
                if (!v || !v.videoId) continue;

                const title =
                  v.title?.runs?.map((r) => r.text).join('') || v.title?.simpleText || 'Untitled Video';
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
                  v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r) => r.text).join('') || '';

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
                });

                if (results.length >= limit) break;
              }
              if (results.length >= limit) break;
            }

            resolve(results);
          } catch {
            resolve([]);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });

    req.on('error', () => resolve([]));
    req.write(postData);
    req.end();
  });
}

/**
 * Fallback search using yt-dlp binary (used for direct URLs or fallback)
 */
function searchVideosYtDlp(query, limit = 24) {
  return new Promise((resolve) => {
    const q = (query || '').trim();
    if (!q) {
      return resolve({ ok: true, results: [] });
    }

    const ytDlp = getYtDlpPath();
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(q);
    const count = Math.min(Math.max(limit, 1), 50);
    const target = isUrl ? q : `ytsearch${count}:${q}`;

    const args = [
      target,
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--skip-download',
    ];

    const child = spawn(ytDlp, args, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      console.error('[youtubeApi] yt-dlp spawn error:', err);
      resolve({ ok: false, error: err.message, results: [] });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.warn('[youtubeApi] yt-dlp error code', code, stderr);
        return resolve({
          ok: false,
          error: stderr.trim() || `yt-dlp failed (code ${code})`,
          results: [],
        });
      }

      try {
        const data = JSON.parse(stdout);
        const rawEntries = Array.isArray(data.entries) ? data.entries : [data];

        const results = rawEntries
          .map(normalizeEntry)
          .filter((item) => item && item.id && item.url);

        resolve({
          ok: true,
          title: data.title || null,
          results,
        });
      } catch (err) {
        console.error('[youtubeApi] parse error:', err);
        resolve({ ok: false, error: 'Failed to parse YouTube results', results: [] });
      }
    });
  });
}

/**
 * High-speed search: Checks cache first (0ms), tries InnerTube API (~500ms),
 * and falls back to yt-dlp if needed.
 */
async function searchVideos(query, limit = 24) {
  const q = (query || '').trim();
  if (!q) return { ok: true, results: [] };

  // 1. Check cache (Instant 0ms response)
  const cached = getCached(q);
  if (cached) {
    return cached;
  }

  const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(q);

  // 2. If it's not a URL, use ultra-fast InnerTube API
  if (!isUrl) {
    try {
      const results = await fetchInnerTubeSearch(q, limit);
      if (results && results.length > 0) {
        const payload = { ok: true, title: null, results };
        setCached(q, payload);
        return payload;
      }
    } catch {
      // Fall through to yt-dlp
    }
  }

  // 3. Fallback to yt-dlp (reliable for playlists and direct URLs)
  const res = await searchVideosYtDlp(q, limit);
  if (res.ok && res.results.length > 0) {
    setCached(q, res);
  }
  return res;
}

/**
 * Fetches feed for categories like Trending, Music, Gaming.
 */
function getCategoryFeed(category = 'trending', limit = 24) {
  const queries = {
    trending: 'trending videos today',
    music: 'popular music hits',
    gaming: 'popular gaming gameplay',
    trailers: 'new movie trailers',
    podcasts: 'popular podcasts full episodes',
    news: 'world news today',
  };
  const q = queries[category.toLowerCase()] || queries.trending;
  return searchVideos(q, limit);
}

module.exports = {
  searchVideos,
  getCategoryFeed,
  getYtDlpPath,
};
