//@ts-check

/**
 * snippet tester
 * @author adrienjoly, whyd
 **/

const assert = require('assert');

describe('snip.httpRequest', function () {
  const snip = require('../../app/snip.js');

  const YOUTUBE_API_KEY = 'AIzaSyDEkfynWx7RpE5Vd0EVubBvl1qq4a6vjio';
  const YOUTUBE_VIDEO_ID = 'aZT8VlTV1YY';

  const url =
    'https://www.googleapis.com/youtube/v3/videos?id=' +
    YOUTUBE_VIDEO_ID +
    '&part=snippet&key=' +
    YOUTUBE_API_KEY;

  function handler(/*err, res*/) {
    //console.log("log", "http response:", res.error || res);
  }

  it('should return a non-null value for google.com', function () {
    assert(snip.httpRequest('https://google.com/', {}, handler));
  });

  it('should run simultaneous requests to google.com', function () {
    const url = 'https://google.com/';
    const req1 = snip.httpRequest(url, {}, handler);
    const req2 = snip.httpRequest(url, {}, handler);
    assert(req1 && req2);
  });

  it('should run simultaneous requests to googleapis.com, until limiter is set', function () {
    const req1 = snip.httpRequestJSON(url, {}, handler);
    const req2 = snip.httpRequestJSON(url, {}, handler);
    const success = req1 && req2;
    snip.httpSetDomain(/youtube\.com/, { queue: [] });
    assert(success);
    // AJ note: what's the meaning of this test? I forgot...
  });
});
