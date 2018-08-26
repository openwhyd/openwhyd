// usage: run from http://localhost:8080/admin/test
// TODO: turn this script into a proper integration test and move it outside of the app

var postModel = require('../../../models/post.js')
var followModel = require('../../../models/follow.js')

function hashPosts (posts) {
  var hash = ''
  for (var i in posts) { hash += posts[i]._id }
  // console.log("HASH", hash);
  return hash
}

exports.makeTests = function (p) {
  var testVars = {}, OPTIONS = {
    limit: 1000
  }
  return [
    ['fetchSubscriptionArray', function fetchSubscriptions (cb) {
      // console.time("fetchSubscriptionArray");
      followModel.fetchSubscriptionArray(p.loggedUser.id, function (subscriptions) {
        testVars.uidList = subscriptions.concat([p.loggedUser.id])
        // console.timeEnd("fetchSubscriptionArray");
        cb(true)
      })
    }],
    ['fetchByAuthorsOld', function (cb) {
      // console.time("fetchByAuthors_v1");
      postModel.fetchByAuthorsOld(testVars.uidList, OPTIONS, function (res) {
        // console.timeEnd("fetchByAuthors_v1");
        console.log('=> fetched', res.length, 'posts')
        testVars.hashedResult = hashPosts(res)
        cb(true)
      })
    }],
    ['fetchByAuthors', function (cb) {
      // console.time("fetchByAuthors_v2");
      postModel.fetchByAuthors(testVars.uidList, OPTIONS, function (res) {
        // console.timeEnd("fetchByAuthors_v2");
        console.log('=> fetched', res.length, 'posts')
        cb(testVars.hashedResult === hashPosts(res))
      })
    }]
  ]
}
