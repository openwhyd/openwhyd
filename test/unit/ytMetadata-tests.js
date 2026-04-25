// $ npx mocha test/unit/ytMetadata-tests.js

const assert = require('assert');

// We test the core logic of ytMetadata by checking the video ID validation
// and the in-memory cache behavior, without making real HTTP requests.

describe('ytMetadata controller', function () {
  let controller;
  let requestSpy;

  const requestModulePath = require.resolve('request');

  beforeEach(function () {
    // Clear ytMetadata from module cache so each test gets a fresh in-memory
    // store and picks up our mock for the 'request' module.
    delete require.cache[
      require.resolve('../../app/controllers/api/ytMetadata')
    ];

    // Override the 'request' module in the cache with a spy so that the
    // ytMetadata controller uses our stub instead of making real HTTP calls.
    const originalRequestExports = require.cache[requestModulePath]
      ? require.cache[requestModulePath].exports
      : null;

    requestSpy = null;
    require.cache[requestModulePath] = {
      id: requestModulePath,
      filename: requestModulePath,
      loaded: true,
      exports: function () {
        return requestSpy.apply(this, arguments);
      },
    };

    controller = require('../../app/controllers/api/ytMetadata').controller;

    // Restore the real 'request' after loading ytMetadata (the reference is
    // already captured inside the module's closure).
    if (originalRequestExports) {
      require.cache[requestModulePath].exports = originalRequestExports;
    }
  });

  afterEach(function () {
    delete require.cache[
      require.resolve('../../app/controllers/api/ytMetadata')
    ];
  });

  function makeResponse() {
    return {
      rendered: null,
      renderJSON(data) {
        this.rendered = data;
      },
    };
  }

  function makeRequest() {
    return { logToConsole: () => {} };
  }

  it('should reject a missing videoId', function () {
    const res = makeResponse();
    controller(makeRequest(), {}, res);
    assert(res.rendered);
    assert.strictEqual(res.rendered.error, 'missing or invalid videoId');
  });

  it('should reject a videoId with invalid characters', function () {
    const res = makeResponse();
    controller(makeRequest(), { videoId: '../../etc/passwd' }, res);
    assert(res.rendered);
    assert.strictEqual(res.rendered.error, 'missing or invalid videoId');
  });

  it('should reject a videoId that is too long', function () {
    const res = makeResponse();
    controller(makeRequest(), { videoId: 'a'.repeat(21) }, res);
    assert(res.rendered);
    assert.strictEqual(res.rendered.error, 'missing or invalid videoId');
  });

  it('should accept a valid videoId and return oEmbed data', function (done) {
    requestSpy = function (url, callback) {
      assert(url.includes('abc123'), 'URL should contain the video ID');
      callback(
        null,
        { statusCode: 200 },
        JSON.stringify({
          title: 'Test Video Title',
          thumbnail_url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        }),
      );
    };

    const res = makeResponse();
    controller(makeRequest(), { videoId: 'abc123' }, res);

    setTimeout(function () {
      assert(res.rendered, 'expected a response');
      assert.strictEqual(res.rendered.title, 'Test Video Title');
      assert.strictEqual(res.rendered.id, 'abc123');
      assert.strictEqual(res.rendered.eId, '/yt/abc123');
      assert.strictEqual(
        res.rendered.url,
        'https://www.youtube.com/watch?v=abc123',
      );
      done();
    }, 50);
  });

  it('should accept an eId (/yt/...) and extract the videoId', function (done) {
    requestSpy = function (url, callback) {
      assert(url.includes('xyz789'), 'URL should contain the video ID');
      callback(
        null,
        { statusCode: 200 },
        JSON.stringify({ title: 'Another Video' }),
      );
    };

    const res = makeResponse();
    controller(makeRequest(), { videoId: '/yt/xyz789' }, res);

    setTimeout(function () {
      assert(res.rendered, 'expected a response');
      assert.strictEqual(res.rendered.id, 'xyz789');
      assert.strictEqual(res.rendered.eId, '/yt/xyz789');
      done();
    }, 50);
  });

  it('should serve subsequent requests for the same videoId from cache', function (done) {
    let requestCount = 0;
    requestSpy = function (url, callback) {
      requestCount++;
      callback(
        null,
        { statusCode: 200 },
        JSON.stringify({ title: 'Cached Video' }),
      );
    };

    const req = makeRequest();
    const res1 = makeResponse();
    controller(req, { videoId: 'cached1' }, res1);

    setTimeout(function () {
      // Second request for the same videoId should come from cache.
      const res2 = makeResponse();
      controller(req, { videoId: 'cached1' }, res2);

      setTimeout(function () {
        assert.strictEqual(
          requestCount,
          1,
          'oEmbed should only be called once for the same video',
        );
        assert.strictEqual(res2.rendered.title, 'Cached Video');
        done();
      }, 50);
    }, 50);
  });

  it('should handle oEmbed request errors gracefully', function (done) {
    requestSpy = function (url, callback) {
      callback(new Error('network error'), null, null);
    };

    const res = makeResponse();
    controller(makeRequest(), { videoId: 'errVideo' }, res);

    setTimeout(function () {
      assert(res.rendered, 'expected a response');
      assert(res.rendered.error, 'expected an error field');
      done();
    }, 50);
  });

  it('should return a partial response for private videos (401)', function (done) {
    requestSpy = function (url, callback) {
      callback(null, { statusCode: 401 }, '');
    };

    const res = makeResponse();
    controller(makeRequest(), { videoId: 'prv123' }, res);

    setTimeout(function () {
      assert(res.rendered, 'expected a response');
      assert.strictEqual(res.rendered.id, 'prv123');
      assert.strictEqual(res.rendered.title, '');
      done();
    }, 50);
  });
});
