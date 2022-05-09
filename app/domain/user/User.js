//@ts-check
/**
 * @typedef {import('./types').Playlist} Playlist
 * @typedef {import('./types').User} User
 */
/**
 * @type {User}
 */
module.exports = class User {
  /**
   * @param {string} id
   * @param {Playlist[]} playlists
   */
  constructor(id, playlists) {
    this.id = id;
    this.playlists = playlists || [];
    void (/** @type {User} */ (this));
  }

  /**
   * @param {string} playlistName
   * @returns {Promise<[User,Playlist]>}
   */
  addNewPlaylist = (playlistName) => {
    const newPlaylist = {
      id: nextAvailablePlaylistId(this.playlists),
      name: playlistName,
    };
    return Promise.resolve([
      new User(this.id, [...this.playlists, newPlaylist]),
      newPlaylist,
    ]);
  };
};

/**
 * @param {Playlist[]} playlists
 * @returns {number}
 */
function nextAvailablePlaylistId(playlists) {
  return Math.max(...playlists.map(({ id }) => id), -1) + 1;
}
