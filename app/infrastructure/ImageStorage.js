//@ts-check

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * @typedef {import("../domain/spi/ImageRepository").ImageRepository} ImageRepository
 * @typedef {import('../domain/user/types').User} User
 * @typedef {import('../domain/user/types').Playlist} Playlist
 * @typedef {'uAvatarImg' | 'uCoverImg' | 'uPlaylistImg' | 'upload_data'} ImageDirectory
 */

const PLAYLIST_DIR = 'uPlaylistImg';

/** @type {ImageDirectory[]} */
const DIRECTORIES = ['uAvatarImg', 'uCoverImg', PLAYLIST_DIR, 'upload_data'];

/**
 * @param {User["id"]} userId
 * @param {Playlist["id"]} playlistId
 */
const getPlaylistFilePath = (userId, playlistId) =>
  `./${PLAYLIST_DIR}/${userId}_${playlistId}`;

/**
 * @param {User["id"]} userId
 * @param {Playlist["id"]} playlistId
 */
const getPlaylistFileUrl = (userId, playlistId) =>
  `/${PLAYLIST_DIR}/${userId}_${playlistId}`;

/** @implements {ImageRepository} */
class ImageStorage {
  constructor() {}

  /** @type {ImageRepository['getImageUrlForPlaylist']} */
  async getImageUrlForPlaylist(userId, playlistId) {
    return getPlaylistFileUrl(userId, playlistId);
  }

  /** @type {ImageRepository['deletePlaylistImage']} */
  async deletePlaylistImage(userId, playlistId) {
    return fs.unlink(getPlaylistFilePath(userId, playlistId));
  }

  /** @param {ImageDirectory} directory */
  async deleteFiles(directory) {
    const appDir = process.cwd();
    const dir = path.join(appDir, directory);
    await Promise.all(
      (await fs.readdir(dir)).map((file) => {
        return fs.rm(`${dir}/${file}`);
      }),
    );
  }

  /** FOR AUTOMATED TESTS ONLY */
  async deleteAllFiles() {
    await Promise.all(
      DIRECTORIES.map((directory) => this.deleteFiles(directory)),
    );
  }
}

module.exports = { ImageStorage };
