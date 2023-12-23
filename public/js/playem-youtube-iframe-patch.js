// this file patches playemjs' Youtube player, so that it streams tracks from an
// iframe hosted on a different domain name.
//
// it will load YoutubePlayerIframe.html or YoutubePlayerIframeLocal.html,
// based on the domain name where openwhyd is running (local or production),
// which will load whydRemotePlayer.js so that openwhyd can control the playback.
//
function YoutubeIframePlayer() {
  return YoutubeIframePlayer.super_.apply(this, arguments);
}

(function () {
  const isLocal =
    window.location.href.indexOf('http://localhost:') == 0 ||
    /^https?:\/\/(\w+)\.openwhyd\.(\w+)(:8080)?\//.test(window.location.href);

  const IFRAME_HOST = isLocal
      ? window.location.href.substr(0, window.location.href.indexOf('/', 10))
      : window.location.protocol + '//d3qdgup1c3urcq.cloudfront.net', // CDN cached of Openwhyd's static resources (html and js files), available through a different domain name.
    IFRAME_PATH = isLocal
      ? '/html/YoutubePlayerIframeLocal.html'
      : '/html/YoutubePlayerIframe.html'; // same file, except it explicitly loads playem-all.js and whydRemotePlayer.js from the openwhyd.org domain

  function Player(eventHandlers, embedVars) {
    const that = this;
    this.iframeReady = false;
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.label = 'Youtube';
    window.addEventListener('message', function (e) {
      if (e.origin === IFRAME_HOST) {
        let message, param;
        try {
          message = JSON.parse(e.data);
          param = message.data[0];
        } catch (err) {
          console.warn('skipping message with invalid data:', e);
          return;
        }
        that.iframeReady = true;
        //for (let i in message.data)
        //	if (message.data[i] == "(object)")
        //    message.data[i] = that;
        if (param == '(player)') param = that;
        //console.log("[youtube-iframe-player] iframe says:", message.code, param);
        if (message.code == 'onApiReady')
          that.safeCall('play', that.embedVars.videoId);
        else that.safeClientCall(message.code, param);
      }
    });
    this.isReady = true;
    this.safeClientCall('onApiReady', this);
  }

  Player.prototype.safeCall = function (fctName) {
    if (!this.iframeReady)
      return console.warn('YT-iframe not ready => ignoring call to', fctName);
    try {
      const args = Array.apply(null, arguments).slice(1); // exclude first arg (fctName)
      this.iframe.contentWindow.postMessage(
        JSON.stringify({ code: fctName, data: args }),
        IFRAME_HOST + IFRAME_PATH,
      );
    } catch (e) {
      console.error('YT safecall error', e, e.stack);
    }
  };

  Player.prototype.safeClientCall = function (fctName, param) {
    try {
      if (this.eventHandlers[fctName]) this.eventHandlers[fctName](param);
    } catch (e) {
      console.error('YT safeclientcall error', e.stack);
    }
  };

  Player.prototype.getEid = function (url) {
    if (
      /(youtube\.com\/(v\/|embed\/|(?:.+)?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(
        url,
      ) ||
      /\/yt\/([a-zA-Z0-9_-]+)/.test(url) ||
      /youtube\.com\/attribution_link\?.*v%3D([^ %]+)/.test(url)
    )
      return RegExp.lastParen;
  };

  Player.prototype.play = function (id) {
    const that = this;
    this.iframeReady = false;
    this.embedVars.videoId = id;
    this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
    this.iframe = document.createElement('iframe');
    this.iframe.id = this.embedVars.playerId;
    const settings = {
      width: this.embedVars.width || '200',
      height: this.embedVars.height || '200',
      //origin: this.embedVars.origin
    };
    this.iframe.style.border = '0';
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.onload = function () {
      that.iframeReady = true;
    };
    this.iframe.setAttribute('allow', 'autoplay'); // required by chrome, see https://stackoverflow.com/a/48747474/592254
    this.iframe.setAttribute(
      'src',
      IFRAME_HOST +
        IFRAME_PATH +
        '?' +
        Object.keys(settings)
          .map(function (p) {
            return p + '=' + encodeURIComponent(settings[p]);
          })
          .join('&'),
    );
    this.embedVars.playerContainer.appendChild(this.iframe);
  };

  Player.prototype.pause = function () {
    this.safeCall('pause');
  };

  Player.prototype.resume = function () {
    this.safeCall('resume');
  };

  Player.prototype.stop = function () {
    this.iframeReady = false;
    this.safeCall('stop');
    try {
      this.iframe.setAttribute('src', '');
      this.embedVars.playerContainer.removeChild(this.iframe);
    } catch (e) {
      console.log('youtube iframe stop:');
    }
  };

  Player.prototype.getTrackPosition = function () {
    this.safeCall('getTrackPosition'); // -> will call onTrackInfo()
  };

  Player.prototype.setTrackPosition = function (pos) {
    this.safeCall('setTrackPosition', pos);
  };

  Player.prototype.setVolume = function (vol) {
    this.safeCall('setVolume', vol);
  };

  //return Player;
  //inherits(YoutubeIframePlayer, Player);
  Player.prototype.fetchMetadata = YoutubePlayer.prototype.fetchMetadata;
  Player.prototype.searchTracks = YoutubePlayer.prototype.searchTracks;
  YoutubeIframePlayer.prototype = Player.prototype;
  YoutubeIframePlayer.super_ = Player;
})();
