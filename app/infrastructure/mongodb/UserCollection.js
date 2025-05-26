//@ts-check

/**
 * @typedef {import('../../../app/domain/spi/UserRepository').UserRepository} UserRepository
 * @typedef {import('./types').UserDocument} UserDocument
 * @typedef {import('../../../app/domain/user/types').User} UserType
 * @typedef {import('../../../app/domain/user/types').Playlist} Playlist
 */

const User = require('../../domain/user/User');
const mongodb = require('../../models/mongodb');
// const searchModel = require('../../models/search');

/**
 * MongoDB implementation of the UserRepository interface.
 * Persists User instances in the "user" collection.
 * Tests: test/integration/user.repository.tests.js
 * @type {UserRepository}
 */
exports.userCollection = {
  getByUserId: (userId) =>
    mongodb.collections['user']
      .findOne({ _id: mongodb.ObjectId(userId) })
      .then(checkUserIsValid)
      .then(mapToDomainUser),
  insertPlaylist: async (userId, playlist) => {
    await mongodb.collections['user'].updateOne(
      { _id: mongodb.ObjectId(userId) },
      { $push: { pl: playlist } },
    );
  },
  removePlaylist: async (userId, playlistId) => {
    await mongodb.collections['user'].updateOne(
      { _id: mongodb.ObjectId(userId) },
      { $pull: { pl: { id: { $in: [playlistId, '' + playlistId] } } } },
    );
    // searchModel.deletePlaylist(userId, playlistId); // TODO: implement this with Algolia search provider
  },
};

/**
 *
 * @param {UserDocument} userDocument
 * @returns {UserDocument}
 */
function checkUserIsValid(userDocument) {
  if (userDocument == null) {
    throw Error('User is unknown');
  }
  return userDocument;
}

/**
 *
 * @param {UserDocument} userDocument
 * @returns {UserType}
 */
function mapToDomainUser(userDocument) {
  userDocument.pl = userDocument.pl || [];

  const playlists = userDocument.pl.map(({ id, name }) => ({
    id: typeof id === 'number' ? id : parseInt(id),
    name,
  }));
  return new User(userDocument._id.toString(), userDocument.name, playlists);
}
