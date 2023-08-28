const assert = require('assert');
const util = require('util');
const request = require('request');

const { DUMMY_USER, URL_PREFIX } = require('../fixtures.js');
const api = require('../api-client.js');
const { START_WITH_ENV_FILE } = process.env;
const { OpenwhydTestEnv } = require('../approval-tests-helpers.js');
const randomString = () => Math.random().toString(36).substring(2, 9);

describe(`playlist api`, function () {
  const openwhyd = new OpenwhydTestEnv({ startWithEnv: START_WITH_ENV_FILE });

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // to prevent side effects between test suites
  });

  it('should create a playlist', async function () {
    const playlistName = `playlist-${randomString()}`;
    const { jar } = await util.promisify(api.loginAs)(DUMMY_USER);
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
          error ? reject(error) : resolve({ response, body }),
      ),
    );

    const { id, name } = JSON.parse(res.body);
    assert.equal(name, playlistName);
    assert.equal(id, 0);
  });
});
