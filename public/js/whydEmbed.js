/* global soundManager */

const global = window;

/**
 * openwhyd embed script
 * @author adrienjoly, whyd
 **/

const DEBUG = false, // for soundmanager
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by Playem
  YOUTUBE_API_KEY = 'AIzaSyCAZvC5tsGWWA2I2cKKsbfaqjwtXfr4bmg',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by Playem
  JAMENDO_CLIENT_ID = '2c9a11b9',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by Playem
  DEEZER_APP_ID = 190482,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by Playem
  DEEZER_CHANNEL_URL =
    window.location.href.substr(0, window.location.href.indexOf('/', 10)) +
    '/html/channel.html';

(function () {
  console.log('-= openwhyd embed script =-');

  // prevents bug in firefox 3
  window.console = window.console || { log: function () {} }; // eslint-disable-line @typescript-eslint/no-empty-function

  // minimal template engine, http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
  function t(s, d) {
    for (const p in d) s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
    return s;
  }

  // function to include other resources
  function include(src, callback) {
    const ext = src.split(/[#?]/)[0].split('.').pop().toLowerCase();
    let inc;
    if (ext == 'css') {
      inc = document.createElement('link');
      inc.rel = 'stylesheet';
      inc.type = 'text/css';
      inc.media = 'screen';
      try {
        inc.href = src;
        document.getElementsByTagName('head')[0].appendChild(inc);
        setTimeout(function () {
          callback && callback({ loaded: true });
        });
      } catch (exception) {
        callback
          ? callback(exception)
          : console.log(src + ' include exception: ', exception);
      }
    } else {
      inc = document.createElement('script');
      const interval = 100;
      let timer,
        retries = 10;
      const check = () => {
        const loaded =
          inc.readyState &&
          (inc.readyState == 'loaded' ||
            inc.readyState == 'complete' ||
            inc.readyState == 4);
        if (loaded || --retries <= 0) {
          timer = timer ? clearInterval(timer) : null;
          callback && callback({ loaded: loaded });
        }
      };
      timer = callback ? setInterval(check, interval) : undefined;
      inc.onload = inc.onreadystatechange = check;
      try {
        inc.src = src;
        document.getElementsByTagName('head')[0].appendChild(inc);
      } catch (exception) {
        timer = timer ? clearInterval(timer) : null;
        callback
          ? callback(exception)
          : console.log(src + ' include exception: ', exception);
      }
    }
  }

  function forEachElement(elementName, handler) {
    const els = document.getElementsByTagName(elementName);
    for (let i = 0; i < els.length; ++i) handler(els[i], i);
  }

  // extract parameters
  let urlPrefix;
  const params = (function getScriptParams(fileName) {
    const url = (function findScriptUrls(fileName) {
      let url = null;
      forEachElement('script', function (element) {
        const pathPos = element.src.indexOf(fileName);
        if (pathPos > -1) {
          url = element.src;
          urlPrefix = element.src.substr(0, pathPos);
        }
      });
      return url;
    })(fileName);
    return (function parseQueryString(url) {
      const params = {};
      url
        .split('?')
        .pop()
        .split('&')
        .forEach(function (p) {
          p = p.split('=');
          params[p[0]] = p[1];
        });
      return params;
    })(url);
  })('/js/whydEmbed.js');

  // openwhyd api + rendering

  const view = (function () {
    const that = {
      rootElement: null,
      videoElement: null,
      tracklistElement: null,
      init: function (el) {
        this.rootElement = el;
        el.className = (el.className || '') + ' whydEmbed';
        el.innerHTML = [
          '<div>',
          '<div id="whydVideo"></div>',
          '</div>',
          '<ul>',
          '</ul>',
        ].join('');
        this.videoElement = el.getElementsByTagName('div')[0];
        this.tracklistElement = el.getElementsByTagName('ul')[0];
        return this;
      },
      populateTracks: function (tracks) {
        this.tracklistElement.innerHTML = tracks
          .map(function (d, i) {
            d.index = i;
            return t('<li data-wtn="{index}"><span></span>{name}</li>', d);
          })
          .join('');
      },
      setCurrentTrack: function (metadata) {
        this.videoElement.style.backgroundImage =
          'url(' + metadata.img.replace(/["'()<>]/gi, '') + ')';
      },
    };
    // private functions
    return that;
  })();

  function fetchFeed(cb) {
    console.info('fetching tracks from whyd...');
    // for testing:
    //return cb([{"_id":"5310a968c8e454890aefd55a","eId":"/bc/3260779883#http://popplers5.bandcamp.com/download/track?enc=mp3-128&fsig=55b170d8bf20c559b32fe666faf06eee&id=3260779883&stream=1&ts=1393600816.0","img":"http://f0.bcbits.com/img/a1188033111_10.jpg","name":"Manisnotabird - The sound of spring","nbP":5,"pl":{"name":"tests","id":49},"text":"bandcamp","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb894f79a8b6d330abddf8","eId":"/dz/73414915","img":"http://api.deezer.com/album/7227700/image","name":"datA - Patriots","nbP":12,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb894579a8b6d330abddf6","eId":"/sc/manisnotabird/bringer-of-rain-and-seed-good#https://api.soundcloud.com/tracks/71480483","img":"https://i1.sndcdn.com/artworks-000047584907-quet7v-large.jpg?e30f094","name":"Man Is Not A Bird - Bringer Of Rain And Seed","nbP":10,"nbR":3,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb893c79a8b6d330abddf4","eId":"/yt/iL3IYGgqaNU","img":"https://i.ytimg.com/vi/iL3IYGgqaNU/0.jpg","name":"MAN IS NOT A BIRD / LIVE @ BATOFAR, PARIS / 04.12.2013","nbP":6,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb893179a8b6d330abddf2","eId":"/dm/x142x6e","img":"https://s1-ssl.dmcdn.net/CVlV-/x240-tvG.jpg","name":"JEAN JEAN \"Love\"","nbP":6,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb892879a8b6d330abddf0","eId":"/vi/46314116","img":"https://secure-b.vimeocdn.com/ts/322/503/322503703_200.jpg","name":"Man is not a Bird - IV - Live at le Klub, Paris","nbP":4,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]},{"_id":"52eb891779a8b6d330abddef","eId":"http://robtowns.com/music/blind_willie.mp3","img":"/images/cover-audiofile.png","name":"blind_willie.mp3","nbP":3,"pl":{"name":"tests","id":49},"text":"","uId":"4d94501d1f78ac091dbc9b4d","uNm":"Adrien Joly","lov":[]}]);
    const cbName = '_whyd_feed_callback_' + Date.now() + '_';
    window[cbName] = function (data) {
      cb(data);
      delete window[cbName];
    };
    include(
      (params.path.indexOf('//') + 1 ? '' : urlPrefix) +
        params.path +
        '?callback=' +
        cbName,
    );
  }

  // components

  function initPlayem(playerContainer, playerId, cb) {
    console.info('initializing players...');
    const PLAYERS = [
        'Youtube',
        'SoundCloud',
        'Vimeo',
        'Dailymotion',
        'Deezer',
        'AudioFile',
        'Bandcamp',
      ],
      PLAYER_PARAMS = {
        playerId: playerId,
        origin: window.location.host || window.location.hostname,
        width: params.videoWidth || playerContainer.clientWidth,
        height: params.videoHeight || playerContainer.clientHeight,
        playerContainer: playerContainer,
      };
    let playem;

    include(urlPrefix + '/js/playem-min.js', function () {
      playem = new global.Playem();
      PLAYERS.forEach(function (pl) {
        //console.log("Init " + pl + " player...");
        playem.addPlayer(window[pl + 'Player'], PLAYER_PARAMS);
      });
      cb(playem);
    });
  }

  function loadSoundManager(cb) {
    //console.info("initializing soundmanager2...");
    include(
      urlPrefix + '/js/soundmanager2' + (DEBUG ? '.js' : '-nodebug-jsmin.js'),
      function () {
        soundManager.setup({
          debugMode: DEBUG,
          url: urlPrefix + '/swf/soundmanager2_xdomain.swf',
          flashVersion: 9,
          onready: function () {
            soundManager.isReady = true;
          },
        });
        soundManager.beginDelayedInit();
      },
    );
    cb();
  }

  function runAll(init, cb) {
    let remaining = init.length;
    init.map(function (o) {
      (o.args = o.args || []).push(function () {
        o.res = arguments;
        if (!--remaining) cb(init);
      });
      o.fct.apply(null, o.args);
    });
  }

  function loadStyle(cb) {
    include(urlPrefix + '/html/testWhydEmbed.css', cb);
  }

  // actual init

  const init = [
    { fct: fetchFeed },
    { fct: loadSoundManager },
    { fct: loadStyle },
  ];

  const shortcuts = {
    '/yt/': window.location.protocol + '//youtube.com/v/',
    '/sc/': window.location.protocol + '//soundcloud.com/',
    '/dm/': window.location.protocol + '//dailymotion.com/video/',
    '/vi/': window.location.protocol + '//vimeo.com/',
    '/dz/': window.location.protocol + '//www.deezer.com/track/',
  };

  function getTrackUrl(eId) {
    for (const s in shortcuts)
      if (eId.indexOf(s) == 0) return eId.replace(s, shortcuts[s]);
    return eId;
  }

  runAll(init, function (res) {
    view.init(document.getElementById(params.id));
    initPlayem(view.videoElement, 'whydVideo', function (playem) {
      console.info('ready!');
      const tracks = res[0].res[0];
      view.populateTracks(tracks);
      for (const i in tracks)
        playem.addTrackByUrl(getTrackUrl(tracks[i].eId), tracks[i]);
      forEachElement('li', function (element) {
        const wtn = element.getAttribute('data-wtn'); // openwhyd track number
        if (wtn !== null)
          element.onclick = function () {
            playem.play(wtn);
          };
      });
      playem.on('onTrackChange', function (track) {
        view.setCurrentTrack(track.metadata);
      });
    });
  });
})();
