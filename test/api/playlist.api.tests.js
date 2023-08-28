const assert = require('assert');
const util = require('util');
const request = require('request');

const { cleanup, URL_PREFIX, DUMMY_USER } = require('../fixtures.js');
const api = require('../api-client.js');
const { START_WITH_ENV_FILE } = process.env;
const {
  startOpenwhydServer,
  dumpMongoCollection,
  insertTestData,
  ObjectId,
} = require('../approval-tests-helpers.js');
const randomString = () => Math.random().toString(36).substring(2, 9);

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

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
    // When a user creates a playlist
    const playlistName = `playlist-${randomString()}`;
    const res = await callPlaylistApi(jar, {
      action: 'create',
      name: playlistName,
    });

    // Then the playlist is persisted for that user
    const user = await dumpMongoCollection(MONGODB_URL, 'user').then((users) =>
      users.find((user) => user._id.toString() === DUMMY_USER.id),
    );
    assert.deepEqual(user.pl, [{ id: 0, name: playlistName }]);

    // And the API returns the playlist's id and name
    const { id, name } = JSON.parse(res.body);
    assert.equal(name, playlistName);
    assert.equal(id, 0);
  });

  describe('`rename` action', () => {
    it('should rename a playlist', async function () {
      // Given a user that has one playlist
      const userWithOnePlaylist = {
        ...DUMMY_USER,
        _id: ObjectId(DUMMY_USER.id),
        pl: [{ id: 0, name: 'old name' }],
      };
      await insertTestData(MONGODB_URL, { user: [userWithOnePlaylist] });

      // When the user renames their playlist
      const newName = 'new name';
      const res = await callPlaylistApi(jar, {
        action: 'rename',
        id: 0,
        name: newName,
      });

      // Then the playlist is persisted for that user
      const user = await dumpMongoCollection(MONGODB_URL, 'user').then(
        (users) =>
          users.find((user) => user._id.toString() === userWithOnePlaylist.id),
      );
      assert.deepEqual(user.pl, [{ id: 0, name: newName }]);

      // And the API returns the playlist's id and new name
      const { id, name } = JSON.parse(res.body);
      assert.equal(name, newName);
      assert.equal(id, 0);
    });

    it("should update the playlist's name in associated posts", async function () {
      // Given a user that has one playlist that contains one post
      const initialPlaylist = { id: 0, name: 'old name' };
      const userWithOnePlaylist = {
        ...DUMMY_USER,
        _id: ObjectId(DUMMY_USER.id),
        pl: [initialPlaylist],
      };
      const postInThatPlaylist = {
        pl: [initialPlaylist],
      };
      await insertTestData(MONGODB_URL, {
        user: [userWithOnePlaylist],
        post: [postInThatPlaylist],
      });

      // When the user renames their playlist
      const newName = 'new name';
      await callPlaylistApi(jar, {
        action: 'rename',
        id: 0,
        name: newName,
      });

      // Then the change is persisted in the playlist's posts too
      const [post] = await dumpMongoCollection(MONGODB_URL, 'post');
      assert.deepEqual(post.pl, [{ id: 0, name: newName }]);
    });
  });
});
