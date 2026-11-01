// this file patches playemjs' Bandcamp player, so that it streams tracks from
// Bandcamp's embedded player page, instead of extracting a stream URL from the
// track page (which Bandcamp now prevents from bots / servers).
//
// limitations: the embedded player page is cross-origin and has no API, so we
// can't know the track's position or when it ends. Pausing destroys the iframe,
// and resuming recreates it (the track restarts from the beginning).

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
  };

  Player.prototype.play = function (id) {
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
    this.currentId = id;
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
  };

  Player.prototype.pause = function () {
    this.removeIframe();
  };

  Player.prototype.resume = function () {
    if (this.currentId && !this.iframe) this.play(this.currentId);
  };

  Player.prototype.stop = function () {
    this.removeIframe();
    this.currentId = null;
  };

  Player.prototype.setTrackPosition = function () {}; // not supported

  Player.prototype.setVolume = function () {}; // not supported

  window.BandcampPatchedPlayer = Player;
})();
