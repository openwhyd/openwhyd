//@ts-check

/**
 * @typedef {import('./types').Playlist} Playlist
 * @typedef {import('./types').User} UserInterface
 */

/**
 * User entity.
 * @type {UserInterface}
 */
module.exports = class User {
  /**
   * @param {string} id
   * @param {string} name
   * @param {Playlist[]} playlists
   */
  constructor(id, name, playlists) {
    this.id = id;
    this.name = name;
    this.playlists = playlists || [];
  }

  /**
   * @param {string} playlistName
   * @returns {Promise<[User,Playlist]>}
   */
  addNewPlaylist = async (playlistName) => {
    const newPlaylist = {
      id: nextAvailablePlaylistId(this.playlists),
      name: playlistName,
    };
    return Promise.resolve([
      new User(this.id, this.name, [...this.playlists, newPlaylist]),
      newPlaylist,
    ]);
  };

  /** @type {UserInterface["deletePlaylist"]} */
  deletePlaylist = async (playlistId) => {
    const playlist = this.playlists.find((pl) => pl.id === playlistId);
    const otherPlaylists = this.playlists.filter((pl) => pl.id !== playlistId);
    if (!playlist) throw new Error('playlist not found');
    return Promise.resolve(new User(this.id, this.name, otherPlaylists));
  };
};

/**
 * @param {Playlist[]} playlists
 * @returns {number}
 */
function nextAvailablePlaylistId(playlists) {
  return Math.max(...playlists.map(({ id }) => id), -1) + 1;
}
