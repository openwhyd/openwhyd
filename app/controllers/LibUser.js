/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
const {
  fetchActivity,
  fetchActivityFeed,
  fetchPlaylists,
  countSubscribers,
  countSubscriptions,
  fetchIsSubscribed,
  fetchLikes,
  fetchNbTracks,
  fetchSubscriptions,
  populateFriendsData,
} = require('./LibUserData');

var feedTemplate = require('../templates/feed.js');
var templateLoader = require('../templates/templateLoader.js');
var profileTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userProfileV2.html'
);
var playlistTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userPlaylistV2.html'
);

var MAX_PLAYLISTS_SIDE = 4;
var MAX_FRIENDS = 6;
var MAX_SUBSCRIPTIONS = 50;

// PAGE RENDERING

function generateMixpanelCode(options) {
  return [
    '<script>',
    ' window.Whyd.tracking.log("Visit profile", "' + options.uid + '");',
    '</script>',
  ].join('\n');
}

function renderPlaylists(options, maxNb) {
  var playlists = options.user.pl || [];
  if (maxNb) {
    if (playlists.length > maxNb) playlists = playlists.slice(0, maxNb);
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
      playlists[i].img =
        '/img/playlist/' + options.user.id + '_' + playlists[i].id;
    }
  return playlists;
}

function renderFriends(friends) {
  for (let i in friends) {
    friends[i].url = '/u/' + friends[i].id;
    friends[i].img = '/img/u/' + friends[i].id;
  }
  return friends;
}

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

function prepareOtherPageRendering(options, callback) {
  options.bodyClass += ' userProfileV2';
  options.nbPlaylists = (options.user.pl || []).length;
  if (options.showPlaylists) {
    preparePlaylistsPageRendering(options, callback);
  } else if (options.showLikes) {
    prepareLikesPageRendering(options, callback);
  } else if (options.showActivity) {
    prepareActivityPageRendering(options, callback);
  } else if (options.showSubscribers) {
    prepareSubscribersPageRendering(options, callback);
  } else if (options.showSubscriptions) {
    prepareSubscriptionsPageRendering(options, callback);
  } else {
    prepareUserTracksPageRendering(options).then((tracks) =>
      callback(null, tracks)
    );
  }
}

var bareFormats = new Set(['json', 'links']);

async function prepareUserTracksPageRendering(options) {
  options.tabTitle = 'Tracks';

  options.bodyClass += ' userTracks';
  options.showTracks = true;
  options.pageTitle = options.user.name + "'s tracks";

  if (!options.after && !options.before) {
    await prepareActivitiesSidebar(options);
  }

  return new Promise((resolve) =>
    postModel.fetchByAuthors([options.uid], options.fetchParams, resolve)
  );
}

async function prepareActivitiesSidebar(options) {
  options.activity = await fetchActivity(options);
  // => populates options.activity
  var ownProfile = options.user.id == (options.loggedUser || {}).id;
  // render playlists
  if ((options.user.pl || []).length || ownProfile)
    options.playlists = {
      url: '/u/' + options.user.id + '/playlists',
      items: renderPlaylists(options, MAX_PLAYLISTS_SIDE),
    };
  // fetch and render friends
  var params = {
    sort: { _id: -1 },
    limit: MAX_FRIENDS,
    fields: { _id: 0, tId: 1 },
  };
  const subscriptions = await fetchSubscriptions(options, params, ownProfile);
  if (subscriptions) {
    options.friends = {
      url: '/u/' + options.user.id + '/subscriptions',
      items: renderFriends(subscriptions),
    };
  }
}

function prepareSubscriptionsPageRendering(options, callback) {
  options.tabTitle = 'Following';

  options.bodyClass += ' userSubscriptions';
  options.pageTitle = options.user.name + "'s following";
  const params = {
    sort: { _id: -1 },
    limit: MAX_SUBSCRIPTIONS + 1,
    fields: { _id: 0, tId: 1 },
    skip: Number(options.after || 0),
  };
  followModel.fetch({ uId: options.user.id }, params, function (subscr) {
    if (subscr.length > MAX_SUBSCRIPTIONS) {
      options.hasMore = {
        lastPid: params.skip + MAX_SUBSCRIPTIONS,
      };
      subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
    }
    for (let i in subscr) subscr[i] = { id: subscr[i].tId };
    populateFriendsData(subscr, options, function (subscr) {
      options.showSubscriptions = {
        items: renderFriends(subscr),
      };
      callback(null, []);
    });
  });
}

function prepareSubscribersPageRendering(options, callback) {
  options.tabTitle = 'Followers';

  options.bodyClass += ' userSubscribers';
  options.pageTitle = options.user.name + "'s followers";
  var params = {
    sort: { _id: -1 },
    limit: MAX_SUBSCRIPTIONS + 1,
    fields: { _id: 0, uId: 1 },
    skip: Number(options.after || 0),
  };
  followModel.fetch({ tId: options.user.id }, params, function (subscr) {
    if (subscr.length > MAX_SUBSCRIPTIONS) {
      options.hasMore = {
        lastPid: params.skip + MAX_SUBSCRIPTIONS,
      };
      subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
    }
    for (let i in subscr) subscr[i] = { id: subscr[i].uId };
    populateFriendsData(subscr, options, function (subscr) {
      options.showSubscribers = {
        items: renderFriends(subscr),
      };
      callback(null, []);
    });
  });
}

