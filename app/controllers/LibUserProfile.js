const snip = require('../snip.js');
const mongodb = require('../models/mongodb.js');
const userModel = require('../models/user.js');
const followModel = require('../models/follow.js');
const postModel = require('../models/post.js');
const activityModel = require('../models/activity.js');
const activityController = require('../controllers/recentActivity.js');
const feedTemplate = require('../templates/feed.js');
const postsTemplate = require('../templates/posts.js');
const uiSnippets = require('../templates/uiSnippets.js');

const templateLoader = require('../templates/templateLoader.js');
const profileTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userProfileV2.html',
);

//var NEW_PROFILE = true;
const MAX_PLAYLISTS_SIDE = 4;
const MAX_FRIENDS = 6;
const MAX_HISTORY = 3;
const MAX_SUBSCRIPTIONS = 50;

/** Fetches the user's own activity history, to be displayed in their profile's sidebar. */
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
      const postsToPopulate = [];
      for (const i in activities)
        if (activities[i]) {
          activities[i].ago = uiSnippets.renderTimestamp(
            new Date() - activities[i]._id.getTimestamp(),
          );
          if (activities[i].like)
            postsToPopulate.push(mongodb.ObjectId('' + activities[i].like.pId));
        }

      postModel.fetchPosts(
        { _id: { $in: postsToPopulate } },
        /*params*/ null,
        /*options*/ null,
        function (posts) {
          const postSet = {};
          options.activity = [];
          for (const i in posts) postSet['' + posts[i]._id] = posts[i];
          for (const i in activities) {
            if ((activities[i] || {}).like) {
              if (postSet['' + activities[i].like.pId])
                activities[i].like.post = postSet['' + activities[i].like.pId];
              else continue; // do not keep null posts
            }
            options.activity.push(activities[i]);
          }
          cb();
        },
      );
    },
  );
}

function renderPlaylists(options, maxNb) {
  let playlists = options.user.pl || [];
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
  for (const i in playlists)
    if (playlists[i].id !== undefined) {
      //playlists[i].url = "/u/" + options.user.id + "/playlist/" + playlists[i].id;
      playlists[i].img =
        '/img/playlist/' + options.user.id + '_' + playlists[i].id;
    }
  //console.log("renderplaylists => ", playlists)
  return playlists;
}

function renderFriends(friends) {
  for (const i in friends) {
    friends[i].url = '/u/' + friends[i].id;
    friends[i].img = '/img/u/' + friends[i].id;
  }
  return friends;
}

function populateUsers(subscr, options, cb) {
  followModel.fetchSubscriptionArray(
    options.loggedUser.id,
    function (mySubscr) {
      const subscrSet = snip.arrayToSet(mySubscr);
      for (const i in subscr)
        if (subscrSet[subscr[i].id]) subscr[i].subscribed = true;
      userModel.fetchUserBios(subscr, function () {
        cb(renderFriends(subscr));
      });
    },
  );
}

