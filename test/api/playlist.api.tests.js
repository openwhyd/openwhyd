const assert = require('assert');
const util = require('util');
const request = require('request');

const { DUMMY_USER, URL_PREFIX } = require('../fixtures.js');
const api = require('../api-client.js');
const { START_WITH_ENV_FILE } = process.env;
const {
  OpenwhydTestEnv,
  ObjectId,
  connectToMongoDB,
} = require('../approval-tests-helpers.js');
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

  describe('`rename` action', () => {
    it('should rename a playlist', async function () {
      // Given a user that has one playlist
      const userWithOnePlaylist = {
        ...DUMMY_USER,
        pwd: DUMMY_USER.md5, // to allow login
        _id: ObjectId(DUMMY_USER.id),
        pl: [{ id: 0, name: 'old name' }],
      };
      await openwhyd.insertTestData({ user: [userWithOnePlaylist] });

      // When the user renames their playlist
      const newName = 'new name';
      const { jar } = await util.promisify(api.loginAs)(userWithOnePlaylist);
      const res = await new Promise((resolve, reject) =>
        request.post(
          {
            jar,
            form: {
              action: 'rename',
              id: 0,
              name: newName,
            },
            url: `${URL_PREFIX}/api/playlist`,
          },
          (error, response, body) =>
            error ? reject(error) : resolve({ response, body }),
        ),
      );

      // Then the playlist is persisted for that user
      const user = await openwhyd
        .dumpCollection('user')
        .then((users) =>
          users.find((user) => user._id.toString() === userWithOnePlaylist.id),
        );
      assert.deepEqual(user.pl, [{ id: 0, name: newName }]);

      // And the API returns the playlist's id and new name
      const { id, name } = JSON.parse(res.body);
      assert.equal(name, newName);
      assert.equal(id, 0);
    });
  });
});
