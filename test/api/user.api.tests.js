/* global describe, it, before */

var assert = require('assert');
var { ADMIN_USER, cleanup } = require('../fixtures.js');
var api = require('../api-client.js');

describe(`user api -- getting user data`, function () {
  before(cleanup); // to prevent side effects between tests

  it(`gets user profile data`, function (done) {
    const url =
      '/api/user?includeSubscr=true&isSubscr=true&countPosts=true&countLikes=true&getVersion=1';
    api.loginAs(ADMIN_USER, function (error, { jar }) {
      api.get(jar, url, function (err, { body, ...res }) {
        assert.ifError(err);
        assert.equal(res.response.statusCode, 200);
        assert(!body.error);
        assert.equal(body.email, ADMIN_USER.email);
        assert(body.openwhydServerVersion);
        done();
      });
    });
  });
});

describe(`user api -- setting user data`, function () {
  before(cleanup); // to prevent side effects between tests

  it(`updates the user's name`, function (done) {
    api.loginAs(ADMIN_USER, function (error, { response, body, jar }) {
      assert.ifError(body.error);
      assert(body.redirect);
      api.getUser(jar, {}, function (error, { response, body }) {
        assert.equal(body.name, ADMIN_USER.name);
        const newName = 'renamed user';
        api.setUser(jar, { name: newName }, function (
          error,
          { response, body }
        ) {
          assert.equal(body.name, newName);
          done();
        });
      });
    });
  });
});
