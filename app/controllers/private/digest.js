/**
 * digest controller
 * generates email digests of personal notifications
 * @author: adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js');
var ObjectId = mongodb.ObjectId;
var followModel = require('../../models/follow.js');
var activityModel = require('../../models/activity.js');
var postModel = require('../../models/post.js');
var emailModel = require('../../models/email.js');
var notifTemplate = require('../../templates/notif.js');

function fetchSubscribers(uid, options, cb) {
  if (!options.includeSubscribers) return cb([]);
  followModel.fetchSubscriptionHistory(
    { toUId: uid, until: options.until },
    function (subscribers) {
      for (let i in subscribers)
        subscribers[i] = {
          id: subscribers[i].uId,
          name: subscribers[i].uNm,
        };
      cb((options.data.subscribers = subscribers));
    },
  );
}

function fetchSubscriptionSet(uid, options, cb) {
  followModel.fetchSubscriptionSet(uid, function (subscriptionSet) {
    cb((options.data.subscriptionSet = subscriptionSet));
  });
}

function fetchLikedPostSet(uid, options, cb) {
  var postsToPopulate = [],
    likersPerPost = {},
    likersPerTrack = {};
  if (!options.includeLikes) return cb(likersPerTrack);
  activityModel.fetchLikersOfUser(
    uid,
    { until: options.until },
    function (activities) {
      for (let i in activities) {
        var pId = '' + activities[i].like.pId;
        postsToPopulate.push(ObjectId(pId));
        likersPerPost[pId] = likersPerPost[pId] || [];
        if (activities[i].id != uid)
          // (remove self-likes)
          likersPerPost[pId].push({
            id: activities[i].id,
            name: activities[i].name,
          });
      }
      // fetch existing posts from DB
      postModel.fetchPosts(
        { _id: { $in: postsToPopulate } },
        /*params*/ null,
        /*options*/ null,
        function (posts) {
          for (let i in posts) {
            if (posts[i] && likersPerPost['' + posts[i]._id])
              likersPerTrack[posts[i].eId] = {
                id: '' + posts[i]._id,
                name: posts[i].name,
                likes:
                  /*encapsulateList(*/ likersPerPost['' + posts[i]._id] /*)*/,
              };
          }
          // delete records of deleted posts (stored as arrays of likers instead of encapsulated objects)
          for (let i in likersPerTrack)
            if (
              !likersPerTrack[i] ||
              !likersPerTrack[i].likes ||
              !likersPerTrack[i].likes.length
            )
              delete likersPerTrack[i];
          cb((options.data.likersPerPost = likersPerTrack));
        },
      );
    },
  );
}

function fetchRepostedTrackSet(uid, options, cb) {
  var repostedTrackSet = {};
  if (!options.includeReposts) return cb(repostedTrackSet);
  postModel.fetchRepostsFromMe(uid, options, function (reposts) {
    for (let i in reposts) {
      var pId = '' + reposts[i].repost.pId;
      var eId = '' + reposts[i].eId;
      repostedTrackSet[eId] = repostedTrackSet[eId] || {
        id: pId,
        name: reposts[i].name,
        reposts: [],
      };
      if (reposts[i].pl)
        reposts[i].pl.url =
          '/u/' + reposts[i].uId + '/playlist/' + reposts[i].pl.id;
      repostedTrackSet[eId].reposts.push({
        id: reposts[i].uId,
        name: reposts[i].uNm,
        playlist: reposts[i].pl,
      });
    }
    cb((options.data.repostedTrackSet = repostedTrackSet));
  });
}

function fetchData(uid, options, cb) {
  options.data = {};
  var fcts = [
    fetchLikedPostSet,
    fetchRepostedTrackSet,
    fetchSubscribers,
    fetchSubscriptionSet,
  ];
  (function next() {
    var fct = fcts.shift();
    if (fct) fct(uid, options, next);
    else if (cb) cb(options.data);
  })();
}

exports.fetchAndGenerateNotifDigest = function (user, options, cb) {
  options = options || {};
  //fetchSampleData(function(subscriptions, posts) {
  fetchData(user._id, options, function (data) {
    var subscribers = data.subscribers || [],
      subscriptionSet = data.subscriptionSet || {},
      repostedTrackSet = data.repostedTrackSet || {},
      likersPerPost = data.likersPerPost || {},
      sameTrackSet = data.sameTrackSet || {};
    if (
      subscribers.length +
      Object.keys(repostedTrackSet).length +
      Object.keys(likersPerPost).length +
      Object.keys(sameTrackSet).length
    ) {
      var lists = [repostedTrackSet, likersPerPost];
      for (let list in lists) {
        for (let track in lists[list]) {
          var users = lists[list][track].reposts || lists[list][track].likes;
          for (let i in users)
            if (users[i]) users[i].subscribed = !!subscriptionSet[users[i].id];
        }
      }
      cb(
        notifTemplate.generateNotifDigest({
          recipient: user,
          subscriptions: subscribers,
          repostedTrackSet: repostedTrackSet,
          likersPerPost: likersPerPost,
          sameTrackSet: sameTrackSet,
          digestFrequency: options.frequency,
        }),
      );
    } else cb();
  });
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('digest.controller', reqParams);

  var user = request.checkLogin(response); //request.checkAdmin(response);
  if (!user) return;

  var options = {
    frequency: 'weekly',
    until: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    includeLikes: true,
    includeReposts: true,
    includeSameTracks: true,
    includeSubscribers: true,
  };

  console.log('options', options);

  exports.fetchAndGenerateNotifDigest(user, options, function (email) {
    if (email) {
      response.legacyRender(email.bodyHtml || email.bodyText, null, {
        'content-type': 'text/html',
      });
      if (reqParams && reqParams.send)
        emailModel.email(
          process.env.WHYD_ADMIN_EMAIL,
          'whyd digest test',
          email.bodyText,
          email.bodyHtml,
        );
    } else response.legacyRender('no notifications since last digest');
  });
};
