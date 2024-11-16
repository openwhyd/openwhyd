// Track detectors

type UrlDetector = (
  url: string,
  callback: (FuzzyTrack?) => void,
  element: Partial<HTMLElement> & {
    artist?: string;
    title?: string;
    img?: string;
    name?: string; // element.name could have been extracted from the page by one of pageDetectors
  },
) => void;

// TODO: refactor makeFileDetector() and makeStreamDetector() to pass element param before callback

function makeFileDetector(): UrlDetector {
  const eidSet = {}; // to prevent duplicates // TODO: is this still useful, now that we de-duplicate in toDetect ?
  return function detectMusicFiles(url, cb, element) {
    const [fileName, ext] = url.split(/[/.]/).slice(-2);
    if (ext !== 'mp3' && ext !== 'ogg') return cb();
    if (eidSet[url] || !fileName) return cb();
    const getNodeText = (node) =>
      (node.innerText || node.textContent || '').trim().split('\n')[0]; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
    // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
    const title =
      (element ? element.title || getNodeText(element) : null) ||
      decodeURIComponent(fileName);
    eidSet[url] = true;
    cb({
      id: url,
      title: title.trim(),
      img: '/images/cover-audiofile.png',
    });
  };
}

// players = { playerId -> { getEid(), fetchMetadata() } }
// returns detectPlayableStreams(url, callback, element)
function makeStreamDetector(players): UrlDetector {
  const eidSet = {}; // to prevent duplicates // TODO: is this still useful, now that we de-duplicate in toDetect ?
  function getPlayerId(url) {
    for (const i in players) {
      const player = players[i];
      const eId = player.getEid(url);
      if (eId) return i;
    }
  }

  // an urlDetector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
  return function detectPlayableStreams(url, cb, element = {}) {
    // 1. find the matching player and track identifier
    const playerId = getPlayerId(url);
    const player = playerId && players[playerId];
    const trackId = player?.getEid(url);
    const eid = trackId && `/${playerId}/${trackId.replace(/^\//, '')}`; // TODO: get rid of the removal of leading slash character, after fixing playem's soundcloud.getEid()
    if (!eid || eidSet[eid]) return cb();

    // 2. extract the (optional) stream URL from the identifier
    const parts = eid.split('#');
    const streamUrl = parts[1] && /^https?:\/\//.test(parts[1]);
    if (eidSet[parts[0]] && !streamUrl) return cb(); // i.e. store if new, overwrite if new occurence contains a streamUrl

    // 3. store the identifier, with and without stream URL, to prevent duplicates
    eidSet[parts[0]] = true;
    eidSet[eid] = true;
    const detectedTrack = {
      eId: eid,
      sourceId: playerId,
      sourceLabel: player.label,
    };
    if (element.artist && element.title) {
      return cb({
        ...detectedTrack,
        title: `${element.artist} - ${element.title}`,
        img: element.img,
      });
    }
    if (!player.fetchMetadata) {
      return cb(detectedTrack); // quit if we can't enrich the metadata
    }

    // 4. try to return the track with enriched metadata
    player.fetchMetadata(url, function (track) {
      if (!track || !Object.keys(track).length) return cb(detectedTrack);
      cb({
        ...detectedTrack,
        ...track,
        title: track.title || element.name, // i.e. element.name could have been extracted from the page by one of pageDetectors
        eId: track.eId || eid.substr(0, 4) + track.id, // || eid;
      });
    });
  };
}

if (typeof exports !== 'undefined') {
  exports.makeFileDetector = makeFileDetector;
  exports.makeStreamDetector = makeStreamDetector;
}
