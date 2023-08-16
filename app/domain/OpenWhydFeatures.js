//@ts-check

/**
 * @typedef {import('../../app/domain/user/types').User} User
 * @typedef {import('../../app/domain/user/types').Playlist} Playlist
 * @typedef {import('../../app/domain/spi/UserRepository').UserRepository} UserRepository
 * @typedef {import('../../app/domain/spi/ImageRepository').ImageRepository} ImageRepository
 * @typedef {import('./api/Features').Features} Features
 * @typedef {(userId: User["id"], playlistId: Playlist["id"]) => Promise<void>} ReleasePlaylistPosts
 */

/**
 * @param {object} adapters
 * @param {UserRepository} adapters.userRepository
 * @param {ImageRepository} adapters.imageRepository
 * @param {ReleasePlaylistPosts} adapters.releasePlaylistPosts
 * @returns {Features}
 */
exports.makeFeatures = function ({
  userRepository,
  imageRepository,
  releasePlaylistPosts,
}) {
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
      await Promise.all([
        userRepository.removePlaylist(userId, playlistId), // removes from mongodb + search index
        imageRepository.deletePlaylistImage(userId, playlistId),
        releasePlaylistPosts(userId, playlistId), // --> postModel.unsetPlaylist()
      ]);
    },
  };
};
