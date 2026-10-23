const assert = require('assert');
const util = require('util');
const { fetchText } = require('../native-fetch');

const { DUMMY_USER } = require('../fixtures.js');
const api = require('../api-client.js');
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { ObjectId } = require('mongodb');

describe(`playlistOrder api`, function () {
  let jar;

  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  function callApi(method, path, form) {
    return fetchText(`${openwhyd.getURL()}${path}`, {
      method,
      jar,
      form,
    });
  }

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
    ({ jar } = await util.promisify(api.loginAs)(DUMMY_USER));
  });

  it('should list all posts when asking to change order of a playlist', async function () {
    // Given a user that has one playlist that contains two posts
    const playlist = { id: 0, name: 'my playlist' };
    const userWithOnePlaylist = {
      ...DUMMY_USER,
      _id: ObjectId(DUMMY_USER.id),
      pl: [playlist],
    };
    const posts = [
      {
        _id: new ObjectId(),
        uId: userWithOnePlaylist.id,
        pl: playlist,
        name: 'Song 1',
      },
      {
        _id: new ObjectId(),
        uId: userWithOnePlaylist.id,
        pl: playlist,
        name: 'Song 2',
      },
    ];
    await openwhyd.insertTestData({
      user: [userWithOnePlaylist],
      post: posts,
    });

    // When the user edits their playlist
    const res = await callApi(
      'GET',
      `/u/${userWithOnePlaylist._id}/playlist/${playlist.id}/edit`,
      {},
    );

    // Then both posts are displayed
    assert.match(res.body, /Song 1/);
    assert.match(res.body, /Song 2/);

    // Then the change is persisted in the playlist's posts too
    // const [post] = await openwhyd.dumpCollection('post');
    // assert.deepEqual(post.pl, { id: 0, name: 'coucou' });
  });

  it('should list more than 200 posts when asking to change order of a playlist', async function () {
    // Given a user that has one playlist that contains 250 posts
    const nbPosts = 250;
    const playlist = { id: 0, name: 'my playlist' };
    const user = {
      ...DUMMY_USER,
      _id: ObjectId(DUMMY_USER.id),
      pl: [playlist],
    };
    const posts = Array.from({ length: nbPosts }, (_, i) => ({
      _id: new ObjectId(),
      uId: user.id,
      pl: playlist,
      name: `Song number ${i}.`,
    }));
    await openwhyd.insertTestData({ user: [user], post: posts });

    // When the user edits their playlist
    const res = await callApi(
      'GET',
      `/u/${user._id}/playlist/${playlist.id}/edit`,
      {},
    );

    // Then all posts are displayed
    for (let i = 0; i < nbPosts; ++i)
      assert.ok(res.body.includes(`Song number ${i}.`), `missing post ${i}`);
  });
});
