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
   * @param {[user: User, playlist: Playlist]} params
   * @returns {Promise<Playlist>}
   */
  const insertPlaylist = ([user, playlist]) =>
    userRepository
      .insertPlaylist(user.id, playlist)
      .then(() => Promise.resolve(playlist));

  return {
    createPlaylist: (userId, playlistName) =>
      Promise.resolve(
        userRepository
          .getByUserId(userId)
          .then((user) => user.addNewPlaylist(playlistName))
          .then(insertPlaylist),
      ),
    deletePlaylist: async (userId, playlistId) => {
      const user = await userRepository.getByUserId(userId);
      await user.deletePlaylist(playlistId); // validates the operation, by checking that this playlist does exist => may throw "playlist not found"
      await userRepository.removePlaylist(user.id, playlistId);
      // TODO: also delete the associated image, if any
    },
  };
};
