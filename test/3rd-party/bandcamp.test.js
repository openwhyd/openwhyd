// Checks that our server can still extract a playable stream URL from a
// Bandcamp track page, by hitting the actual Bandcamp website.
// (cf https://github.com/openwhyd/openwhyd/issues/940)
//
// Usage:
// $ npx jest test/3rd-party/bandcamp.test.js

const config = require('../../app/models/config.js');
const bandcampExtractor = require('../../app/controllers/api/bandcampExtractor.js');

const TIMEOUT = 20 * 1000;
const EID = '/bc/harissa/rooftop'; // => https://harissa.bandcamp.com/track/rooftop

config.urlPrefix = config.urlPrefix || 'http://localhost:8080'; // normally set by app.js

const callExtractorAPI = (reqParams) =>
  new Promise((resolve, reject) => {
    const req = {
      logToConsole: () => null,
      getReferer: () => config.urlPrefix,
    };
    const res = {
      json: resolve,
      badRequest: () => reject(new Error('bad request')),
    };
    bandcampExtractor.controller(req, reqParams, res);
  });

describe('Bandcamp stream extractor', () => {
  it(
    'should return a playable stream URL for a Bandcamp track',
    async () => {
      const result = await callExtractorAPI({ eId: EID });
      expect(result).toEqual({
        eId: EID,
        streamURL: expect.stringMatching(
          /^https:\/\/[^.]+\.bcbits\.com\/stream\//,
        ),
      });

      const audio = await fetch(result.streamURL, {
        headers: { Range: 'bytes=0-1023' },
      });
      expect(audio.ok).toBe(true);
      expect(audio.headers.get('content-type')).toBe('audio/mpeg');
    },
    TIMEOUT,
  );
});
