const assert = require('assert');
const bookmarklet = require('./../../public/js/bookmarklet.js');

const YOUTUBE_VIDEO = {
  id: 'uWB8plk9sXk',
  title: 'Harissa - Tierra',
  img: `https://i.ytimg.com/vi/uWB8plk9sXk/default.jpg`,
  url: `https://www.youtube.com/watch?v=uWB8plk9sXk`,
  elementsByTagName: {
    'ytd-watch-flexy': [
      {
        role: 'main',
        'video-id': 'uWB8plk9sXk'
      }
    ]
  }
};

const makeElement = attributes => ({
  ...attributes,
  getAttribute: attr => attributes[attr]
});

const makeWindow = ({ url = '', title = '', elementsByTagName = {} }) => ({
  location: { href: url },
  document: {
    title,
    getElementsByTagName: tagName =>
      (elementsByTagName[tagName] || []).map(makeElement)
    // TODO: getElementsByClassName()
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
        addThumb: track => tracks.push(track),
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
    assert.equal(results[0].searchQuery, window.document.title);
  });

  it('should return the track title from a Spotify page', async () => {
    const songTitle = 'Dummy Song';
    const window = makeWindow({
      url:
        'https://open.spotify.com/album/0EX4lJA3CFaKIvjFJyYIpe?highlight=spotify:track:0P41Qf51RcEWId6W6RykV4',
      title: `${songTitle} - Spotify`
    });
    const results = await detectTracksAsPromise({ window });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].searchQuery, songTitle);
  });

  it('should return the track url and title from a YouTube page', async () => {
    const window = makeWindow({
      url: YOUTUBE_VIDEO.url,
      title: `${YOUTUBE_VIDEO.title} - YouTube`,
      elementsByTagName: YOUTUBE_VIDEO.elementsByTagName
    });
    const results = await detectTracksAsPromise({ window });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    assert.equal(results[0].name, YOUTUBE_VIDEO.title);
  });

  it('should return the track metadata from a YouTube page when its detector is provided', async () => {
    const window = makeWindow({
      url: YOUTUBE_VIDEO.url,
      title: `${YOUTUBE_VIDEO.title} - YouTube`,
      elementsByTagName: YOUTUBE_VIDEO.elementsByTagName
    });
    const playerId = 'yt';
    const detectors = { [playerId]: bookmarklet.YOUTUBE_PLAYER };
    const results = await detectTracksAsPromise({
      window,
      urlDetectors: [bookmarklet.makeStreamDetector(detectors)]
    });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    const track = results[0];
    assert.equal(track.id, YOUTUBE_VIDEO.id);
    assert.equal(track.title, YOUTUBE_VIDEO.title);
    assert.equal(track.img, YOUTUBE_VIDEO.img);
    assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
    assert.equal(track.sourceId, playerId);
  });

  it(`should return a track with metadata from a YouTube page that lists that track as a link`, async () => {
    const window = makeWindow({
      elementsByTagName: {
        a: [
          {
            href: YOUTUBE_VIDEO.url,
            textContent: YOUTUBE_VIDEO.title
          }
        ]
      }
    });
    const playerId = 'yt';
    const detectors = { [playerId]: bookmarklet.YOUTUBE_PLAYER };
    const results = await detectTracksAsPromise({
      window,
      urlDetectors: [bookmarklet.makeStreamDetector(detectors)]
    });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    const track = results[0];
    assert.equal(track.id, YOUTUBE_VIDEO.id);
    assert.equal(track.title, YOUTUBE_VIDEO.title);
    assert.equal(track.img, YOUTUBE_VIDEO.img);
    assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
    assert.equal(track.sourceId, playerId);
  });

  it(`should return a track with the expected name when that track was found as a link from a YouTube page`, async () => {
    const window = makeWindow({
      elementsByTagName: {
        a: [
          {
            href: YOUTUBE_VIDEO.url,
            textContent: `\n${YOUTUBE_VIDEO.title}\nHarissa Quartet\nVerified\n•287K views\n`
          }
        ]
      }
    });
    const playerId = 'yt';
    const detectors = { [playerId]: bookmarklet.YOUTUBE_PLAYER };
    const results = await detectTracksAsPromise({
      window,
      urlDetectors: [bookmarklet.makeStreamDetector(detectors)]
    });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    const track = results[0];
    assert.equal(track.id, YOUTUBE_VIDEO.id);
    assert.equal(track.title, YOUTUBE_VIDEO.title);
    assert.equal(track.img, YOUTUBE_VIDEO.img);
    assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
    assert.equal(track.sourceId, playerId);
  });

  it(`should return the page's track with metadata from a YouTube page when the same track is also listed in the page with less metadata`, async () => {
    const window = makeWindow({
      url: YOUTUBE_VIDEO.url,
      title: `${YOUTUBE_VIDEO.title} - YouTube`,
      elementsByTagName: YOUTUBE_VIDEO.elementsByTagName
    });
    const playerId = 'yt';
    const detectors = { [playerId]: bookmarklet.YOUTUBE_PLAYER };
    const results = await detectTracksAsPromise({
      window,
      urlDetectors: [bookmarklet.makeStreamDetector(detectors)]
    });
    assert.equal(typeof results, 'object');
    assert.equal(results.length, 1);
    const track = results[0];
    assert.equal(track.id, YOUTUBE_VIDEO.id);
    assert.equal(track.title, YOUTUBE_VIDEO.title);
    assert.equal(track.img, YOUTUBE_VIDEO.img);
    assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
    assert.equal(track.sourceId, playerId);
  });

  describe('makeFileDetector()', () => {
    it('should return a mp3 file from a URL', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.mp3`;
      const element = { title: '' };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.id, url);
    });

    it('should return a ogg file from a URL', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.ogg`;
      const element = { title: '' };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.id, url);
    });

    it('should not return duplicates', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.ogg`;
      const element = { title: '' };
      const detect = () => new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof (await detect()), 'object');
      assert.equal(typeof (await detect()), 'undefined');
    });

    it('should return the name of the file as name of the track', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const fileName = 'myfile';
      const url = `http://myblog/${fileName}.mp3`;
      const element = { title: '' };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.title, fileName);
    });

    it('should return the title of the link as name of the track', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.mp3`;
      const title = 'my track';
      const element = { title };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.title, title);
    });

    it('should return the cleaned-up inner text of the link as name of the track', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.mp3`;
      const title = 'my track';
      const element = { innerText: ` \n ${title}\n ` };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.title, title);
    });

    it('should return the cleaned-up text content of the link as name of the track', async () => {
      const detectFile = bookmarklet.makeFileDetector();
      const url = `http://myblog/myfile.mp3`;
      const title = 'my track';
      const element = { textContent: ` \n ${title}\n ` };
      const track = await new Promise(cb => detectFile(url, cb, element));
      assert.equal(typeof track, 'object');
      assert.equal(track.title, title);
    });
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
          [playerId]: { getEid: bookmarklet.YOUTUBE_PLAYER.getEid }
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
            fetchMetadata: (url, callback) =>
              callback({
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
        assert.equal(track.title, YOUTUBE_VIDEO.title);
        assert.equal(track.img, YOUTUBE_VIDEO.img);
        assert.equal(track.eId, `/${playerId}/${YOUTUBE_VIDEO.id}`);
        assert.equal(track.sourceId, playerId);
      });
    });
  });
});

/**
 * How to manually test the bookmarklet
 * 
   // 1. Make sure that openwhyd is running locally

   // 2. In your web browser, open a web page that contains videos
   
   // 3. In the page's JavaScript console, Load the local bookmarket:
   
   window.document.body.appendChild(
     window.document.createElement('script')
   ).src = `http://localhost:8080/js/bookmarklet.js?${Date.now()}`;
 *
 **/
