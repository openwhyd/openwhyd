//@ts-check

/** @typedef {import("../../../app/domain/spi/ImageRepository").ImageRepository} ImageRepository */

/** @type {() => ImageRepository} */
exports.inMemoryImageRepository = function () {
  let playlistImage = 'https://someurl.com/image.png'; // default value, assuming that an image was uploaded for that playlist

  return {
    getImageUrlForPlaylist: async (userId, playlistId) => playlistImage,
  };
};
