const assert = require('assert');
const request = require('request');

const { URL_PREFIX, DUMMY_USER, cleanup } = require('../fixtures.js');
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
    api.loginAs(DUMMY_USER, (error, { jar }) => {
      api.addPost(jar, postInPlaylist, (error, res) =>
        error ? reject(error) : resolve(res)
      );
    });
  });

describe(`Data Export API`, () => {
  // API documentation: https://openwhyd.github.io/openwhyd/API.html#openwhyd-data-export-api

  before(cleanup); // to prevent side effects between tests

  // add a playlist with one track
  const user = DUMMY_USER;
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

  describe(`provides profile tracks`, () => {
    it(`of given user id, as JSON`, async () => {
      const { body } = await reqGet(`${URL_PREFIX}/u/${user.id}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, track.name);
    });

    it(`of given user id, as a list of links`, async () => {
      const { body } = await reqGet(`${URL_PREFIX}/u/${user.id}?format=links`);
      assert.strictEqual(body, track.url);
    });

    it(`of given user handle, as JSON`, async () => {
      const { body } = await reqGet(`${URL_PREFIX}/${user.handle}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, track.name);
    });

    it(`of given user handle, as a list of links`, async () => {
      const { body } = await reqGet(
        `${URL_PREFIX}/${user.handle}?format=links`
      );
      assert.strictEqual(body, track.url);
    });
  });

  describe(`provides list of playlists`, () => {
    it(`of given user id, as JSON`, async () => {
      const plUrl = `${URL_PREFIX}/u/${user.id}/playlists`;
      const { body } = await reqGet(`${plUrl}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, plName);
    });

    it(`of given user id, as list`, async () => {
      const expectedRes = `<a href="/u/${user.id}/playlist/0">${plName}</a>`;
      const plUrl = `${URL_PREFIX}/u/${user.id}/playlists`;
      const { body } = await reqGet(`${plUrl}?format=list`);
      assert.notStrictEqual(body.indexOf(expectedRes), -1);
    });

    it(`of given user handle, as JSON`, async () => {
      const plUrl = `${URL_PREFIX}/${user.handle}/playlists`;
      const { body } = await reqGet(`${plUrl}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, plName);
    });

    it(`of given user handle, as list`, async () => {
      const expectedRes = `<a href="/u/${user.id}/playlist/0">${plName}</a>`;
      const plUrl = `${URL_PREFIX}/${user.handle}/playlists`;
      const { body } = await reqGet(`${plUrl}?format=list`);
      assert.notStrictEqual(body.indexOf(expectedRes), -1);
    });
  });

  describe(`provides playlist tracks`, () => {
    it(`of given user id, as JSON`, async () => {
      const plUrl = `${URL_PREFIX}/u/${user.id}/playlist/0`;
      const { body } = await reqGet(`${plUrl}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, track.name);
    });

    it(`of given user id, as a list of links`, async () => {
      const plUrl = `${URL_PREFIX}/u/${user.id}/playlist/0`;
      const { body } = await reqGet(`${plUrl}?format=links`);
      assert.strictEqual(body, track.url);
    });

    it(`of given user handle, as JSON`, async () => {
      const plUrl = `${URL_PREFIX}/${user.handle}/playlist/0`;
      const { body } = await reqGet(`${plUrl}?format=json`);
      const parsedBody = JSON.parse(body) || {};
      assert.strictEqual(parsedBody.error, undefined);
      assert.strictEqual(parsedBody.length, 1);
      assert.strictEqual(parsedBody[0].name, track.name);
    });

    it(`of given user handle, as a list of links`, async () => {
      const plUrl = `${URL_PREFIX}/u/${user.id}/playlist/0`;
      const { body } = await reqGet(`${plUrl}?format=links`);
      assert.strictEqual(body, track.url);
    });
  });
});
