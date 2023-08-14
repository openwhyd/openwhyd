//@ts-check

const fs = require('node:fs/promises');

/** @typedef {import("../domain/spi/ImageRepository").ImageRepository} ImageRepository */

const getFilePath = (type, userId, playlistId) =>
  `./${type}/${userId}_${playlistId}`;

const getFileUrl = (type, userId, playlistId) =>
  `./${type}/${userId}_${playlistId}`;

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
