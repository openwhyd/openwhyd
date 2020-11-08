// eslint-disable-next-line @typescript-eslint/no-unused-vars
function makeBookmarklet() {
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
      console.log('detectMusicFiles', url);
      cb({
        id: url,
        title: title.replace(/^\s+|\s+$/g, ''),
        img: '/images/cover-audiofile.png',
      });
    };
  }

  const YOUTUBE_PLAYER = {
    getEid: function (url) {
      // code imported from playem-all
      if (
        /(youtube\.com\/(v\/|embed\/|(?:.*)?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(
          url
        ) ||
        /^\/yt\/([a-zA-Z0-9_-]+)/.test(url) ||
        /youtube\.com\/attribution_link\?.*v%3D([^ %]+)/.test(url) ||
        /youtube.googleapis.com\/v\/([a-zA-Z0-9_-]+)/.test(url)
      )
        return RegExp.lastParen;
    },
    fetchMetadata: function (url, callback) {
      const id = this.getEid(url);
      callback({
        id: id,
        eId: '/yt/' + id,
        img: 'https://i.ytimg.com/vi/' + id + '/default.jpg',
        url: 'https://www.youtube.com/watch?v=' + id,
        playerLabel: 'Youtube',
      });
    },
  };

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
        track.title = track.title || element.name; // i.e. element.name could have been extracted from the page by one of the DETECTORS
        track.eId = track.eId || eid.substr(0, 4) + track.id; // || eid;
        track.sourceId = playerId;
        track.sourceLabel = player.label;
        cb(track);
      });
    };
  }

  // Each detector is called once per web page and returns a list of Query, DomElement and/or Track objects.
  // - Query objects must have a searchQuery field. They will be passed as-is to ui.addSearchThumb()
  // - DomElement objects must have a href or src field.
  // - DomElement and Track objects will be passed to urlDetectors, to complete their metadata if needed.
  // TODO: simplify/homogenize return types
  const DETECTORS = [
    function detectYouTubePageTrack(window) {
      if (/ - YouTube$/.test(window.document.title) === false) return null;
      const videoElement = window.document.getElementsByTagName(
        'ytd-watch-flexy'
      )[0];
      if (!videoElement) return null;
      const videoId = videoElement.getAttribute('video-id');
      if (!videoId || window.location.href.indexOf(videoId) == -1) return null;
      return [
        {
          id: videoId,
          src: window.location.href,
          name: window.document.title.replace(/ - YouTube$/, ''),
        },
      ];
    },
    function detectPandoraTrack(window) {
      if (window.location.href.indexOf('pandora.com') == -1) return null;
      const artist = getNodeText(
          window.document.getElementsByClassName('playerBarArtist')[0] || {}
        ),
        title = getNodeText(
          window.document.getElementsByClassName('playerBarSong')[0] || {}
        );
      return artist && title
        ? [{ src: window.location.href, searchQuery: artist + ' - ' + title }]
        : [];
    },
    function detectDeezerTrack(window) {
      const dzTrackId = window.dzPlayer && window.dzPlayer.getSongId();
      return dzTrackId
        ? [{ src: 'https://www.deezer.com/track/' + dzTrackId }]
        : [];
    },
    function detectTrackFromTitle(window) {
      const title = window.document.title
        .replace(/[▶<>"']+/g, ' ')
        .replace(/[ ]+/g, ' ');
      const titleParts = [
        ' - Spotify',
        ' | www.deezer.com',
        ' - Xbox Music',
        ' - Royalty Free Music - Jamendo',
      ];
      for (let i = 0; i < titleParts.length; ++i)
        if (title.indexOf(titleParts[i]) > -1)
          return [
            {
              src: window.location.href,
              searchQuery: title.replace(titleParts[i], ''),
            },
          ];
    },
    function extractBandcampTracks(window) {
      let toDetect = [];
      const bc = window.TralbumData;
      if (bc) {
        const bcPrefix = '/bc/' + bc.url.split('//')[1].split('.')[0] + '/';
        toDetect = bc.trackinfo.map(function (tr) {
          if (tr.file) {
            const streamUrl = tr.file[Object.keys(tr.file)[0]];
            return {
              href: streamUrl,
              eId: bcPrefix + tr.title_link.split('/').pop() + '#' + streamUrl,
              name: bc.artist + ' - ' + tr.title,
              img: bc.art_id
                ? `https://f4.bcbits.com/img/a${bc.art_id}_16.jpg`
                : undefined,
              artist: bc.artist,
              title: tr.title,
            };
          }
        });
        if (toDetect.length) return toDetect;
      }
      // list Bandcamp track URLs
      let bandcampPageUrl =
        window.document.querySelector &&
        window.document.querySelector('meta[property="og:url"]');
      if (!bandcampPageUrl) return [];
      bandcampPageUrl = bandcampPageUrl.getAttribute('content');
      if (bandcampPageUrl.indexOf('bandcamp.com/track/') != -1)
        toDetect.push({ src: bandcampPageUrl });
      else {
        const pathPos = bandcampPageUrl.indexOf('/', 10);
        if (pathPos != -1) bandcampPageUrl = bandcampPageUrl.substr(0, pathPos); // remove path
        const elts = window.document.querySelectorAll('a[href^="/track/"]');
        for (let j = 0; j < elts.length; ++j)
          toDetect.push({
            href: bandcampPageUrl + elts[j].getAttribute('href'),
          });
      }

      return toDetect;
      // TODO: window.document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
    },
    function parseDomElements(window) {
      let results = [];
      ['iframe', 'object', 'embed', 'a', 'audio', 'source'].map(function (
        elName
      ) {
        results = results.concat(
          Array.prototype.slice.call(
            window.document.getElementsByTagName(elName)
          )
        );
      });
      return results;
    },
  ];

  function detectTracks({ window, ui, urlDetectors, urlPrefix }) {
    // an urlDetector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
    // TODO: decouple from ui <= let caller provide one handler to be called for each detected track

    function detectTrack(url, element, cb) {
      const remainingUrlDetectors = urlDetectors.slice();
      (function processNext() {
        if (!remainingUrlDetectors.length) return cb();
        const trackDetector = remainingUrlDetectors.shift();
        console.log({ trackDetector });
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

    DETECTORS.map(function (detectFct) {
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
    YOUTUBE_PLAYER,
    detectTracks,
    makeFileDetector,
    makeStreamDetector,
  };
}
