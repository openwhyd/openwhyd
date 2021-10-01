var snip = require('../snip.js');
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
var activityModel = require('../models/activity.js');
var uiSnippets = require('../templates/uiSnippets.js');

const MAX_HISTORY = 3;

exports.fetchPlaylists = (options) =>
  new Promise((resolve) => userModel.fetchPlaylists(options.user, {}, resolve));

exports.fetchLikes = (options) =>
  new Promise((resolve) => postModel.countLovedPosts(options.user.id, resolve));

exports.countSubscriptions = (options) =>
  new Promise((resolve) =>
    followModel.countSubscriptions(options.user.id, resolve)
  );

exports.countSubscribers = (options) =>
  new Promise((resolve) =>
    followModel.countSubscribers(options.user.id, resolve)
  );

exports.fetchIsSubscribed = (options) =>
  new Promise((resolve) =>
    followModel.get(
      { uId: options.loggedUser.id, tId: options.user.id },
      (err, res) => resolve(!!res)
    )
  );

exports.fetchNbTracks = (options) =>
  new Promise((resolve) => postModel.countUserPosts(options.user.id, resolve));

exports.fetchSubscriptions = async (options, params, ownProfile) => {
  const subscr = new Promise((resolve) =>
    followModel.fetch({ uId: options.user.id }, params, resolve)
  );
  if (subscr.length || ownProfile) {
    for (let i in subscr) subscr[i] = { id: subscr[i].tId };
    await new Promise((resolve) => userModel.fetchUserBios(subscr, resolve));
    return subscr;
  }
};

exports.populateFriendsData = (subscr, options, cb) => {
  followModel.fetchSubscriptionArray(
    options.loggedUser.id,
    function (mySubscr) {
      var subscrSet = snip.arrayToSet(mySubscr);
      for (let i in subscr)
        if (subscrSet[subscr[i].id]) subscr[i].subscribed = true;
      userModel.fetchUserBios(subscr, function () {
        cb(subscr);
      });
    }
  );
};

exports.fetchActivity = async (options) => {
  const activities = await new Promise((resolve) =>
    activityModel.fetchHistoryFromUidList(
      [options.user.id],
      { limit: MAX_HISTORY },
      resolve
    )
  );
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

  const posts = await new Promise((resolve) =>
    postModel.fetchPosts(
      { _id: { $in: postsToPopulate } },
      /*params*/ null,
      /*options*/ null,
      resolve
    )
  );

  var postSet = {};
  const activity = [];
  for (let i in posts) postSet['' + posts[i]._id] = posts[i];
  for (let i in activities) {
    if ((activities[i] || {}).like) {
      if (postSet['' + activities[i].like.pId])
        activities[i].like.post = postSet['' + activities[i].like.pId];
      else continue; // do not keep null posts
    }
    activity.push(activities[i]);
  }
  return activity;
};
