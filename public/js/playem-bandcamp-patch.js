// this file patches playemjs' Bandcamp player, so that it streams tracks from
// Bandcamp's embedded player page, instead of extracting a stream URL from the
// track page (which Bandcamp now prevents from bots / servers).
//
// it first asks /api/bandcampExtractor for a stream URL (extracted by the
// server, using Bandcamp's mobile API if needed), and plays it with soundManager.
// if that fails, it falls back to the embedded player, which is cross-origin and
// has no API: the user has to start it manually, we can't know the track's
// position or when it ends, and pausing destroys the iframe.

(function () {
  if (!window.BandcampPlayer) return; // playem was not loaded

  const EMBED_URL_PREFIX = 'https://bandcamp.com/EmbeddedPlayer/url=';
  const EMBED_OPTIONS =
    '/size=small/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=none/transparent=true/autoplay=true/';

  function Player(eventHandlers, embedVars) {
    this.label = 'Bandcamp';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.currentTrack = { position: 0, duration: 0 };
    this.iframe = null;
    this.currentId = null;
    this.isReady = true;
    this.clientCall('onApiReady', this);
  }

  // inherit getEid(), etc. from playem's original Bandcamp player
  Player.prototype = Object.create(window.BandcampPlayer.prototype);
  Player.prototype.constructor = Player;

  Player.prototype.clientCall = function (fctName) {
    const args = Array.prototype.slice.call(arguments, 1);
    try {
      const handler = this.eventHandlers[fctName];
      if (handler) return handler.apply(null, args);
    } catch (err) {
      console.error('BandcampPatchedPlayer clientCall error:', err);
    }
  };

  Player.prototype.removeIframe = function () {
    if (this.iframe && this.iframe.parentNode)
      this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
    document.body.classList.remove('bandcampEmbed');
  };

  // plays a stream URL (provided by /api/bandcampExtractor) through soundManager
  Player.prototype.playStreamUrl = function (url) {
    const that = this;
    const sound = window.soundManager.createSound({
      id: '_playem_bc_' + Date.now(),
      url: String(url).replace(/^http:/, 'https:'),
      autoLoad: true,
      autoPlay: true,
      whileplaying: function () {
        that.clientCall(
          'onTrackInfo',
          (that.currentTrack = {
            position: sound.position / 1000,
            duration: sound.duration / 1000,
          }),
        );
      },
      onplay: () => that.clientCall('onPlaying', that),
      onresume: () => that.clientCall('onPlaying', that),
      onfinish: () => that.clientCall('onEnded', that),
      onerror: () => that.playInEmbeddedPlayer(that.currentId),
    });
    this.sound = sound;
  };

  // fallback: Bandcamp's embedded player, which the user has to start manually
  Player.prototype.playInEmbeddedPlayer = function (id) {
    const match = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/.exec(
      String(id).replace(/^\/bc\//, ''),
    );
    if (!match) {
      return this.clientCall('onError', this, {
        source: 'BandcampPatchedPlayer',
        error: 'invalid Bandcamp track identifier: ' + id,
      });
    }
    this.removeIframe();
    const trackUrl = `https://${match[1]}.bandcamp.com/track/${match[2]}`;
    const iframe = document.createElement('iframe');
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '42px';
    iframe.setAttribute('allow', 'autoplay');
    iframe.onload = () => {
      if (this.iframe !== iframe) return;
      // onBuffering cancels playem's "track did not start" timeout, which
      // onPlaying doesn't, and we never get a duration from the iframe.
      this.clientCall('onBuffering', this);
      this.clientCall('onPlaying', this);
    };
    iframe.setAttribute(
      'src',
      EMBED_URL_PREFIX + encodeURIComponent(trackUrl) + EMBED_OPTIONS,
    );
    this.iframe = iframe;
    (this.embedVars.playerContainer || document.body).appendChild(iframe);
    document.body.classList.add('bandcampEmbed');
  };

  Player.prototype.play = function (id) {
    this.stop();
    this.currentId = id;
    const requestedId = id;
    $.ajax({
      type: 'GET',
      url: '/api/bandcampExtractor',
      data: { eId: `/bc/${id}` },
      success: ({ streamURL, error } = {}) => {
        if (this.currentId !== requestedId) return; // track was stopped or changed
        if (streamURL && window.soundManager) this.playStreamUrl(streamURL);
        else {
          console.warn('bandcampExtractor error response:', error);
          this.playInEmbeddedPlayer(id);
        }
      },
      error: () => {
        if (this.currentId === requestedId) this.playInEmbeddedPlayer(id);
      },
    });
  };

  Player.prototype.soundCall = function (fctName, arg) {
    if (this.sound && this.sound[fctName]) this.sound[fctName](arg);
  };

  Player.prototype.pause = function () {
    if (this.sound) this.soundCall('pause');
    else this.removeIframe();
  };

  Player.prototype.resume = function () {
    if (this.sound) this.soundCall('resume');
    else if (this.currentId && !this.iframe)
      this.playInEmbeddedPlayer(this.currentId);
  };

  Player.prototype.stop = function () {
    this.removeIframe();
    if (this.sound) {
      this.soundCall('stop');
      this.soundCall('destruct');
      this.sound = null;
    }
    this.currentId = null;
  };

  Player.prototype.setTrackPosition = function (pos) {
    this.soundCall('setPosition', Math.round(pos * 1000));
  };

  Player.prototype.setVolume = function (vol) {
    this.soundCall('setVolume', Math.round(vol * 100));
  };

  window.BandcampPatchedPlayer = Player;
})();
