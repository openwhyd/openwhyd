//@ts-check

/**
 * snippet tester
 * @author adrienjoly, whyd
 **/

const assert = require('assert');

describe('snip.httpRequest', function () {
  const snip = require('../../app/snip.js');

  const GOOGLE_URL = 'https://google.com/';

  function handler(/*err, res*/) {
    //console.log("log", "http response:", res.error || res);
  }

  it('should return a non-null value for google.com', function () {
    assert(snip.httpRequest(GOOGLE_URL, {}, handler));
  });

  it('should run simultaneous requests to google.com', function () {
    const req1 = snip.httpRequest(GOOGLE_URL, {}, handler);
    const req2 = snip.httpRequest(GOOGLE_URL, {}, handler);
    assert(req1 && req2);
  });
});
