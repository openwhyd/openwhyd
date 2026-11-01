const config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
// Bandcamp's CDN serves a JavaScript "Client Challenge" page (instead of the
// track page) to requests that don't look like they come from a regular HTTP
// client, e.g. when the Accept or User-Agent header is missing.
// (cf https://github.com/openwhyd/openwhyd/issues/940)
const FETCH_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; Openwhyd; +https://openwhyd.org)',
};

const RE_STREAM_URL = /https:\/\/[^.]+\.bcbits\.com\/stream\/[^;"]*/g;

const RE_BAND_ID = /(?:&quot;|")band_id(?:&quot;|"):\s*(\d+)/;
const RE_TRACK_ID = /EmbeddedPlayer\/(?:[^"'\s]*\/)?track=(\d+)/;
const EMBED_URL_PREFIX = 'https://bandcamp.com/EmbeddedPlayer/url=';
const MOBILE_API_URL = 'https://bandcamp.com/api/mobile/24/tralbum_details';

const dedup = (array) => [...new Set(array).keys()];

exports.extractBandcampStreamURLs = (plainText) =>
  dedup(plainText.match(RE_STREAM_URL));

exports.extractBandcampStreamURLsFromHTML = (html) => {
  const withDecodedEntities = htmlDecode(html);
  return exports.extractBandcampStreamURLs(withDecodedEntities);
};

// extracts the ids that Bandcamp's mobile API needs, from a track page
exports.extractBandcampIdsFromHTML = (html) => {
  const bandId = String(html).match(RE_BAND_ID)?.[1];
  const trackId = String(html).match(RE_TRACK_ID)?.[1];
  return trackId ? { bandId, trackId } : null;
};

// picks the best stream URL from the response of Bandcamp's mobile API
exports.extractStreamURLFromMobileAPIResponse = (details, trackId) => {
  const tracks = Array.isArray(details?.tracks) ? details.tracks : [];
  const track =
    tracks.find((t) => String(t.track_id) === String(trackId)) || tracks[0];
  const streams = track?.streaming_url;
  return (
    (streams && (streams['mp3-v0'] || streams['mp3-128'])) ||
    (streams && Object.values(streams)[0]) ||
    undefined
  );
};

async function fetchStreamURLFromMobileAPI({ bandId, trackId }) {
  const query = new URLSearchParams({
    tralbum_type: 't',
    tralbum_id: trackId,
  });
  if (bandId) query.set('band_id', bandId);
  const response = await fetch(`${MOBILE_API_URL}?${query}`, {
    headers: FETCH_HEADERS,
  });
  if (!response.ok)
    throw new Error(`Bandcamp mobile API responded HTTP ${response.status}`);
  const details = await response.json();
  return exports.extractStreamURLFromMobileAPIResponse(details, trackId);
}

function htmlDecode(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

exports.controller = async function (req, reqParams = {}, res) {
  req.logToConsole('bandcampExtractor.controller', reqParams);

  // make sure the API was called from our own domain/host
  const ref = req.getReferer();
  if (typeof ref !== 'string' || !sameDomain(ref, config.urlPrefix)) {
    res.badRequest();
    return;
  }

  const eId = reqParams.eId;
  const matched = typeof eId === 'string' ? eId.match(RE_EID) : null;

  if (!matched) {
    res.badRequest();
    return;
  }

  try {
    const track = matched.pop();
    const artist = matched.pop();
    const trackUrl = `https://${artist}.bandcamp.com/track/${track}`;
    const attempts = [];
    const fetchText = async (url) => {
      const response = await fetch(url, { headers: FETCH_HEADERS });
      attempts.push(`HTTP ${response.status} from ${new URL(url).pathname}`);
      return response.text();
    };
    let streamURL;
    let ids = null;
    // Bandcamp may serve a "Client Challenge" instead of the track page, so we
    // also try its embedded player page (whose HTML lists stream URLs and ids),
    // and then its mobile API.
    const pageUrls = [
      trackUrl,
      `${EMBED_URL_PREFIX}${encodeURIComponent(trackUrl)}/size=small/`,
    ];
    for (const pageUrl of pageUrls) {
      try {
        const body = await fetchText(pageUrl);
        streamURL = exports.extractBandcampStreamURLsFromHTML(body)[0];
        if (streamURL) break;
        ids = ids || exports.extractBandcampIdsFromHTML(body);
      } catch (err) {
        req.logToConsole('bandcampExtractor fetch error:', err.message);
      }
    }
    if (!streamURL && ids) {
      try {
        streamURL = await fetchStreamURLFromMobileAPI(ids);
      } catch (err) {
        req.logToConsole('bandcampExtractor mobile API error:', err.message);
      }
    }
    if (!streamURL) {
      throw new Error(
        `no stream URL found in Bandcamp pages nor mobile API (${attempts.join(', ')})`,
      );
    }
    res.json({ eId, streamURL });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
