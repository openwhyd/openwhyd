const assert = require('assert');
const util = require('util');
const request = require('request');

const { cleanup, URL_PREFIX, DUMMY_USER } = require('../fixtures.js');
const api = require('../api-client.js');
const { START_WITH_ENV_FILE } = process.env;
const { startOpenwhydServer } = require('../approval-tests-helpers.js');
const randomString = () => Math.random().toString(36).substring(2, 9);

function callPlaylistApi(jar, form) {
  return new Promise((resolve, reject) =>
    request.post(
      {
        jar,
        form,
        url: `${URL_PREFIX}/api/playlist`,
      },
      (error, response, body) =>
        error ? reject(error) : resolve({ response, body }),
    ),
  );
}

describe(`playlist api`, function () {
  let jar;
  const context = {};

  beforeEach(cleanup.bind(this, { silent: true })); // to prevent side effects between tests

  before(async () => {
    if (START_WITH_ENV_FILE) {
      context.serverProcess = await startOpenwhydServer({
        startWithEnv: START_WITH_ENV_FILE,
      });
    }
  });

  after(async () => {
    await context.serverProcess?.exit();
  });

  beforeEach(
    async () => ({ jar } = await util.promisify(api.loginAs)(DUMMY_USER)),
  );

  it('should create a playlist', async function () {
    const playlistName = `playlist-${randomString()}`;
    const res = await callPlaylistApi(jar, {
      action: 'create',
      name: playlistName,
    });

    const { id, name } = JSON.parse(res.body);
    assert.equal(name, playlistName);
    assert.equal(id, 0);
  });
});
