var postModel = require('../models/post.js');
var feedTemplate = require('../templates/feed.js');

var templateLoader = require('../templates/templateLoader.js');
var profileTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userProfileV2.html'
);

//var NEW_PROFILE = true;
var MAX_PLAYLISTS_SIDE = 4;

function renderPlaylists(options, maxNb) {
  var playlists = options.user.pl || [];
  if (maxNb) {
    if (playlists.length > maxNb) playlists = playlists.slice(0, maxNb);
    //playlists.length-maxNb, playlists.length);
    else if (playlists.length < maxNb) {
      if (options.loggedUser && options.user.id == options.loggedUser.id)
        playlists.push({
          url: 'javascript:dlgCreatePlaylist();',
          class: 'btnNewPlaylist',
          img: '#',
          name: 'Create a playlist',
        });
    }
  }
  for (let i in playlists)
    if (playlists[i].id !== undefined) {
      //playlists[i].url = "/u/" + options.user.id + "/playlist/" + playlists[i].id;
      playlists[i].img =
        '/img/playlist/' + options.user.id + '_' + playlists[i].id;
    }
  //console.log("renderplaylists => ", playlists)
  return playlists;
}

exports.fetchAndRender = function (options, callback) {
  options.bodyClass += ' userProfileV2';
  options.nbPlaylists = (options.user.pl || []).length;
  if (options.showPlaylists) {
    const playlists = options.user.pl;
    //userModel.fetchPlaylists(options.user, {}, function(playlists) { // includes number of tracks per pl
    options.pageTitle = 'Playlists by ' + options.user.name;
    options.tabTitle = 'Playlists';
    options.bodyClass += ' userPlaylists';
    options.playlists = [...playlists].reverse(); // clone before reversing
    options.showPlaylists = { items: renderPlaylists(options) };
    callback(null, []); // no posts // TODO: is this call necessary ?
    //});
  } else if (options.showLikes) {
    options.tabTitle = 'Likes';
    options.bodyClass += ' userLikes';
    options.pageTitle = options.user.name + "'s liked tracks";
    postModel.fetchPosts(
      { lov: options.uid },
      /*params*/ null,
      { after: options.after },
      (posts) => callback(null, posts)
    );
  } else {
    options.tabTitle = 'Tracks';

    options.bodyClass += ' userTracks';
    options.showTracks = true;
    options.pageTitle = options.user.name + "'s tracks";
    const proceed = () =>
      postModel.fetchByAuthors([options.uid], options.fetchParams, (posts) =>
        callback(null, posts)
      );

    if (!feedTemplate.shouldRenderWholeProfilePage(options))
      // no page rendering required
      proceed();
    else {
      // SIDEBAR
      var ownProfile = options.user.id == (options.loggedUser || {}).id;
      // render playlists
      if ((options.user.pl || []).length || ownProfile)
        options.playlists = {
          url: '/u/' + options.user.id + '/playlists',
          items: renderPlaylists(options, MAX_PLAYLISTS_SIDE),
        };
      proceed();
    }
  }
};

exports.prepareTemplate = function (options) {
  options.customFeedTemplate = profileTemplateV2;
};
