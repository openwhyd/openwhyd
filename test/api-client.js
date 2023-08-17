var assert = require('assert');
var request = require('request'); // TODO: promisify it

var { URL_PREFIX } = require('./fixtures.js');

const EXPECTED_RTK = 7; // cf app/controllers/invite.js

// AUTH

function extractCookieJar(response) {
  const jar = request.jar();
  if (((response.headers || {})['set-cookie'] || []).length) {
    jar.setCookie(
      request.cookie(response.headers['set-cookie'][0]),
      URL_PREFIX,
    );
  }
  return jar;
}

exports.logout = function logout(jar, callback) {
  exports.get(jar, `/login?action=logout&ajax=1`, function (error, res) {
    assert.ifError(error);
    assert.equal(res.response.statusCode, 200);
    callback(
      error,
      Object.assign({}, res, { jar: extractCookieJar(res.response) }),
    );
  });
};

exports.loginAs = function loginAs(user, callback) {
  const email = encodeURIComponent(user.email);
  const url = `/login?action=login&ajax=1&email=${email}&md5=${user.md5}`;
  exports.get(null, url, function (error, res) {
    assert.ifError(error); // TODO: pass error to callback
    assert.equal(res.response.statusCode, 200); // TODO: pass error to callback
    const jar = extractCookieJar(res.response);
    const loggedIn = !!jar.getCookieString(URL_PREFIX);
    callback(error, Object.assign({}, res, { jar, loggedIn }));
  });
};

exports.signupAs = async function signupAs(user, callback) {
  const body = await new Promise((resolve, reject) =>
    request.get(
      { url: `${URL_PREFIX}/api/signup/rTk/${EXPECTED_RTK}` },
      (error, response, body) => (error ? reject(error) : resolve(body)),
    ),
  );
  const sTk = body.split('value="').pop().split('"')[0];
  request.post(
    {
      url: `${URL_PREFIX}/register`,
      json: true,
      body: Object.assign(
        {
          ajax: 1,
          sTk,
        },
        user,
      ),
    },
    function (error, response, body) {
      assert.ifError(error); // TODO: pass error to callback
      assert.equal(response.statusCode, 200); // TODO: pass error to callback
      const jar = extractCookieJar(response);
      const loggedIn = !!jar.getCookieString(URL_PREFIX);
      callback(error, { response, body, jar, loggedIn });
    },
  );
};
// HTTP request wrappers

exports.getRaw = function (jar, url, callback) {
  request.get(
    { jar, url: `${URL_PREFIX}${url}` },
    function (error, response, body) {
      callback(error, { response, body });
    },
  );
};

exports.get = function (jar, url, callback) {
  exports.getRaw(jar, url, function (error, { response, body }) {
    let parsedBody = undefined;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      error = error || e;
    }
    callback(error, { response, body: parsedBody, jar });
  });
};

exports.postRaw = function (jar, url, body, callback) {
  request.post(
    { jar, url: `${URL_PREFIX}${url}`, body, json: typeof body === 'object' },
    (error, response, body) => callback(error, { response, body }),
  );
};

// USER

exports.getMyPosts = function (jar, callback) {
  request.get(
    { jar, url: `${URL_PREFIX}/me?format=json` },
    function (error, response, body) {
      assert.ifError(error);
      assert.equal(response.statusCode, 200);
      callback(error, { response, body, posts: JSON.parse(body), jar });
      // => body: {"errorCode":"USER_NOT_FOUND","error":"User not found..."} ???
    },
  );
};

exports.getUser = function (jar, body, callback) {
  // TODO: pass body parameters
  exports.get(jar, `/api/user`, function (error, res) {
    assert.ifError(error);
    assert.equal(res.response.statusCode, 200);
    callback(error, res);
  });
};

exports.setUser = function (jar, body, callback) {
  request.post(
    {
      jar,
      url: `${URL_PREFIX}/api/user`,
      json: true,
      body,
    },
    function (error, response, body) {
      assert.ifError(error);
      assert.equal(response.statusCode, 200);
      callback(error, { response, body, jar });
    },
  );
};

// /api/post

exports.addPost = async function (jar, reqBody) {
  const { response, body } = await new Promise((resolve, reject) =>
    request.post(
      {
        jar,
        url: `${URL_PREFIX}/api/post`,
        json: true,
        body: Object.assign({ action: 'insert' }, reqBody),
      },
      function (error, resp, resBody) {
        if (error) reject(error);
        else resolve({ response: resp, body: resBody });
      },
    ),
  );
  assert.equal(
    response.statusCode,
    200,
    body?.error?.message ?? body?.error ?? body,
  );
  return { response, body, jar };
};

exports.addComment = function (jar, body, callback) {
  request.post(
    {
      jar,
      url: `${URL_PREFIX}/api/post`,
      json: true,
      body: Object.assign({ action: 'addComment' }, body),
    },
    function (error, response, body) {
      assert.ifError(error);
      assert.equal(response.statusCode, 200);
      callback(error, { response, body, jar });
    },
  );
};

exports.deletePost = async function (jar, postId) {
  const { response, body } = await new Promise((resolve, reject) =>
    request.post(
      {
        jar,
        url: `${URL_PREFIX}/api/post`,
        json: true,
        body: Object.assign({ action: 'delete' }, { _id: postId }),
      },
      function (error, response, body) {
        if (error) reject(error);
        else resolve({ response, body });
      },
    ),
  );
  assert.equal(response.statusCode, 200, body);
  return { response, body, jar };
};

exports.getPlaylist = function (jar, plId, callback) {
  exports.get(jar, `/api/playlist?id=${plId}`, callback);
};

exports.getPlaylistTracks = function (jar, uId, plId, callback) {
  // TODO: define a version that accepts parameters (limit, after, before...)
  exports.get(jar, `/${uId}/playlist/${plId}?format=json`, callback);
};
