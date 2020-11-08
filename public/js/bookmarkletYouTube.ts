const openwhydYouTubeExtractor = {
  getEid: function (url) {
    // code imported from playem-all
    if (
      /(youtube\.com\/(v\/|embed\/|(?:.*)?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(
        url
      ) ||
      /^\/yt\/([a-zA-Z0-9_-]+)/.test(url) ||
      /youtube\.com\/attribution_link\?.*v%3D([^ %]+)/.test(url) ||
      /youtube.googleapis.com\/v\/([a-zA-Z0-9_-]+)/.test(url)
    )
      return RegExp.lastParen;
  },
  fetchMetadata: function (url, callback) {
    const id = this.getEid(url);
    callback({
      id: id,
      eId: '/yt/' + id,
      img: 'https://i.ytimg.com/vi/' + id + '/default.jpg',
      url: 'https://www.youtube.com/watch?v=' + id,
      playerLabel: 'Youtube',
    });
  },
};

if (typeof exports !== 'undefined') {
  exports.openwhydYouTubeExtractor = openwhydYouTubeExtractor;
}