function prepareActivityPageRendering(options, callback) {
  options.tabTitle = 'Activity';
  options.bodyClass += ' userActivity';
  options.pageTitle = options.user.name + "'s recent activity";
  fetchActivityFeed(options, (err, activityFeed) => {
    options.showActivity = activityFeed.activity;
    options.hasMore = activityFeed.hasMore;
    callback(null, []);
  });
}

function prepareLikesPageRendering(options, callback) {
  options.tabTitle = 'Likes';
  options.bodyClass += ' userLikes';
  options.pageTitle = options.user.name + "'s liked tracks";
  postModel.fetchPosts(
    { lov: options.uid },
    /*params*/ null,
    { after: options.after },
    (tracks) => callback(null, tracks)
  );
}

function preparePlaylistsPageRendering(options, callback) {
  const playlists = options.user.pl;
  options.pageTitle = 'Playlists by ' + options.user.name;
  options.tabTitle = 'Playlists';
  options.bodyClass += ' userPlaylists';
  options.playlists = [...playlists].reverse(); // clone before reversing
  options.showPlaylists = { items: renderPlaylists(options) };
  callback(null, []);
}

function fetchAndRender(options) {
  return new Promise((resolve) => {
    options.bodyClass = '';
    preparePaginationParameters(options);

    // will pass a list of tracks to process() or an error message to callback()
    (options.playlistId
      ? preparePlaylistPageRendering
      : prepareOtherPageRendering)(options, (errorMsg, tracks) => {
      if (errorMsg) return resolve(errorMsg);
      if (bareFormats.has(options.format)) return resolve(tracks);
      renderHtml(options, tracks, resolve);
    });
  });
}

// MAIN FUNCTION

var LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

function renderHtml(options, tracks, callback) {
  if (!options.format && !options.embedW) {
    options.customFeedTemplate = options.playlistId
      ? playlistTemplateV2
      : profileTemplateV2;
  }
  feedTemplate.renderFeedAsync(tracks, options, callback);
}

function preparePaginationParameters(options) {
  options.fetchParams = {
    after: options.after,
    before: options.before,
    limit: options.limit,
  };
  if (options.embedW)
    options.fetchParams.limit = config.nbTracksPerPlaylistEmbed;
  else if (options.limit && typeof options.limit !== 'number') {
    if (typeof options.limit === 'string')
      options.fetchParams.limit = parseInt(options.limit);
    else if (typeof options.limit === 'object' && options.limit.push)
      options.fetchParams.limit = parseInt(options.limit.pop());
    // keep only the last value
    // see https://github.com/openwhyd/openwhyd/issues/89
  }
}

function renderUserLinks(lnk) {
  // clean social links
  for (let i in lnk) lnk[i] = ('' + lnk[i]).trim();

  // for each social link, detect username and rebuild URL
  for (let i in LNK_URL_PREFIX)
    if (lnk[i]) {
      var parts = lnk[i].split('?').shift().split('/');
      lnk[i] = ''; // by default, if no username was found
      var username = '';
      while (!(username = parts.pop()));
      lnk[i] = LNK_URL_PREFIX[i] + username; //parts[j];
    }

  // make sure URLs are valid
  for (let i in lnk)
    if (lnk[i]) {
      var lnkBody = '//' + lnk[i].split('//').pop();
      if (i == 'home') {
        var isHttps = lnk[i].match(/^https:\/\//);
        lnk[i] = (isHttps ? 'https' : 'http') + ':' + lnkBody;
      } else {
        lnk[i] = lnkBody;
      }
    } else delete lnk[i];

  if (lnk.home)
    lnk.home = {
      url: lnk.home,
      renderedUrl: lnk.home.split('//').pop().split('/').shift(),
    };
}

function renderResponse(lib, options, feed) {
  if (options.callback) {
    var safeCallback = options.callback.replace(/[^a-z0-9_]/gi, '');
    lib.renderOther(
      safeCallback + '(' + JSON.stringify(feed) + ')',
      'application/javascript'
    );
  } else if (options.format == 'links') {
    lib.renderOther(
      feed
        .map(function (p) {
          return config.translateEidToUrl((p || {}).eId);
        })
        .join('\n'),
      'text/text'
    );
  } else if (options.showPlaylists && options.format == 'json') {
    lib.renderJson(options.playlists);
  } else if (options.format == 'json') {
    lib.renderJson(feed);
  } else if (options.after || options.before) {
    lib.render({ html: feed });
  } else
    lib.renderPage(
      options.user,
      null /*sidebarHtml*/,
      generateMixpanelCode(options) + feed
    );
}

async function renderUserLibrary(lib, user) {
  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  const options = populateCommonTemplateParameters(lib, user);

  await populateSidebarAndAdditionalPageElements(options);
  const tracks = await fetchAndRender(options);
  renderResponse(lib, options, tracks); // reponds through lib.render*()
}

exports.render = renderUserLibrary;

async function populateSidebarAndAdditionalPageElements(options) {
  if (!options.after && !options.before) {
    options.user.pl = await fetchPlaylists(options);
    options.subscriptions = {
      nbSubscribers: await countSubscribers(options),
      nbSubscriptions: await countSubscriptions(options),
    };
    options.user.isSubscribed = await fetchIsSubscribed(options);
    options.user.nbLikes = await fetchLikes(options);
    const nbPosts = await fetchNbTracks(options);
    options.user.nbTracks =
      nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
  }
}

function populateCommonTemplateParameters(lib, user) {
  var options = lib.options;

  options.pageUrl = options.pageUrl.replace(
    '/' + user.handle,
    '/u/' + user._id
  );

  options.uid = '' + user._id;
  options.user = user;
  options.displayPlaylistName = !options.playlistId;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);
  return options;
}
