//@ts-check
/**
 * @typedef {import('../../../app/domain/spi/UserRepository').UserRepository} UserRepository
 * @typedef {import('../../../app/domain/spi/UserRepository').GetByUserId} GetByUserId
 * @typedef {import('../../../app/domain/spi/UserRepository').InsertPlaylist} InsertPlaylist
 * @typedef {import('../../../app/domain/spi/UserRepository').RemovePlaylist} RemovePlaylist
 * @typedef {import('../../../app/domain/user/types').User} UserType
 */

const User = require('../../../app/domain/user/User');

/**
 * @type {(users : User[]) => UserRepository}
 */
exports.inMemoryUserRepository = function (users) {
  const userRepository = new Map(
    deepCopyUsers(users).map((user) => [user.id, user]),
  );

  return {
    /**
     * @type {GetByUserId}
     */
    getByUserId: function (userId) {
      return Promise.resolve(deepCopyUser(userRepository.get(userId)));
    },
    /**
     * @type {InsertPlaylist}
     */
    insertPlaylist: async (userId, playlist) => {
      userRepository.get(userId).playlists.push(playlist);
    },
    /**
     * @type {RemovePlaylist}
     */
    removePlaylist: async (userId, playlistId) => {
      const user = userRepository.get(userId);
      user.playlists = user.playlists.filter((pl) => pl.id !== playlistId);
    },
  };
};

/**
 *
 * @param {UserType[]} users
 * @returns {UserType[]}
 */
function deepCopyUsers(users) {
  return users.map(deepCopyUser);
}

/**
 *
 * @param {UserType} user
 * @returns {UserType}
 */
function deepCopyUser(user) {
  return new User(
    user.id,
    user.name,
    user.playlists.map((playlist) => {
      return { id: playlist.id, name: playlist.name };
    }),
  );
}
