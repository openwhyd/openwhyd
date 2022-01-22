// $ npx mocha test/unit/bandcampExtractor-tests.js

var assert = require('assert');
const fs = require('fs');
const request = require('request');
var {
  extractBandcampStreamURLs,
  extractBandcampStreamURLsFromHTML,
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
      'utf8'
    );
    const matches = extractBandcampStreamURLsFromHTML(body);
    assert.strictEqual(matches.length, expectedMatches);
    const url = new URL(matches[0]);
    assert(url.hostname.includes(expectedHostname));
    assert.deepStrictEqual(
      [...url.searchParams.keys()].sort(),
      expectedSearchParams
    );
  });
});

const fetch = (url) =>
  new Promise((resolve, reject) =>
    request(url, (error, response, body) =>
      error ? reject(error) : resolve({ response, body })
    )
  );
