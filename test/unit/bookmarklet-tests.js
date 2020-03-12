const assert = require('assert');
const { detectTracks } = require('./../../public/js/bookmarklet.js');

const makeWindow = ({ title = '' }) => ({
  location: { href: '' },
  document: {
    title,
    getElementsByTagName: () => []
  }
});

const detectTracksAsPromise = ({ title }) =>
  new Promise(resolve => {
    const tracks = [];
    detectTracks({
      window: makeWindow({ title }),
      ui: {
        get nbTracks() {
          return tracks.length;
        },
        addSearchThumb: track => tracks.push(track),
        finish: () => resolve(tracks)
      },
      urlDetectors: []
    });
  });

describe('bookmarklet', () => {
  it('should return a search link when no tracks were found on the page', async () => {
    const title = 'dummy title';
    const results = await detectTracksAsPromise({ title });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].name, title);
  });

  it('should return the track title from a Spotify page', async () => {
    const songTitle = 'Dummy Song';
    const title = `${songTitle} - Spotify`;
    const results = await detectTracksAsPromise({ title });
    console.log(results);
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].searchQuery, songTitle);
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
