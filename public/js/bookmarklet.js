/***********************************************/
/* Automatically generated from bookmarklet.ts */
/*       DO NOT EDIT THIS FILE MANUALLY        */
/***********************************************/
function makeBookmarklet(_a) {
  var pageDetectors = _a.pageDetectors;
  var detectedTracks = 0;
  // Helpers
  function getNodeText(node) {
    return (node.innerText || node.textContent || '').trim().split('\n')[0]; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
    // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
  }
  function unwrapFacebookLink(src) {
    // e.g. http://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
    var fbLink =
      src && typeof src.split === 'function'
        ? src.split('facebook.com/l.php?u=')
        : [];
    if (fbLink.length > 1) {
      fbLink = decodeURIComponent(fbLink.pop().split('&').shift());
      var result = fbLink.indexOf('//www.facebook.com/') == -1 ? fbLink : src;
      return result;
    }
    return src;
  }
  function detectTracks(_a) {
    // an urlDetector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
    // TODO: decouple from ui <= let caller provide one handler to be called for each detected track
    var window = _a.window,
      ui = _a.ui,
      urlDetectors = _a.urlDetectors,
      urlPrefix = _a.urlPrefix;
    function detectTrack(url, element, cb) {
      var remainingUrlDetectors = urlDetectors.slice();
      (function processNext() {
        if (!remainingUrlDetectors.length) return cb();
        var trackDetector = remainingUrlDetectors.shift();
        trackDetector(
          url,
          function (track) {
            if (track) cb(track);
            // Note: previously, the condition above was track && track.id, for some reason 🤷‍♂️
            else processNext();
          },
          element
        );
      })();
    }
    function detectEmbed(element, cb) {
      var url =
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
    var toDetect = new (function ElementStack() {
      // this class holds a collections of elements that potentially reference streamable tracks
      var set = {};
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
        var normalized = normalize(url);
        return normalized && !!set[normalized];
      };
      this.push = function (elt) {
        var url =
          elt &&
          normalize(
            elt.eId || unwrapFacebookLink(elt.href || elt.src || elt.data || '')
          );
        if (!url) return;
        var existingElt = set[url];
        if (!existingElt || size(elt) > size(existingElt)) {
          set[url] = elt;
        }
      };
      this.getSortedArray = function () {
        var eIds = [],
          urls = [],
          keys = Object.keys(set);
        for (var i = 0; i < keys.length; ++i)
          (/\/..\//.test(keys[i]) ? eIds : urls).push(set[keys[i]]);
        return eIds.concat(urls);
      };
    })();
    console.info('1/2 parse page...');
    pageDetectors.map(function (detectFct) {
      var results = detectFct(window) || [];
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
    var eltArray = toDetect.getSortedArray();
    var searchThumbs = [];
    (function processNext() {
      var elt = eltArray.shift();
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
    detectTracks: detectTracks,
  };
}
if (typeof exports !== 'undefined') {
  exports.makeBookmarklet = makeBookmarklet;
}
// Each detector is called once per web page and returns a list of Query, DomElement and/or Track objects.
var openwhydBkPageDetectors = [
  function detectYouTubePageTrack(window) {
    if (/ - YouTube$/.test(window.document.title) === false) return null;
    var videoElement = window.document.getElementsByTagName(
      'ytd-watch-flexy'
    )[0];
    if (!videoElement) return null;
    var videoId = videoElement.getAttribute('video-id');
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
    var getNodeText = function (node) {
      return (node.innerText || node.textContent || '').trim().split('\n')[0];
    }; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
    // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
    var artist = getNodeText(
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
    var dzTrackId = window.dzPlayer && window.dzPlayer.getSongId();
    return dzTrackId
      ? [{ src: 'https://www.deezer.com/track/' + dzTrackId }]
      : [];
  },
  function detectTrackFromTitle(window) {
    var title = window.document.title
      .replace(/[▶<>"']+/g, ' ')
      .replace(/[ ]+/g, ' ');
    var titleParts = [
      ' - Spotify',
      ' | www.deezer.com',
      ' - Xbox Music',
      ' - Royalty Free Music - Jamendo',
    ];
    for (var i = 0; i < titleParts.length; ++i)
      if (title.indexOf(titleParts[i]) > -1)
        return [
          {
            src: window.location.href,
            searchQuery: title.replace(titleParts[i], ''),
          },
        ];
  },
  function extractBandcampTracks(window) {
    var toDetect = [];
    var bc = window.TralbumData;
    if (bc) {
      var bcPrefix_1 = '/bc/' + bc.url.split('//')[1].split('.')[0] + '/';
      toDetect = bc.trackinfo.map(function (tr) {
        if (tr.file) {
          var streamUrl = tr.file[Object.keys(tr.file)[0]];
          return {
            href: streamUrl,
            eId: bcPrefix_1 + tr.title_link.split('/').pop() + '#' + streamUrl,
            name: bc.artist + ' - ' + tr.title,
            img: bc.art_id
              ? 'https://f4.bcbits.com/img/a' + bc.art_id + '_16.jpg'
              : undefined,
            artist: bc.artist,
            title: tr.title,
          };
        }
      });
      if (toDetect.length) return toDetect;
    }
    // list Bandcamp track URLs
    var bandcampPageUrlEl =
      window.document.querySelector &&
      window.document.querySelector('meta[property="og:url"]');
    if (!bandcampPageUrlEl) return [];
    var bandcampPageUrl = bandcampPageUrlEl.getAttribute('content');
    if (bandcampPageUrl.indexOf('bandcamp.com/track/') != -1)
      toDetect.push({ src: bandcampPageUrl });
    else {
      var pathPos = bandcampPageUrl.indexOf('/', 10);
      if (pathPos != -1) bandcampPageUrl = bandcampPageUrl.substr(0, pathPos); // remove path
      var elts = window.document.querySelectorAll('a[href^="/track/"]');
      for (var j = 0; j < elts.length; ++j)
        toDetect.push({
          href: bandcampPageUrl + elts[j].getAttribute('href'),
        });
    }
    return toDetect;
    // TODO: window.document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
  },
  function parseDomElements(window) {
    var results = [];
    ['iframe', 'object', 'embed', 'a', 'audio', 'source'].map(function (
      elName
    ) {
      results = results.concat(
        Array.prototype.slice.call(window.document.getElementsByTagName(elName))
      );
    });
    return results;
  },
];
if (typeof exports !== 'undefined') {
  exports.pageDetectors = openwhydBkPageDetectors;
}
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
if (typeof exports === 'undefined') {
  // running from web browser only, not from Node.js
  (window._initWhydBk = function () {
    // prevents bug in firefox 3
    if (undefined == window.console)
      window.console = __assign(__assign({}, window.console), {
        log: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        info: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        error: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        warn: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
      });
    console.log('-= openwhyd bookmarklet v2.6.1 =-');
    var FILENAME = '/js/bookmarklet.js';
    var CSS_FILEPATH = '/css/bookmarklet.css';
    // close the bookmarklet by pressing ESC
    window.onkeydownBackup =
      window.onkeydownBackup || window.document.onkeydown;
    var overflowBackup = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    window.closeWhydBk = function () {
      window.document.body.removeChild(
        window.document.getElementById('whydBookmarklet')
      );
      window.document.onkeydown = window.onkeydownBackup;
      window.document.body.style.overflow = overflowBackup;
      delete window.onkeydownBackup;
      delete window.closeWhydBk;
    };
    window.document.onkeydown = function (event) {
      if (event.key === 'Esc') window.closeWhydBk();
    };
    // utility functions
    function findScriptHost(scriptPathName) {
      // TODO: use window.document.currentScript.src when IE becomes completely forgotten by humans
      var els = window.document.getElementsByTagName('script');
      for (var i = els.length - 1; i > -1; --i) {
        var whydPathPos = els[i].src.indexOf(scriptPathName);
        if (whydPathPos > -1) return els[i].src.substr(0, whydPathPos);
      }
    }
    function getSelText() {
      if (window.getSelection) {
        return window.getSelection();
      } else if (window.document.getSelection) {
        return window.document.getSelection();
      } else if (window.document.selection) {
        return window.document.selection.createRange().text;
      }
    }
    function include(src, cb) {
      var inc, timer;
      if (src.split(/[#?]/)[0].split('.').pop().toLowerCase() == 'css') {
        inc = window.document.createElement('link');
        inc.rel = 'stylesheet';
        inc.type = 'text/css';
        inc.media = 'screen';
        inc.href = src;
      } else {
        inc = window.document.createElement('script');
        inc.onload = function () {
          timer = timer ? clearInterval(timer) : null;
          cb && cb();
        };
        var check = function () {
          if (
            inc.readyState &&
            (inc.readyState == 'loaded' ||
              inc.readyState == 'complete' ||
              inc.readyState == 4)
          )
            inc.onload();
        };
        timer = cb ? setInterval(check, 500) : undefined;
        inc.onreadystatechange = check;
        inc.type = 'text/javascript';
        inc.src = src;
      }
      window.document.getElementsByTagName('head')[0].appendChild(inc);
    }
    function imageToHD(track) {
      if (track.img) {
        if (track.eId.substr(1, 2) == 'yt') {
          var img_1 =
            'https://img.youtube.com/vi/' +
            track.eId.substr(4).split('?')[0] +
            '/hqdefault.jpg';
          var i_1 = new Image();
          i_1.onload = function () {
            if (i_1.height >= 120) {
              window.document.getElementById(track.id).style.backgroundImage =
                'url(' + img_1 + ')';
            }
          };
          i_1.src = img_1;
        } else if (track.eId.substr(1, 2) == 'sc')
          track.img = track.img.replace('-large', '-t300x300');
        else if (track.eId.indexOf('/dz/') == 0)
          track.img = track.img.replace(/\/image$/, '/image?size=480x640');
        else if (track.eId.indexOf('/ja/') == 0)
          track.img = track.img.replace(
            /\/covers\/1\.200\.jpg$/,
            '/covers/1.600.jpg'
          );
      }
      return track;
    }
    // user interface
    function BkUi() {
      this.nbTracks = 0;
      var div = window.document.getElementById('whydBookmarklet');
      if (!div) {
        window.document.body.appendChild(
          window.document.createElement('div')
        ).id = 'whydBookmarklet';
        div = window.document.getElementById('whydBookmarklet');
      }
      div.innerHTML = [
        '<div id="whydOverlay"></div>',
        '<div id="whydHeader">',
        '<a target="_blank" href="' +
          urlPrefix +
          '"><img src="' +
          urlPrefix +
          '/images/logo-s.png"></a>',
        '<div onclick="closeWhydBk();" style="background-image:url(' +
          urlPrefix +
          '/images/bookmarklet_ic_close_Normal.png)"></div>',
        '</div>',
        '<div id="whydContent">',
        '<div id="whydLoading"></div>',
        '</div>',
      ].join('\n');
      function showForm(thumb) {
        var text = getSelText();
        var href =
          urlPrefix +
          '/post?v=2&' +
          'embed=' +
          (thumb.eId
            ? '1&eId=' + encodeURIComponent(thumb.eId)
            : encodeURIComponent(thumb.url)) +
          (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '') +
          '&refUrl=' +
          encodeURIComponent(window.location.href) +
          '&refTtl=' +
          encodeURIComponent(window.document.title) +
          (text ? '&text=' + encodeURIComponent(text) : '');
        var whydPop = window.open(
          href,
          'whydPop',
          'height=460,width=780,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no'
        );
        whydPop.focus();
        window.closeWhydBk();
      }
      function showSearch(searchQuery) {
        var whydPop = window.open(
          urlPrefix + '/search?q=' + encodeURIComponent(searchQuery),
          'whydSearch'
        );
        whydPop.focus();
        window.closeWhydBk();
      }
      function elt(attrs, children) {
        if (children === void 0) {
          children = [];
        }
        var div = window.document.createElement(attrs.tagName || 'div');
        if (attrs.tagName) delete attrs.tagName;
        if (attrs.img) {
          div.style.backgroundImage = 'url(' + attrs.img + ')';
          delete attrs.img;
        }
        for (var a in attrs) div.setAttribute(a, attrs[a]);
        for (var i = 0; i < (children || []).length; ++i)
          div.appendChild(children[i]);
        return div;
      }
      function selectThumb(e) {
        var tpn = this.parentNode;
        var selected = tpn.className.indexOf(' selected') > -1;
        tpn.className =
          tpn.className.replace(' selected', '') +
          (selected ? '' : ' selected');
        e.preventDefault();
      }
      function renderThumb(thumb) {
        var addBtn = elt({ class: 'whydCont' }, [
          elt({ class: 'whydContOvr' }),
          elt({
            class: 'whydAdd',
            img: urlPrefix + '/images/bookmarklet_ic_add_normal.png',
          }),
        ]);
        addBtn.onclick = thumb.onclick;
        var checkBox = elt({ class: 'whydSelect' }); //onclick: "var tpn=this.parentNode;tpn.className=tpn.className.replace(' selected','')+(tpn.className.indexOf(' selected')>-1?'':' selected');e.preventDefault();"
        checkBox.onclick = selectThumb;
        return elt(
          {
            id: thumb.id,
            class: 'whydThumb',
            img: thumb.img || urlPrefix + '/images/cover-track.png',
          },
          [
            elt({ class: 'whydGrad' }),
            elt({ tagName: 'p' }, [document.createTextNode(thumb.title)]),
            elt({ class: 'whydSrcLogo', img: thumb.sourceLogo }),
            addBtn,
            checkBox,
          ]
        );
      }
      var contentDiv = window.document.getElementById('whydContent');
      this.addThumb = function (thumb) {
        thumb.id = 'whydThumb' + this.nbTracks++;
        thumb = imageToHD(thumb);
        thumb.onclick =
          thumb.onclick ||
          function () {
            return showForm(thumb);
          };
        contentDiv.appendChild(renderThumb(thumb));
      };
      this.addSearchThumb = function (track) {
        var searchQuery = track.searchQuery || track.name || track.title;
        this.addThumb({
          title: searchQuery || 'Search Openwhyd',
          sourceLogo: urlPrefix + '/images/icon-search-from-bk.png',
          onclick: function () {
            return showSearch(searchQuery);
          },
        });
      };
      this.finish = function () {
        window.document.getElementById('whydLoading').style.display = 'none';
      };
      return this;
    }
    // Additional detectors
    function initPlayemPlayers(playemUrl, callback) {
      include(playemUrl, function () {
        // playem-all.js must be loaded at that point
        callback({
          yt: openwhydYouTubeExtractor,
          sc: new window.SoundCloudPlayer({}),
          vi: new window.VimeoPlayer({}),
          dm: new window.DailymotionPlayer({}),
          dz: new window.DeezerPlayer({}),
          bc: new window.BandcampPlayer({}),
          ja: new window.JamendoPlayer({}),
        });
      });
    }
    // Start up
    var urlPrefix = findScriptHost(FILENAME) || 'https://openwhyd.org',
      urlSuffix = '?' + new Date().getTime();
    console.info('loading bookmarklet stylesheet...');
    include(urlPrefix + CSS_FILEPATH + urlSuffix);
    console.info('loading PlayemJS...');
    var playemFile = /openwhyd\.org/.test(urlPrefix)
      ? 'playem-min.js'
      : 'playem-all.js';
    var playemUrl = urlPrefix + '/js/' + playemFile + urlSuffix;
    initPlayemPlayers(playemUrl, function (players) {
      var bookmarklet = makeBookmarklet({
        pageDetectors: openwhydBkPageDetectors,
      });
      bookmarklet.detectTracks({
        window: window,
        ui: BkUi(),
        urlDetectors: [makeFileDetector(), makeStreamDetector(players)],
        urlPrefix: urlPrefix,
      });
    });
  })();
}
// Track detectors
// TODO: refactor makeFileDetector() and makeStreamDetector() to pass element param before callback
function makeFileDetector() {
  var eidSet = {}; // to prevent duplicates // TODO: is this still useful, now that we de-duplicate in toDetect ?
  return function detectMusicFiles(url, cb, element) {
    var fileName = (url.match(/([^/]+)\.(?:mp3|ogg)$/) || []).pop();
    if (eidSet[url] || !fileName) return cb();
    var getNodeText = function (node) {
      return (node.innerText || node.textContent || '').trim().split('\n')[0];
    }; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
    // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
    var title =
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
  var eidSet = {}; // to prevent duplicates // TODO: is this still useful, now that we de-duplicate in toDetect ?
  function getPlayerId(url) {
    for (var i in players) {
      var player = players[i];
      var eId = player.getEid(url);
      if (eId) return i;
    }
  }
  // an urlDetector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
  return function detectPlayableStreams(url, cb, element) {
    if (element === void 0) {
      element = {};
    }
    // 1. find the matching player and track identifier
    var playerId = getPlayerId(url);
    var player = playerId && players[playerId];
    var eid = player && '/' + playerId + '/' + player.getEid(url);
    if (!eid || eidSet[eid]) return cb();
    // 2. extract the (optional) stream URL from the identifier
    var parts = eid.split('#');
    var streamUrl = /^https?:\/\//.test(parts[1] || '') && parts[1];
    if (eidSet[parts[0]] && !streamUrl) return cb(); // i.e. store if new, overwrite if new occurence contains a streamUrl
    // 3. store the identifier, with and without stream URL, to prevent duplicates
    eidSet[parts[0]] = true;
    eidSet[eid] = true;
    if (element.artist && element.title) {
      return cb({
        eId: eid,
        title: element.artist + ' - ' + element.title,
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
if (typeof exports !== 'undefined') {
  exports.makeFileDetector = makeFileDetector;
  exports.makeStreamDetector = makeStreamDetector;
}
var openwhydYouTubeExtractor = {
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
      return RegExp['$+']; //.lastParen;
  },
  fetchMetadata: function (url, callback) {
    var id = this.getEid(url);
    callback({
      id: id,
      eId: '/yt/' + id,
      img: 'https://i.ytimg.com/vi/' + id + '/default.jpg',
      url: 'https://www.youtube.com/watch?v=' + id,
      playerLabel: 'Youtube',
    });
  },
};
if (typeof exports !== 'undefined') {
  exports.openwhydYouTubeExtractor = openwhydYouTubeExtractor;
}