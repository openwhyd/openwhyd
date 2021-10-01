const { PageGenerator } = require('./PageGenerator.js');
var config = require('../models/config.js');
var postModel = require('../models/post.js');
var templateLoader = require('../templates/templateLoader.js');
var playlistTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userPlaylistV2.html'
);

function preparePlaylistPageRendering(options, callback) {
  // 1. populate page template parameters
  populatePlaylistPageTemplateParameters(options);

  // 2. fetch and render list of tracks
  if (!options.playlist) callback('meh... this playlist does not exist!');
  else {
    populateNextAndPrevPlaylistPageUrl(options);
    postModel.fetchPlaylistPosts(
      options.uid,
      options.playlistId,
      options.fetchParams,
      (tracks) => callback(null, tracks)
    );
  }
}

function populateNextAndPrevPlaylistPageUrl(options) {
  var prevId = null;
  for (let p = options.user.pl.length - 1; p > -1; --p) {
    var pl = options.user.pl[p];
    if (!pl) continue;
    if (pl.id == options.playlistId) {
      if (prevId !== null)
        options.prevPageInList = '/u/' + options.uid + '/playlist/' + prevId;
      for (--p; p > -1; --p) {
        if (options.user.pl[p]) {
          options.nextPageInList =
            '/u/' + options.uid + '/playlist/' + options.user.pl[p].id;
          break;
        }
      }
      break;
    }
    prevId = pl.id;
  }
}
function populatePlaylistPageTemplateParameters(options) {
  options.bodyClass += ' userPlaylistV2';
  options.user.pl = options.user.pl || [];
  for (let i in options.user.pl)
    if (options.user.pl[i] && options.user.pl[i].id == options.playlistId) {
      options.playlist = options.user.pl[i];
    }
  if (options.playlistId == 'create') {
    options.playlist = {
      id: 'create',
      name: 'Playlist #' + options.user.pl.length,
    };
    options.pageTitle = 'new playlist';
  } else {
    options.pageTitle =
      ((options.playlist || {}).name || 'a playlist') +
      ' by ' +
      options.user.name;
  }
  if (!options.format && !options.embedW && options.playlist) {
    options.pageImage =
      config.urlPrefix +
      '/img/playlist/' +
      options.user.id +
      '_' +
      options.playlistId;
  }
}

class PlaylistPageGenerator extends PageGenerator {
  constructor(options) {
    super(options);
  }
  prepareTemplateData = (callback) =>
    preparePlaylistPageRendering(this.options, callback);
  getCustomFeedTemplate = () => playlistTemplateV2;
}

exports.PlaylistPageGenerator = PlaylistPageGenerator;
