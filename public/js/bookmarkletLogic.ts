function makeBookmarklet({ pageDetectors }) {
  let detectedTracks = 0;

  // Helpers

  function getNodeText(node) {
    return (node.innerText || node.textContent || '').trim().split('\n')[0]; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
    // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
  }

  function unwrapFacebookLink(src) {
    // e.g. http://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
    let fbLink =
      src && typeof src.split === 'function'
        ? src.split('facebook.com/l.php?u=')
        : [];
    if (fbLink.length > 1) {
      fbLink = decodeURIComponent(fbLink.pop().split('&').shift());
      const result = fbLink.indexOf('//www.facebook.com/') == -1 ? fbLink : src;
      return result;
    }
    return src;
  }

  // Track detectors

  function makeFileDetector() {
    const eidSet = {}; // to prevent duplicates // TODO: is this still useful, now that we de-duplicate in toDetect ?
    return function detectMusicFiles(url, cb, element) {
      const fileName = (url.match(/([^/]+)\.(?:mp3|ogg)$/) || []).pop();
      if (eidSet[url] || !fileName) return cb();
      const title =
        (element ? element.title || getNodeText(element) : null) ||
        decodeURIComponent(fileName);
      eidSet[url] = true;
      cb({
        id: url,
        title: title.replace(/^\s+|\s+$/g, ''),
        img: '/images/cover-audiofile.png',
      });
    };
  }

  // players = { playerId -> { getEid(), fetchMetadata() } }
  // returns detectPlayableStreams(url, callback, element)
  function makeStreamDetector(players) {
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
      const eid = player && '/' + playerId + '/' + player.getEid(url);
      if (!eid || eidSet[eid]) return cb();

      // 2. extract the (optional) stream URL from the identifier
      const parts = eid.split('#');
      const streamUrl = /^https?:\/\//.test(parts[1] || '') && parts[1];
      if (eidSet[parts[0]] && !streamUrl) return cb(); // i.e. store if new, overwrite if new occurence contains a streamUrl

      // 3. store the identifier, with and without stream URL, to prevent duplicates
      eidSet[parts[0]] = true;
      eidSet[eid] = true;
      if (element.artist && element.title) {
        return cb({
          eId: eid,
          title: `${element.artist} - ${element.title}`,
          img: element.img,
          sourceId: playerId,
          sourceLabel: (player || {}).label,
        });
      } else if (!player || !player.fetchMetadata) {
        return cb({ eId: eid }); // quit if we can't enrich the metadata
      }

      // 4. try to return the track with enriched metadata
      player.fetchMetadata(url, function (track) {
        if (!track) return cb();
        track.title = track.title || element.name; // i.e. element.name could have been extracted from the page by one of pageDetectors
        track.eId = track.eId || eid.substr(0, 4) + track.id; // || eid;
        track.sourceId = playerId;
        track.sourceLabel = player.label;
        cb(track);
      });
    };
  }

  function detectTracks({ window, ui, urlDetectors, urlPrefix }) {
    // an urlDetector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
    // TODO: decouple from ui <= let caller provide one handler to be called for each detected track

    function detectTrack(url, element, cb) {
      const remainingUrlDetectors = urlDetectors.slice();
      (function processNext() {
        if (!remainingUrlDetectors.length) return cb();
        const trackDetector = remainingUrlDetectors.shift();
        trackDetector(
          url,
          function (track) {
            if (track) cb(track);
            // Note: previously, the condition above was track && track.id, for some reason 🤷‍♂️
            else processNext();
          },
          element // TODO: refactor makeFileDetector() and makeStreamDetector() to pass element param before callback
        );
      })();
    }

    function detectEmbed(element, cb) {
      const url =
        element.eId ||
        unwrapFacebookLink(element.href || element.src || element.data || '');
      if (!url) return cb();
      detectTrack(url, element, function (track) {
        if (track) {
          track.url = url;
          track.title =
            track.title || getNodeText(element) || element.title || element.alt; // || track.eId || url || p.label;
          if (track.sourceLabel)
            track.sourceLogo =
              urlPrefix +
              '/images/icon-' +
              track.sourceLabel.split(' ')[0].toLowerCase() +
              '.png';
        }
        cb(track);
      });
    }

    function whenDone(searchThumbs) {
      searchThumbs.map(function (searchThumb) {
        detectedTracks++;
        ui.addSearchThumb(searchThumb);
      });
      console.info('finished detecting tracks!');
      if (detectedTracks === 0) {
        detectedTracks++;
        ui.addSearchThumb({ searchQuery: window.document.title });
      }
      ui.finish();
    }

    const toDetect = new (function ElementStack() {
      // this class holds a collections of elements that potentially reference streamable tracks
      const set = {};
      function normalize(url) {
        if (typeof url === 'string' && !/^javascript:/.test(url)) {
          return url.split('#')[0];
        } else {
          return undefined;
        }
      }
      function size(elt) {
        return (elt.name || getNodeText(elt) || '').length;
      }
      this.has = function (url) {
        const normalized = normalize(url);
        return normalized && !!set[normalized];
      };
      this.push = function (elt) {
        const url =
          elt &&
          normalize(
            elt.eId || unwrapFacebookLink(elt.href || elt.src || elt.data || '')
          );
        if (!url) return;
        const existingElt = set[url];
        if (!existingElt || size(elt) > size(existingElt)) {
          set[url] = elt;
        }
      };
      this.getSortedArray = function () {
        const eIds = [],
          urls = [],
          keys = Object.keys(set);
        for (let i = 0; i < keys.length; ++i)
          (/\/..\//.test(keys[i]) ? eIds : urls).push(set[keys[i]]);
        return eIds.concat(urls);
      };
    })();

    console.info('1/2 parse page...');

    pageDetectors.map(function (detectFct) {
      const results = detectFct(window) || [];
      console.info('-----' + detectFct.name, '=>', results.length);
      results.map(function (result) {
        toDetect.push(result);
      });
    });

    if (!toDetect.has(window.location.href))
      toDetect.push({
        src: window.location.href,
        searchQuery: window.document.title,
      });

    console.info('2/2 list streamable tracks...');
    const eltArray = toDetect.getSortedArray();
    const searchThumbs = [];
    (function processNext() {
      const elt = eltArray.shift();
      if (!elt) whenDone(searchThumbs);
      else
        detectEmbed(elt, function (track) {
          if (track) {
            detectedTracks++;
            if (track.img && track.img[0] === '/') {
              track.img = urlPrefix + track.img;
            }
            ui.addThumb(track);
          } else searchThumbs.push(elt);
          processNext();
        });
    })();
  }

  return {
    detectTracks,
    makeFileDetector,
    makeStreamDetector,
  };
}

if (typeof exports !== 'undefined') {
  exports.makeBookmarklet = makeBookmarklet;
}
