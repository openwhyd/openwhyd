const assert = require('assert');
const {
  mongodb,
  initMongoDb,
  cleanup,
  readMongoDocuments,
  insertUser,
} = require('./mongo.integration.base.tests');
const {
  userCollection: userRepository,
} = require('../../../app/infrastructure/mongodb/UserCollection');
const COMPLETE_USER_JSON = __dirname + '/fixtures/complete.users.json.js';

describe('Mongo user repository should', function () {
  before(initMongoDb);
  beforeEach(cleanup);

  it('throw exception when user is unknown', async () => {
    try {
      await userRepository.getByUserId('unknownUserId');
    } catch (err) {
      assert.deepEqual(err, Error('User is unknown'));
    }
  });

  it('find user by id', async () => {
    const user = await readMongoDocuments(COMPLETE_USER_JSON);
    const userId = await insertUser(user);

    const result = await userRepository.getByUserId(userId);

    const { id, playlists } = result;
    assert.equal(id, userId.toString());
    assert.deepEqual(
      playlists,
      user[0].pl.map((pl) => ({ id: Number(pl.id), name: pl.name }))
    );
  });

  it('insert playlist to user', async () => {
    const user = await readMongoDocuments(COMPLETE_USER_JSON);
    const userId = await insertUser(user);

    const playlistId = '65';
    const newPlaylist = {
      id: playlistId,
      name: '🌍 Tour du monde',
      url: '/u/4d94501d1f78ac091dbc9b4d/playlist/65',
      nbTracks: 4,
    };
    await userRepository.insertPlaylist(userId, newPlaylist);

    const userDocument = await mongodb.collections['user'].findOne({
      _id: mongodb.ObjectId(userId),
    });
    assert.deepEqual(
      [newPlaylist],
      userDocument.pl.filter((pl) => pl.id == playlistId)
    );
  });
});
