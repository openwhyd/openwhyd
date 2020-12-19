/* global describe, it, before */

const assert = require('assert');
const request = require('request');

const { URL_PREFIX, ADMIN_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');

const reqGet = (url) =>
  new Promise((resolve, reject) =>
    request.get({ url }, (err, response, body) =>
      err ? reject(err) : resolve({ response, body })
    )
  );

const addTrackToPlaylist = (user, plName, post) =>
  new Promise((resolve, reject) => {
    const postInPlaylist = { ...post, pl: { id: 'create', name: plName } };
    api.loginAs(ADMIN_USER, (error, { jar }) => {
      api.addPost(jar, postInPlaylist, (error, res) =>
        error ? reject(error) : resolve(res)
      );
    });
  });

describe(`data export api -- getting user data`, () => {
  before(cleanup); // to prevent side effects between tests

  // add a playlist with one track
  const user = ADMIN_USER;
  const plName = 'my first playlist';
  const track = {
    name: 'my first track',
    eId: '/yt/59MdiE1IsBY',
    url: '//youtube.com/watch?v=59MdiE1IsBY',
  };
  before(function () {
    this.timeout(4000);
    return addTrackToPlaylist(user, plName, track);
  });

  it(`provides profile tracks of given user id, as JSON`, async () => {
    const { body } = await reqGet(`${URL_PREFIX}/u/${user.id}?format=json`);
    const parsedBody = JSON.parse(body) || {};
    assert.strictEqual(parsedBody.error, undefined);
    assert.strictEqual(parsedBody.length, 1);
    assert.strictEqual(parsedBody[0].name, track.name);
  });

  it(`provides profile tracks of given user id, as a list of links`, async () => {
    const { body } = await reqGet(`${URL_PREFIX}/u/${user.id}?format=links`);
    assert.strictEqual(body, track.url);
  });

  it(`provides profile tracks of given username, as JSON`, async () => {
    const { body } = await reqGet(`${URL_PREFIX}/${user.username}?format=json`);
    const parsedBody = JSON.parse(body) || {};
    assert.strictEqual(parsedBody.error, undefined);
    assert.strictEqual(parsedBody.length, 1);
    assert.strictEqual(parsedBody[0].name, track.name);
  });

  it(`provides profile tracks of given username, as a list of links`, async () => {
    const { body } = await reqGet(
      `${URL_PREFIX}/${user.username}?format=links`
    );
    assert.strictEqual(body, track.url);
  });
});

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
    api.loginAs(ADMIN_USER, function (error, { body, jar }) {
      assert.ifError(body.error);
      assert(body.redirect);
      api.getUser(jar, {}, function (error, { body }) {
        assert.equal(body.name, ADMIN_USER.name);
        const newName = 'renamed user';
        api.setUser(jar, { name: newName }, function (error, { body }) {
          assert.equal(body.name, newName);
          done();
        });
      });
    });
  });
});
