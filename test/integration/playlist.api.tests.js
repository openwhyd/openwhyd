var assert = require('assert');
const util = require('util');
const request = require('request');

var { ADMIN_USER, cleanup, URL_PREFIX } = require('../fixtures.js');
var api = require('../api-client.js');
var { START_WITH_ENV_FILE } = process.env;
const { startOpenwhydServer } = require('../approval-tests-helpers');
const randomString = () => Math.random().toString(36).substring(2, 9);

describe(`playlist api`, function () {
  let jar;
  let context = {};

  before(cleanup); // to prevent side effects between test suites
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
    async () => ({ jar } = await util.promisify(api.loginAs)(ADMIN_USER))
    /* FIXME: We are forced to use the ADMIN_USER, since DUMMY_USER is mutated by user.api.tests.js and the db cleanup seems to not work for the users collection.
     * May be initdb_testing.js is not up to date with the current schema?
     */
  );

  it('should create a playlist', async function () {
    const playlistName = `playlist-${randomString()}`;
    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'create',
            name: playlistName,
          },
          url: `${URL_PREFIX}/api/playlist`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );

    const { id, name } = JSON.parse(res.body);
    assert.equal(name, playlistName);
    assert.equal(id, 0);
  });
});
