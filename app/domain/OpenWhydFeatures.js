//@ts-check

/**
 * @typedef {import('../../app/domain/user/types').User} User
 * @typedef {import('../../app/domain/user/types').Playlist} Playlist
 * @typedef {import('../../app/domain/spi/UserRepository').UserRepository} UserRepository
 * @typedef {import('./api/Features').Features} Features
 */

/**
 * @param {UserRepository} userRepository
 * @returns {Features}
 */
exports.makeFeatures = function (userRepository) {
  /**
   * @type {([User, Playlist]) => Promise<Playlist>}
   */
  const insertPlaylist = ([user, playlist]) =>
    userRepository
      .insertPlaylist(user.id, playlist)
      .then(() => Promise.resolve(playlist));

  /**
   * @param {string} playlistName
   * @returns {(user: User) =>  Promise<[User, Playlist]>}
   */
  function addNewPlayListToUser(playlistName) {
    return (user) => user.addNewPlaylist(playlistName);
  }

  return {
    createPlaylist: (userId, playlistName) =>
      Promise.resolve(
        userRepository
          .getByUserId(userId)
          .then(addNewPlayListToUser(playlistName))
          .then(insertPlaylist),
      ),
  };
};
