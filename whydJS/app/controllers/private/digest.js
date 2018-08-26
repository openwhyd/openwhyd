/**
 * digest controller
 * generates email digests of personal notifications
 * @author: adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js')
var ObjectId = mongodb.ObjectId
var snip = require('../../snip.js')
var followModel = require('../../models/follow.js')
var activityModel = require('../../models/activity.js')
var postModel = require('../../models/post.js')
var emailModel = require('../../models/email.js')
var notifTemplate = require('../../templates/notif.js')

function fetchSubscribers (uid, options, cb) {
  if (!options.includeSubscribers) { return cb([]) }
  followModel.fetchSubscriptionHistory({toUId: uid, until: options.until}, function (subscribers) {
    for (var i in subscribers) {
      subscribers[i] = {
        id: subscribers[i].uId,
        name: subscribers[i].uNm
      }
    }
    cb(options.data.subscribers = subscribers)
  })
}

function fetchSubscriptionSet (uid, options, cb) {
  followModel.fetchSubscriptionSet(uid, function (subscriptionSet) {
    cb(options.data.subscriptionSet = subscriptionSet)
  })
}

function fetchLikedPostSet (uid, options, cb) {
  var postsToPopulate = [], likersPerPost = {}, likersPerTrack = {}
  if (!options.includeLikes) { return cb(likersPerTrack) }
  activityModel.fetchLikersOfUser(uid, {until: options.until}, function (activities) {
    for (var i in activities) {
      var pId = '' + activities[i].like.pId
      postsToPopulate.push(ObjectId(pId))
      likersPerPost[pId] = likersPerPost[pId] || []
      if (activities[i].id != uid) // (remove self-likes)
      {
        likersPerPost[pId].push({
          id: activities[i].id,
          name: activities[i].name
        })
      }
    }
    // fetch existing posts from DB
    postModel.fetchPosts({_id: {$in: postsToPopulate}}, /* params */ null, /* options */null, function (posts) {
      for (var i in posts) {
        if (posts[i] && likersPerPost['' + posts[i]._id]) {
          likersPerTrack[posts[i].eId] = {
            id: '' + posts[i]._id,
            name: posts[i].name,
            likes: /* encapsulateList( */likersPerPost['' + posts[i]._id]/* ) */
          }
        }
      }
      // delete records of deleted posts (stored as arrays of likers instead of encapsulated objects)
      for (var i in likersPerTrack) {
        if (!likersPerTrack[i] || !likersPerTrack[i].likes || !likersPerTrack[i].likes.length) { delete likersPerTrack[i] }
      }
      cb(options.data.likersPerPost = likersPerTrack)
    })
  })
}

function fetchRepostedTrackSet (uid, options, cb) {
  var repostedTrackSet = {}
  if (!options.includeReposts) { return cb(repostedTrackSet) }
  postModel.fetchRepostsFromMe(uid, options, function (reposts) {
    for (var i in reposts) {
      var pId = '' + reposts[i].repost.pId
      var eId = '' + reposts[i].eId
      repostedTrackSet[eId] = repostedTrackSet[eId] || {
        id: pId,
        name: reposts[i].name,
        reposts: []
      }
      if (reposts[i].pl) { reposts[i].pl.url = '/u/' + reposts[i].uId + '/playlist/' + reposts[i].pl.id }
      repostedTrackSet[eId].reposts.push({
        id: reposts[i].uId,
        name: reposts[i].uNm,
        playlist: reposts[i].pl
      })
    }
    cb(options.data.repostedTrackSet = repostedTrackSet)
  })
}

var MAX_RECENT_SAME_TRACKS = 5
var MAX_SAME_TRACKS_USERS = 10
var MAX_SAME_TRACKS_LOOKUP = 100

