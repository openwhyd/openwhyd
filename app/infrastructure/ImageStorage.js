//@ts-check

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * @typedef {import("../domain/spi/ImageRepository").ImageRepository} ImageRepository
 * @typedef {import('../domain/user/types').User} User
 * @typedef {import('../domain/user/types').Playlist} Playlist
 * @typedef {'uAvatarImg' | 'uCoverImg' | 'uPlaylistImg' | 'upload_data'} SupportedImageDirectories
 */

/** @type {SupportedImageDirectories[]} */
const ALL_TYPES = ['uAvatarImg', 'uCoverImg', 'uPlaylistImg', 'upload_data'];

/**
 * @param {SupportedImageDirectories} type
 * @param {User["id"]} userId
 * @param {Playlist["id"]} playlistId
 */
const getFilePath = (type, userId, playlistId) =>
  `./${type}/${userId}_${playlistId}`;

/**
 * @param {SupportedImageDirectories} type
 * @param {User["id"]} userId
 * @param {Playlist["id"]} playlistId
 */
const getFileUrl = (type, userId, playlistId) =>
  `/${type}/${userId}_${playlistId}`;

/** @implements {ImageRepository} */
class ImageStorage {
  constructor() {}

  async getImageUrlForPlaylist(userId, playlistId) {
    return getFileUrl('uPlaylistImg', userId, playlistId);
  }

  async deletePlaylistImage(userId, playlistId) {
    return fs.unlink(getFilePath('uPlaylistImg', userId, playlistId));
  }

  /** @param {SupportedImageDirectories} type */
  async deleteFiles(type) {
    const appDir = process.cwd();
    const dir = path.join(appDir, type);
    await Promise.all(
      (await fs.readdir(dir)).map((file) => {
        console.warn(`reset.controller deleting ${dir}/${file}`);
        return fs.rm(`${dir}/${file}`);
      }),
    );
  }

  async deleteAllFiles() {
    await Promise.all(ALL_TYPES.map((type) => this.deleteFiles(type)));
  }
}

module.exports = { ImageStorage };
