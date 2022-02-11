const assert = require('assert');

const { DUMMY_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');

describe(`user api -- getting user data`, function () {
  before(cleanup); // to prevent side effects between tests

  it(`gets user profile data`, function (done) {
    const url =
      '/api/user?includeSubscr=true&isSubscr=true&countPosts=true&countLikes=true&getVersion=1';
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.get(jar, url, function (err, { body, ...res }) {
        assert.ifError(err);
        assert.equal(res.response.statusCode, 200);
        assert(!body.error);
        assert.equal(body.email, DUMMY_USER.email);
        done();
      });
    });
  });
});

describe(`user api -- setting user data`, function () {
  before(cleanup); // to prevent side effects between tests

  it(`updates the user's name`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { body, jar }) {
      assert.ifError(body.error);
      assert(body.redirect);
      api.getUser(jar, {}, function (error, { body }) {
        assert.equal(body.name, DUMMY_USER.name);
        const newName = 'renamed user';
        api.setUser(jar, { name: newName }, function (error, { body }) {
          assert.equal(body.name, newName);
          done();
        });
      });
    });
  });
});
