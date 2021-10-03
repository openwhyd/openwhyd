/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
var activityModel = require('../models/activity.js');
var activityController = require('../controllers/recentActivity.js');
var feedTemplate = require('../templates/feed.js');
const feedOptions = require('../templates/feedOptions.js');
var uiSnippets = require('../templates/uiSnippets.js');
const {
  playlistTemplateV2,
  fetchAndRenderPlaylist,
} = require('./LibUserPlaylist.js');
const { profileTemplateV2 } = require('./LibUserProfile.js');

var MAX_PLAYLISTS_SIDE = 4;
var MAX_FRIENDS = 6;
var MAX_HISTORY = 3;
var MAX_SUBSCRIPTIONS = 50;

// DATA FETCHING HELPERS

function fetchPlaylists(options, callback) {
  userModel.fetchPlaylists(options.user, {}, function (playlists) {
    options.user.pl = playlists;
    callback();
  });
}

function fetchLikes(options, callback) {
  postModel.countLovedPosts(options.user.id, function (count) {
    options.user.nbLikes = count;
    callback();
  });
}

function fetchStats(options, callback) {
  followModel.countSubscriptions(options.user.id, function (nbSubscriptions) {
    followModel.countSubscribers(options.user.id, function (nbSubscribers) {
      options.subscriptions = {
        nbSubscriptions: nbSubscriptions,
        nbSubscribers: nbSubscribers,
      };
      followModel.get(
        { uId: options.loggedUser.id, tId: options.user.id },
        function (err, res) {
          options.user.isSubscribed = !!res;
          callback();
        }
      );
    });
  });
}

function fetchNbTracks(options, callback) {
  postModel.countUserPosts(options.user.id, function (nbPosts) {
    options.user.nbTracks =
      nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
    callback();
  });
}

// used to render the sidebar
function fetchActivity(options, cb) {
  activityModel.fetchHistoryFromUidList(
    [options.user.id],
    { limit: MAX_HISTORY },
    function (activities) {
      if (activities.length < MAX_HISTORY)
        activities.push({
          _id: mongodb.ObjectId(options.user.id),
          other: { text: 'joined whyd' },
        });
      var postsToPopulate = [];
      for (let i in activities)
        if (activities[i]) {
          activities[i].ago = uiSnippets.renderTimestamp(
            new Date() - activities[i]._id.getTimestamp()
          );
          if (activities[i].like)
            postsToPopulate.push(mongodb.ObjectId('' + activities[i].like.pId));
        }

      postModel.fetchPosts(
        { _id: { $in: postsToPopulate } },
        /*params*/ null,
        /*options*/ null,
        function (posts) {
          var postSet = {};
          options.activity = [];
          for (let i in posts) postSet['' + posts[i]._id] = posts[i];
          for (let i in activities) {
            if ((activities[i] || {}).like) {
              if (postSet['' + activities[i].like.pId])
                activities[i].like.post = postSet['' + activities[i].like.pId];
              else continue; // do not keep null posts
            }
            options.activity.push(activities[i]);
          }
          cb();
        }
      );
    }
  );
}

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

function populateUsers(subscr, options, cb) {
  followModel.fetchSubscriptionArray(
    options.loggedUser.id,
    function (mySubscr) {
      var subscrSet = snip.arrayToSet(mySubscr);
      for (let i in subscr)
        if (subscrSet[subscr[i].id]) subscr[i].subscribed = true;
      userModel.fetchUserBios(subscr, function () {
        cb(renderFriends(subscr));
      });
    }
  );
}

