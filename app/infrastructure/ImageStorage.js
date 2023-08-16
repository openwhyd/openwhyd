//@ts-check

const fs = require('node:fs/promises');

/**
 * @typedef {import("../domain/spi/ImageRepository").ImageRepository} ImageRepository
 * @typedef {import('../domain/user/types').User} User
 * @typedef {import('../domain/user/types').Playlist} Playlist
 * @typedef {"uPlaylistImg"} SupportedImageDirectories // to be completed
 */

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
}

module.exports = { ImageStorage };
