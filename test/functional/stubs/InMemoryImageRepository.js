//@ts-check

/** @typedef {import("../../../app/domain/spi/ImageRepository").ImageRepository} ImageRepository */

/** @type {() => ImageRepository} */
exports.inMemoryImageRepository = function () {
  let playlistImage = 'https://someurl.com/image.png'; // default value, assuming that an image was uploaded for that playlist

  // the current implementation assumes that there is only one playlist managed per instance of this class.

  return {
    deletePlaylistImage: async (/*userId, playlistId*/) => {
      playlistImage = null;
    },

    getImageUrlForPlaylist: async (/*userId, playlistId*/) => playlistImage,
  };
};