function fetchAndRenderProfile(options, callback, process) {
  // TODO: remove process => use callback only
  options.bodyClass += ' userProfileV2';
  options.nbPlaylists = (options.user.pl || []).length;
  if (options.showPlaylists) {
    const playlists = options.user.pl;
    options.pageTitle = 'Playlists by ' + options.user.name;
    options.tabTitle = 'Playlists';
    options.bodyClass += ' userPlaylists';
    options.playlists = [...playlists].reverse(); // clone before reversing
    options.showPlaylists = { items: renderPlaylists(options) };
    process([]); // no posts // TODO: is this call necessary ?
  } else if (options.showLikes) {
    options.tabTitle = 'Likes';
    options.bodyClass += ' userLikes';
    options.pageTitle = options.user.name + "'s liked tracks";
    postModel.fetchPosts(
      { lov: options.uid },
      /*params*/ null,
      { after: options.after },
      process
    );
  } else if (options.showActivity) {
    options.tabTitle = 'Activity';
    options.bodyClass += ' userActivity';
    options.pageTitle = options.user.name + "'s recent activity";
    followModel.fetchUserSubscriptions(
      options.loggedUser.id,
      function (mySubscr) {
        var mySubscrUidList = snip.objArrayToValueArray(
          mySubscr.subscriptions,
          'id'
        );
        activityController.generateActivityFeed(
          [options.user.id],
          mySubscrUidList,
          options,
          function (result) {
            for (let i in result.recentActivity.items)
              if (result.recentActivity.items[i].subscriptions) {
                result.recentActivity.items[i].subscribedUsers =
                  result.recentActivity.items[i].subscriptions;
                delete result.recentActivity.items[i].subscriptions;
              }
            options.showActivity = result.recentActivity;
            if (result.hasMore) {
              const lastPid = result.hasMore.last_id;
              feedOptions.populateNextPageUrl(options, lastPid);
            } else {
              var creation = mongodb.ObjectId(options.user.id);
              options.showActivity.items.push({
                _id: creation,
                other: { text: 'joined whyd' },
              });
            }
            for (let i in options.showActivity.items)
              options.showActivity.items[i].ago = uiSnippets.renderTimestamp(
                new Date() - options.showActivity.items[i]._id.getTimestamp()
              );
            process([]);
          }
        );
      }
    );
  } else if (options.showSubscribers) {
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
        feedOptions.populateNextPageUrl(
          options,
          params.skip + MAX_SUBSCRIPTIONS
        );
        subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
      }
      for (let i in subscr) subscr[i] = { id: subscr[i].uId };
      populateUsers(subscr, options, function (subscr) {
        options.showSubscribers = {
          items: subscr,
        };
        process([]);
      });
    });
  } else if (options.showSubscriptions) {
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
        feedOptions.populateNextPageUrl(
          options,
          params.skip + MAX_SUBSCRIPTIONS
        );
        subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
      }
      for (let i in subscr) subscr[i] = { id: subscr[i].tId };
      populateUsers(subscr, options, function (subscr) {
        options.showSubscriptions = {
          items: subscr,
        };
        process([]);
      });
    });
  } else {
    options.tabTitle = 'Tracks';

    options.bodyClass += ' userTracks';
    options.showTracks = true;
    options.pageTitle = options.user.name + "'s tracks";
    const proceed = () =>
      postModel.fetchByAuthors([options.uid], options.fetchParams, process);

    if (!feedOptions.mustRenderWholeProfilePage(options))
      // no page rendering required
      proceed();
    else {
      // SIDEBAR
      fetchActivity(options, function () {
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
        followModel.fetch({ uId: options.user.id }, params, function (subscr) {
          if (subscr.length || ownProfile) {
            for (let i in subscr) subscr[i] = { id: subscr[i].tId };
            userModel.fetchUserBios(subscr, function () {
              options.friends = {
                url: '/u/' + options.user.id + '/subscriptions',
                items: renderFriends(subscr),
              };
              proceed();
            });
          } else proceed();
        });
      });
    }
  }
}

var bareFormats = new Set(['json', 'links']);

function fetchAndRender(options, callback) {
  options.bodyClass = '';

  var process = bareFormats.has(options.format)
    ? callback
    : function (posts) {
        if (!options.format && !options.embedW) {
          if (options.playlistId)
            options.pageImage =
              config.urlPrefix +
              '/img/playlist/' +
              options.user.id +
              '_' +
              options.playlistId;
          options.customFeedTemplate = options.playlistId
            ? playlistTemplateV2
            : profileTemplateV2;
        }
        feedTemplate.renderFeedAsync(posts, options, callback);
      };

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

  (options.playlistId ? fetchAndRenderPlaylist : fetchAndRenderProfile)(
    options,
    callback,
    process
  );
}

// MAIN FUNCTION

var LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

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
      lnk[i] = LNK_URL_PREFIX[i] + username;
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

function renderUserLibrary(lib, user) {
  var options = lib.options;

  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  options.pageUrl = options.pageUrl.replace(
    '/' + user.handle,
    '/u/' + user._id
  );

  options.uid = '' + user._id;
  options.user = user;
  options.displayPlaylistName = !options.playlistId;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);

  function renderResponse(feed) {
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
    } else if (!feedOptions.mustRenderWholeProfilePage(options)) {
      lib.render({ html: feed });
    } else
      lib.renderPage(
        user,
        null /*sidebarHtml*/,
        generateMixpanelCode(options) + feed
      );
  }

  // add final rendering functions at queue of the call chain
  var fcts = [fetchAndRender, renderResponse];

  // prepend required fetching operations in head of the call chain
  if (feedOptions.mustRenderWholeProfilePage(options))
    // main tab: tracks (full layout to render, with sidebar)
    fcts = [fetchPlaylists, fetchStats, fetchLikes, fetchNbTracks].concat(fcts);

  // run the call chain
  (function next(res) {
    var fct = fcts.shift();
    fct(res || options, function (res) {
      next(res || options);
    });
  })();
}

exports.render = renderUserLibrary;
