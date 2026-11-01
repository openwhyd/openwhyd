// $ npx mocha test/unit/bandcampExtractor-tests.js

const assert = require('assert');
const fs = require('fs');
const {
  extractBandcampStreamURLs,
  extractBandcampStreamURLsFromHTML,
  extractBandcampIdsFromHTML,
  extractStreamURLFromMobileAPIResponse,
} = require('./../../app/controllers/api/bandcampExtractor.js');

describe('bandcampExtractor', function () {
  it('should recognize a stream URL', () => {
    const streamURL =
      'https://t4.bcbits.com/stream/d69e7e2cc061e30c53af531f985f66ef/mp3-128/1126664010?p=0&ts=1605539654&t=e83388305910741c5cb68fe0b3a49f119a849a1e&token=1605539654_daf26d4f4b84aed8da22c8a79a991ee7b27b8263';
    const matches = extractBandcampStreamURLs(streamURL);
    assert.deepStrictEqual(matches, [streamURL]);
  });

  it('should recognize two stream URLs in a same page', () => {
    const streams = [
      'https://xyz.bcbits.com/stream/a/mp3-128/1?p=0&ts=1',
      'https://xyz.bcbits.com/stream/b/mp3-128/2?p=0&ts=1',
    ];
    const matches = extractBandcampStreamURLs(JSON.stringify(streams));
    assert.deepStrictEqual(matches, streams);
  });

  it('should extract the stream URL from an actual track page', async () => {
    // set expectations
    const expectedMatches = 1;
    const expectedHostname = 'bcbits.com';
    const expectedSearchParams = ['p', 't', 'token', 'ts'];
    // run test
    const body = await fs.promises.readFile(
      'public/html/test-resources/bandcamp-track-page.html', // from https://harissa.bandcamp.com/track/rooftop
      'utf8',
    );
    const matches = extractBandcampStreamURLsFromHTML(body);
    assert.strictEqual(matches.length, expectedMatches);
    const url = new URL(matches[0]);
    assert(url.hostname.endsWith(expectedHostname));
    assert.deepStrictEqual(
      [...url.searchParams.keys()].sort(),
      expectedSearchParams,
    );
  });

  it('should extract band and track ids from an actual track page', async () => {
    const body = await fs.promises.readFile(
      'public/html/test-resources/bandcamp-track-page.html',
      'utf8',
    );
    assert.deepStrictEqual(extractBandcampIdsFromHTML(body), {
      bandId: '2982592934',
      trackId: '1126664010',
    });
  });

  it('should not extract ids from an unrelated page', () => {
    assert.strictEqual(extractBandcampIdsFromHTML('<html></html>'), null);
  });

  it('should pick the stream URL from a mobile API response', () => {
    const url128 = 'https://t4.bcbits.com/stream/a/mp3-128/1?p=0';
    const details = {
      tracks: [
        { track_id: 2, streaming_url: { 'mp3-128': 'https://x/other' } },
        { track_id: 1, streaming_url: { 'mp3-128': url128 } },
      ],
    };
    assert.strictEqual(
      extractStreamURLFromMobileAPIResponse(details, 1),
      url128,
    );
    assert.strictEqual(extractStreamURLFromMobileAPIResponse({}, 1), undefined);
  });
});
