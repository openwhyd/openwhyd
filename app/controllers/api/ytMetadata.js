// @ts-check

/**
 * ytMetadata controller
 * Server-side proxy for YouTube video metadata with in-memory caching.
 * Uses the YouTube oEmbed API (no API key required, no quota consumed).
 * Reduces client-side YouTube API quota usage by caching and centralizing requests.
 */

const request = require('request');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** @type {Map<string, { data: object, expiresAt: number }>} */
const cache = new Map();

const OEMBED_URL =
  'https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=';

/**
 * @param {string} videoId
 * @param {(err: Error | null, data: object | null) => void} callback
 */
function fetchFromOembed(videoId, callback) {
  request(OEMBED_URL + encodeURIComponent(videoId), function (err, res, body) {
    if (err) return callback(err, null);
    if (res.statusCode === 401 || res.statusCode === 403) {
      // Video is private or embedding disabled, return what we can without a title
      return callback(null, {
        id: videoId,
        eId: '/yt/' + videoId,
        title: '',
        img: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=' + videoId,
      });
    }
    if (res.statusCode !== 200) {
      return callback(
        new Error('oEmbed request failed with status ' + res.statusCode),
        null,
      );
    }
    try {
      const json = JSON.parse(body);
      return callback(null, {
        id: videoId,
        eId: '/yt/' + videoId,
        title: json.title || '',
        img:
          json.thumbnail_url ||
          'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=' + videoId,
      });
    } catch (e) {
      return callback(/** @type {Error} */ (e), null);
    }
  });
}

exports.controller = function (req, reqParams, response) {
  req.logToConsole('ytMetadata.controller', reqParams);

  const rawId = reqParams.videoId || reqParams.id || '';
  // Accept either a plain video ID or an eId like "/yt/VIDEO_ID"
  const videoId = rawId.startsWith('/yt/')
    ? rawId.slice(4).split('?')[0]
    : rawId.split('?')[0];
  // Validate: YouTube video IDs are alphanumeric with dashes and underscores
  const safeVideoId = /^[a-zA-Z0-9_-]{1,20}$/.test(videoId) ? videoId : '';

  if (!safeVideoId) {
    return response.renderJSON({ error: 'missing or invalid videoId' });
  }

  const now = Date.now();
  const cached = cache.get(safeVideoId);
  if (cached && cached.expiresAt > now) {
    return response.renderJSON(cached.data);
  }

  fetchFromOembed(safeVideoId, function (err, data) {
    if (err) {
      console.error('ytMetadata: oEmbed error for', safeVideoId, err.message);
      return response.renderJSON({ error: err.message });
    }
    if (data) {
      cache.set(safeVideoId, { data, expiresAt: now + CACHE_TTL_MS });
    }
    return response.renderJSON(data || { error: 'video not found' });
  });
};
