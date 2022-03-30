var postModel = require('../models/post.js');

exports.fetchAndRender = function (options, callback, process) {
  // TODO: remove process => use callback only
  options.bodyClass += ' userPlaylistV2';
  options.user.pl = options.user.pl || [];
  for (let i in options.user.pl)
    if (options.user.pl[i] && options.user.pl[i].id == options.playlistId) {
      options.playlist = options.user.pl[i];
      break;
    }
  if (options.playlistId == 'create') {
    options.playlist = {
      id: 'create',
      name:
        /*(options.reqParams || {}).name ||*/ 'Playlist #' +
        options.user.pl.length,
    };
    options.pageTitle = 'new playlist';
  } else {
    options.pageTitle =
      ((options.playlist || {}).name || 'a playlist') +
      ' by ' +
      options.user.name;
  }
  if (!options.playlist) callback('meh... this playlist does not exist!');
  else {
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

    postModel.fetchPlaylistPosts(
      options.uid,
      options.playlistId,
      options.fetchParams,
      process
    );
  }
};
