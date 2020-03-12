const assert = require('assert');
const bookmarklet = require('./../../public/js/bookmarklet.js');

const makeWindow = ({ url = '', title = '' }) => ({
  location: { href: url },
  document: {
    title,
    getElementsByTagName: () => []
  }
});

const detectTracksAsPromise = ({ window, urlDetectors = [] }) =>
  new Promise(resolve => {
    const tracks = [];
    bookmarklet.detectTracks({
      window,
      ui: {
        get nbTracks() {
          return tracks.length;
        },
        addSearchThumb: track => tracks.push(track),
        finish: () => resolve(tracks)
      },
      urlDetectors
    });
  });

describe('bookmarklet', () => {
  it('should return a search link when no tracks were found on the page', async () => {
    const window = makeWindow({ title: 'dummy title' });
    const results = await detectTracksAsPromise({ window });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].name, window.document.title);
  });

  it('should return the track title from a Spotify page', async () => {
    const songTitle = 'Dummy Song';
    const window = makeWindow({ title: `${songTitle} - Spotify` });
    const results = await detectTracksAsPromise({ window });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].searchQuery, songTitle);
  });

  describe('makeStreamDetector()', () => {
    it('should return a function', () => {
      const detectPlayemStreams = bookmarklet.makeStreamDetector();
      assert.equal(typeof detectPlayemStreams, 'function');
    });

    describe('detectPlayemStreams()', () => {
      it('should return nothing when no players were provided', async () => {
        const url = 'https://www.youtube.com/watch?v=uWB8plk9sXk';
        const players = {};
        const detectPlayemStreams = bookmarklet.makeStreamDetector(players);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'undefined');
      });

      it('should return a track from its URL when a simple detector was provided', async () => {
        const playerId = 'yt';
        const videoId = 'uWB8plk9sXk';
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const detectors = {
          [playerId]: { getEid: () => videoId }
        };
        const detectPlayemStreams = bookmarklet.makeStreamDetector(detectors);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'object');
        assert.equal(track.eId, `/${playerId}/${videoId}`);
      });

      it('should return a track from its URL when a complete detector was provided', async () => {
        const playerId = 'yt';
        const videoId = 'uWB8plk9sXk';
        const videoTitle = 'Harissa - Tierra';
        const videoImg = `https://i.ytimg.com/vi/${videoId}/default.jpg`;
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const detectors = {
          [playerId]: {
            getEid: () => videoId,
            fetchMetadata: () => ({
              id: videoId,
              title: videoTitle,
              img: videoImg
            })
          }
        };
        const detectPlayemStreams = bookmarklet.makeStreamDetector(detectors);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'object');
        assert.equal(track.id, videoId);
        assert.equal(track.title, '(YouTube track)'); // TODO: should be videoTitle instead, see #262
        assert.equal(track.img, videoImg);
        assert.equal(track.eId, `/${playerId}/${videoId}`);
        assert.equal(track.sourceId, playerId);
      });
    });
  });
});

/**
 * How to manually test the bookmarklet, in a web browser
 * 
   // 1. Go to the /all page (because it always shows at least one video)
   window.location.href = 'http://localhost:8080/all';
   
   // 2. Load the local bookmarket, using the JavaScript console:
   window.document.body.appendChild(
     window.document.createElement('script')
   ).src = `http://localhost:8080/js/bookmarklet.js?${Date.now()}`;
 *
 **/
