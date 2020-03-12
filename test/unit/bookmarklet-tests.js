const assert = require('assert');
const bookmarklet = require('./../../public/js/bookmarklet.js');

const YOUTUBE_VIDEO = {
  id: 'uWB8plk9sXk',
  title: 'Harissa - Tierra',
  img: `https://i.ytimg.com/vi/uWB8plk9sXk/default.jpg`,
  url: `https://www.youtube.com/watch?v=uWB8plk9sXk`
};

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
        const { url } = YOUTUBE_VIDEO;
        const players = {};
        const detectPlayemStreams = bookmarklet.makeStreamDetector(players);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'undefined');
      });

      it('should return a track from its URL when a simple detector was provided', async () => {
        const { url } = YOUTUBE_VIDEO;
        const playerId = 'yt';
        const detectors = {
          [playerId]: { getEid: () => YOUTUBE_VIDEO.id }
        };
        const detectPlayemStreams = bookmarklet.makeStreamDetector(detectors);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'object');
        assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
      });

      it('should return a track from its URL when a complete detector was provided', async () => {
        const { url } = YOUTUBE_VIDEO;
        const playerId = 'yt';
        const detectors = {
          [playerId]: {
            getEid: () => YOUTUBE_VIDEO.id,
            fetchMetadata: () => ({
              id: YOUTUBE_VIDEO.id,
              title: YOUTUBE_VIDEO.title,
              img: YOUTUBE_VIDEO.img
            })
          }
        };
        const detectPlayemStreams = bookmarklet.makeStreamDetector(detectors);
        const track = await new Promise(cb => detectPlayemStreams(url, cb));
        assert.equal(typeof track, 'object');
        assert.equal(track.id, YOUTUBE_VIDEO.id);
        assert.equal(track.title, '(YouTube track)'); // TODO: should be YOUTUBE_VIDEO.title instead, see #262
        assert.equal(track.img, YOUTUBE_VIDEO.img);
        assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
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
