// @ts-check

const util = require('util');
const { PageGenerator } = require('./PageGenerator.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
const {
  fetchActivity,
  fetchActivityFeed,
  fetchSubscriptions,
  populateFriendsData,
} = require('./LibUserData');

var templateLoader = require('../templates/templateLoader.js');
var profileTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userProfileV2.html'
);

var MAX_PLAYLISTS_SIDE = 4;
var MAX_FRIENDS = 6;
var MAX_SUBSCRIPTIONS = 50;

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

class ProfilePageGenerator extends PageGenerator {
  constructor(user, options) {
    super(user, options);
  }

  async prepareTemplateData() {
    const options = this.options;
    options.bodyClass += ' userProfileV2';
    options.nbPlaylists = (options.user.pl || []).length;
    if (options.showPlaylists) {
      return util.promisify(preparePlaylistsPageRendering)(options);
    } else if (options.showLikes) {
      return util.promisify(prepareLikesPageRendering)(options);
    } else if (options.showActivity) {
      return util.promisify(prepareActivityPageRendering)(options);
    } else if (options.showSubscribers) {
      return util.promisify(prepareSubscribersPageRendering)(options);
    } else if (options.showSubscriptions) {
      return util.promisify(prepareSubscriptionsPageRendering)(options);
    } else {
      return prepareUserTracksPageRendering(options);
    }
  }

  getCustomFeedTemplate = () => profileTemplateV2;
}

exports.ProfilePageGenerator = ProfilePageGenerator;
