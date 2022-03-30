var snip = require('../snip.js');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
var activityModel = require('../models/activity.js');
var activityController = require('../controllers/recentActivity.js');
var feedTemplate = require('../templates/feed.js');
var uiSnippets = require('../templates/uiSnippets.js');

//var NEW_PROFILE = true;
var MAX_PLAYLISTS_SIDE = 4;
var MAX_FRIENDS = 6;
var MAX_HISTORY = 3;
var MAX_SUBSCRIPTIONS = 50;

function renderPlaylists(options, maxNb) {
  //console.log("renderplaylists", options.user.pl)
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
      //while(playlists.length < maxNb)
      //	playlists.push({url:"javascript:;"});
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

exports.fetchAndRender = function (options, callback, process) {
  // TODO: remove process => use callback only
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
    process([]); // no posts // TODO: is this call necessary ?
    //});
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
        //console.log("mySubscr.subscriptions", mySubscr.subscriptions);
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
            //console.log("ACTIVITY result", result.recentActivity);
            options.showActivity = result.recentActivity;
            if (result.hasMore)
              options.hasMore = { lastPid: result.hasMore.last_id };
            else {
              var creation = mongodb.ObjectId(options.user.id);
              options.showActivity.items.push({
                _id: creation,
                other: { text: 'joined whyd' },
                //						ago: uiSnippets.renderTimestamp(new Date() - creation.getTimestamp())
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
        options.hasMore = {
          lastPid: params.skip + MAX_SUBSCRIPTIONS,
        };
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
        options.hasMore = {
          lastPid: params.skip + MAX_SUBSCRIPTIONS,
        };
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

    if (options.after || options.before)
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
};