// list of users who posted the same tracks as you, since the last digest, per eId
function fetchSameTrackSet (uid, options, cb) {
  var sameTrackSet = {} // eId -> [uId]
  if (!options.includeSameTracks) { cb(sameTrackSet) } else {
    var myUid = ['' + uid, ObjectId('' + uid)]
    function onEachTrack (myTrack, nextTrack) {
      // console.log("- onEachTrack", !!myTrack);
      var remaining = MAX_RECENT_SAME_TRACKS - Object.keys(sameTrackSet).length
      var eId = myTrack && myTrack.eId
      if (eId) {
        var pId = '' + myTrack._id
        function onEachSameTrack (sameTrack) {
          // console.log("  - onEachSameTrack");
          if (sameTrack.uId && '' + sameTrack.uId != '' + uid) {
            (sameTrackSet[eId] = sameTrackSet[eId] || {
              id: pId,
              name: myTrack.name,
              sameTracks: {}
            }).sameTracks[sameTrack.uId] = true
          }
        }
        var qTheirPosts = {
          q: {
            //	uId: {$nin: myUid},
            eId: eId
          },
          fields: { uId: true, _id: false },
          limit: MAX_SAME_TRACKS_USERS
        }
        mongodb.forEach('post', qTheirPosts, onEachSameTrack, (remaining > 0 && nextTrack) || onEachTrack)
        // TODO: close cursor?
      } else if (!nextTrack || remaining < 1) {
        for (var eId in sameTrackSet) { sameTrackSet[eId].sameTracks = snip.mapToObjArray(sameTrackSet[eId].sameTracks, 'id') }
        cb(options.data.sameTrackSet = sameTrackSet)
      } else { nextTrack() }
    }
    var qMyPosts = {
      q: { uId: /* {$in: myUid} */ '' + uid },
      fields: { eId: true, name: true },
      limit: MAX_SAME_TRACKS_LOOKUP,
      sort: [['_id', 'desc']]
    }
    mongodb.forEach2('post', qMyPosts, onEachTrack)
  }
}

function fetchData (uid, options, cb) {
  options.data = {}
  var fcts = [
    fetchLikedPostSet,
    fetchRepostedTrackSet,
    fetchSubscribers,
    fetchSubscriptionSet
    // fetchSameTrackSet // disabled because too DB and memory intensive => suspected to crash whydJS since on openwhyd-2gb instance
  ];
  (function next () {
    var fct = fcts.shift()
    if (fct) { fct(uid, options, next) } else if (cb) { cb(options.data) }
  })()
}

exports.fetchAndGenerateNotifDigest = function (user, options, cb) {
  options = options || {}
  // fetchSampleData(function(subscriptions, posts) {
  fetchData(user._id, options, function (data) {
    var subscribers = data.subscribers || [],
      subscriptionSet = data.subscriptionSet || {},
      repostedTrackSet = data.repostedTrackSet || {},
      likersPerPost = data.likersPerPost || {},
      sameTrackSet = data.sameTrackSet || {}
    if (subscribers.length + Object.keys(repostedTrackSet).length + Object.keys(likersPerPost).length +
								Object.keys(sameTrackSet).length) {
      var lists = [repostedTrackSet, likersPerPost]
      for (var list in lists) {
        for (var track in lists[list]) {
          var users = lists[list][track].reposts || lists[list][track].likes
          for (var i in users) {
            if (users[i]) { users[i].subscribed = !!subscriptionSet[users[i].id] }
          }
        }
      }
      cb(notifTemplate.generateNotifDigest({
        recipient: user,
        subscriptions: subscribers,
        repostedTrackSet: repostedTrackSet,
        likersPerPost: likersPerPost,
        sameTrackSet: sameTrackSet,
        digestFrequency: options.frequency
      }))
    } else { cb() }
  })
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('digest.controller', reqParams)

  var user = request.checkLogin(response) // request.checkAdmin(response);
  if (!user) return

  var options = {
    frequency: 'weekly',
    until: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    includeLikes: true,
    includeReposts: true,
    includeSameTracks: true,
    includeSubscribers: true
  }

  console.log('options', options)

  exports.fetchAndGenerateNotifDigest(user, options, function (email) {
    if (email) {
      response.render(email.bodyHtml || email.bodyText, null, {'content-type': 'text/html'})
      if (reqParams && reqParams.send) { emailModel.email(process.env.WHYD_ADMIN_EMAIL, 'whyd digest test', email.bodyText, email.bodyHtml) }
    } else { response.render('no notifications since last digest') }
  })
}
