// $ npx mocha test/unit/validatePostTrackRequest-tests.js

const { validatePostTrackRequest } = require('../../app/api-v2/OpenwhydApiV2');
const assert = require('assert');

const validRequest =
  /** @type {import('../../app/domain/api/Features').PostTrackRequest} */ ({
    url: 'https://www.youtube.com/watch?v=123',
    title: 'a track',
  });

describe('validatePostTrackRequest', () => {
  it('should parse a valid request', async () => {
    assert.ok(validatePostTrackRequest(validRequest));
  });

  it('should reject an empty request', async () => {
    assert.throws(() => validatePostTrackRequest({}), {
      message: /Invalid postTrack request: data must have required property/,
    });
  });
});
