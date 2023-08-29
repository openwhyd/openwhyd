const vm = require('vm');
const assert = require('assert');
const request = require('request');

const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { DUMMY_USER } = require('../fixtures.js');
const api = require('../api-client.js');

const reqGet = (url) =>
  new Promise((resolve, reject) =>
    request.get({ url }, (err, response, body) =>
      err ? reject(err) : resolve({ response, body }),
    ),
  );

const addTrackToPlaylist = (user, plName, post) =>
  new Promise((resolve, reject) => {
    const postInPlaylist = { ...post, pl: { id: 'create', name: plName } };
    api.loginAs(DUMMY_USER, (error, { jar }) => {
      api.addPost(jar, postInPlaylist).then(resolve).catch(reject);
    });
  });

describe(`Data Export API`, function () {
  // API documentation: https://openwhyd.github.io/openwhyd/API.html#openwhyd-data-export-api

  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });
  let URL_PREFIX;

  before(async () => {
    await openwhyd.setup();
    URL_PREFIX = openwhyd.getURL();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    this.timeout(4000);
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
    return addTrackToPlaylist(user, plName, track);
  });

  // add a playlist with one track
  const user = DUMMY_USER;
  const plName = 'my first playlist';
  const track = {
    name: 'my first track',
    eId: '/yt/59MdiE1IsBY',
    url: '//youtube.com/watch?v=59MdiE1IsBY',
  };

  describe(`provides profile tracks`, () => {
    it(`of given user id, as JSON, using callback`, async () => {
      const { body } = await reqGet(
        `${URL_PREFIX}/u/${user.id}?callback=callbackFct`,
      );
      let apiResponse;
      vm.runInNewContext(body, {
        callbackFct: (data) => {
          apiResponse = data;
        },
      });
      assert.strictEqual(apiResponse.error, undefined);
      assert.strictEqual(apiResponse.length, 1);
      assert.strictEqual(apiResponse[0].name, track.name);
    });

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
        `${URL_PREFIX}/${user.handle}?format=links`,
      );
      assert.strictEqual(body, track.url);
    });
  });

  describe(`provides list of playlists`, () => {
    it(`of given user id, as JSON, using callback`, async () => {
      const { body } = await reqGet(
        `${URL_PREFIX}/u/${user.id}/playlists?callback=callbackFct`,
      );
      let apiResponse;
      vm.runInNewContext(body, {
        callbackFct: (data) => {
          apiResponse = data;
        },
      });
      assert.strictEqual(apiResponse.error, undefined);
      assert.strictEqual(apiResponse.length, 1);
      assert.strictEqual(apiResponse[0].name, plName);
    });

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
    it(`of given user id, as JSON, using callback`, async () => {
      const { body } = await reqGet(
        `${URL_PREFIX}/u/${user.id}/playlist/0?callback=callbackFct`,
      );
      let apiResponse;
      vm.runInNewContext(body, {
        callbackFct: (data) => {
          apiResponse = data;
        },
      });
      assert.strictEqual(apiResponse.error, undefined);
      assert.strictEqual(apiResponse.length, 1);
      assert.strictEqual(apiResponse[0].name, track.name);
    });

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