/** @param {FetchAndRenderOptions} options */
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
      (posts) => callback(null, posts),
    );
  } else if (options.showActivity) {
    options.tabTitle = 'Activity';
    options.bodyClass += ' userActivity';
    options.pageTitle = options.user.name + "'s recent activity";
    followModel.fetchUserSubscriptions(
      options.loggedUser.id,
      function (mySubscr) {
        //console.log("mySubscr.subscriptions", mySubscr.subscriptions);
        const mySubscrUidList = snip.objArrayToValueArray(
          mySubscr.subscriptions,
          'id',
        );

        if (mySubscrUidList.length > 5000) {
          console.trace(
            `potential expensive activity query, for user ${options.user.id}, uidList length: ${mySubscrUidList.length}`,
          );
          console.time(`fetchAndRender_${options.user.id}`);
        }

        activityController.generateActivityFeed(
          [options.user.id],
          mySubscrUidList,
          options,
          function (result) {
            if (mySubscrUidList.length > 5000) {
              console.timeEnd(`fetchAndRender_${options.user.id}`);
            }

            for (const i in result.recentActivity.items)
              if (result.recentActivity.items[i].subscriptions) {
                result.recentActivity.items[i].subscribedUsers =
                  result.recentActivity.items[i].subscriptions;
                delete result.recentActivity.items[i].subscriptions;
              }
            //console.log("ACTIVITY result", result.recentActivity);
            options.showActivity = result.recentActivity;
            if (result.hasMore) {
              const lastPid = result.hasMore.last_id;
              postsTemplate.populateNextPageUrl(options, lastPid);
            } else {
              const creation = mongodb.ObjectId(options.user.id);
              options.showActivity.items.push({
                _id: creation,
                other: { text: 'joined whyd' },
                //						ago: uiSnippets.renderTimestamp(new Date() - creation.getTimestamp())
              });
            }
            for (const i in options.showActivity.items)
              options.showActivity.items[i].ago = uiSnippets.renderTimestamp(
                new Date() - options.showActivity.items[i]._id.getTimestamp(),
              );
            callback(null, []);
          },
        );
      },
    );
  } else if (options.showSubscribers) {
    options.tabTitle = 'Followers';

    options.bodyClass += ' userSubscribers';
    options.pageTitle = options.user.name + "'s followers";
    const sanitized = snip.sanitizePaginationParams(
      { skip: options.after, limit: MAX_SUBSCRIPTIONS + 1 },
      MAX_SUBSCRIPTIONS + 1,
    );
    const params = {
      sort: { _id: -1 },
      limit: sanitized.limit,
      fields: { _id: 0, uId: 1 },
      skip: sanitized.skip,
    };
    followModel.fetch({ tId: options.user.id }, params, function (subscr) {
      if (subscr.length > MAX_SUBSCRIPTIONS) {
        const lastPid = params.skip + MAX_SUBSCRIPTIONS;
        postsTemplate.populateNextPageUrl(options, lastPid);
        subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
      }
      for (const i in subscr) subscr[i] = { id: subscr[i].uId };
      populateUsers(subscr, options, function (subscr) {
        options.showSubscribers = {
          items: subscr,
        };
        callback(null, []);
      });
    });
  } else if (options.showSubscriptions) {
    options.tabTitle = 'Following';

    options.bodyClass += ' userSubscriptions';
    options.pageTitle = options.user.name + "'s following";
    const sanitized = snip.sanitizePaginationParams(
      { skip: options.after, limit: MAX_SUBSCRIPTIONS + 1 },
      MAX_SUBSCRIPTIONS + 1,
    );
    const params = {
      sort: { _id: -1 },
      limit: sanitized.limit,
      fields: { _id: 0, tId: 1 },
      skip: sanitized.skip,
    };
    followModel.fetch({ uId: options.user.id }, params, function (subscr) {
      if (subscr.length > MAX_SUBSCRIPTIONS) {
        const lastPid = params.skip + MAX_SUBSCRIPTIONS;
        postsTemplate.populateNextPageUrl(options, lastPid);
        subscr = subscr.slice(0, MAX_SUBSCRIPTIONS);
      }
      for (const i in subscr) subscr[i] = { id: subscr[i].tId };
      populateUsers(subscr, options, function (subscr) {
        options.showSubscriptions = {
          items: subscr,
        };
        callback(null, []);
      });
    });
  } else {
    options.tabTitle = 'Tracks';

    options.bodyClass += ' userTracks';
    options.showTracks = true;
    options.pageTitle = options.user.name + "'s tracks";
    const proceed = () =>
      postModel.fetchByAuthors([options.uid], options.fetchParams, (posts) =>
        callback(null, posts),
      );

    if (!feedTemplate.shouldRenderWholeProfilePage(options))
      // no page rendering required
      proceed();
    else {
      // SIDEBAR
      //console.time("LibUser.fetchActivity");
      fetchActivity(options, function () {
        // => populates options.activity
        //console.timeEnd("LibUser.fetchActivity");
        const ownProfile = options.user.id == (options.loggedUser || {}).id;
        // render playlists
        if ((options.user.pl || []).length || ownProfile)
          options.playlists = {
            url: '/u/' + options.user.id + '/playlists',
            items: renderPlaylists(options, MAX_PLAYLISTS_SIDE),
          };
        // fetch and render friends
        const params = {
          sort: { _id: -1 },
          limit: MAX_FRIENDS,
          fields: { _id: 0, tId: 1 },
        };
        followModel.fetch({ uId: options.user.id }, params, function (subscr) {
          if (subscr.length || ownProfile) {
            for (const i in subscr) subscr[i] = { id: subscr[i].tId };
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
};

exports.prepareTemplate = function (options) {
  options.customFeedTemplate = profileTemplateV2;
};
