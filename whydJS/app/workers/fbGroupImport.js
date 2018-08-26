/**
 * fbGroupImport
 * transforms a facebook group feed of videos to openwhyd posts
 * @author adrienjoly, whyd
 */

var fs = require('fs')
var util = require('util')

var path = '../..'
var config = require(path + '/app/models/config.js')
var mongodb = require(path + '/app/models/mongodb.js')
var fbModel = require(path + '/app/models/facebook.js')
var snip = require(path + '/app/snip.js')

// constants

var LIMIT_PAGE = 100
var LIMIT_FIRST = 20
var LIMIT_GROUPS = 20

// class-scope attributes

var jobs = {}
var lastJobId = 0

// main functions

exports.fetchGroups = function (fbUserId, fbAccessToken, cb) {
  fbModel.graphApiRequest(fbAccessToken, '/' + fbUserId + '/groups', {limit: LIMIT_GROUPS}, cb)
}

exports.fetchGroupInfo = function (fbGroupId, fbAccessToken, cb) {
  fbModel.graphApiRequest(fbAccessToken, '/' + fbGroupId, {}, cb)
}

exports.startJob = function (fbGroupId, fbAccessToken, cb) {
  var job = new FbGroupImport(fbAccessToken, fbGroupId)
  process.nextTick(function () { job.start() })
  return job
}

exports.getJobById = function (jobId) {
  return jobs['' + jobId]
}

exports.releaseJobById = function (jobId) {
  delete jobs['' + jobId]
  console.log('released job id', jobId)
}

function translateFacebookPostToWhydPostSync (post) {
  return (!post || !post.link) ? null : {
    _id: mongodb.ObjectId(mongodb.dateToHexObjectId(new Date(post.created_time))), // updated_time
    eId: config.translateUrlToEid(post.link),
    name: post.name,
    text: post.from.name + (post.message ? ': ' + post.message : ''),
    img: post.picture,
    fbId: post.id,
    fbFrom: post.from,
    fbDate: new Date(post.created_time),
    src: {id: post.source}
  }
}

exports.translateFacebookPostToWhydPost = function (post, cb) {
  cb(translateFacebookPostToWhydPostSync(post))
}

// ====== private part

function FbGroupImport (fbAccessToken, fbGroupId) {
  snip.AsyncEventEmitter.call(this)
  this.jobId = (++lastJobId)
  this.fbAccessToken = fbAccessToken
  this.fbGroupId = fbGroupId
  this.stats = {
 		// loaded from facebook:
 		page: 0,
    posts: 0
  }
  this.running = false
  jobs['' + this.jobId] = this
}
util.inherits(FbGroupImport, snip.AsyncEventEmitter)

// parse one page of posts, emits "post" events asynchronously for each of them, then calls backs
FbGroupImport.prototype.processJsonPage = function (json, cb) {
  var job = this
  if (json && json.data) {
    (function next () {
      if (!job.running) { return }
      process.nextTick(function () {
        if (json.data.length) {
          ++job.stats.posts
          job.emit('post', json.data.shift(), next) // asynchronous: calling next when all listeners are done on this post
        } else if (cb) { cb() }
      })
    })()
  } else if (cb) { process.nextTick(cb) }
}

// recursive request+parsing cycles from facebook graph api
FbGroupImport.prototype.processJsonPages = function (json) {
  var job = this
  process.nextTick(function () {
    console.log('processing facebook group data, length=', json && json.data && json.data.length)
    job.processJsonPage(json, function () {
      if (json.paging && json.paging.next) {
        console.log('requesting page #' + job.stats.page + '...')
        json.paging.next = json.paging.next.replace('limit=20', 'limit=' + LIMIT_PAGE)
        console.log('NEXT PAGE: ', json.paging.next)
        snip.httpRequestJSON(json.paging.next, {}, function (err, json) {
          ++job.stats.page
          // console.log("=>", err, json)
          if (err) {
            console.error('=> fbGroupImportERR', err)
            job.emit('error', err)
          } else { job.processJsonPages(json) } // recursive call on following pages
        })
      } else {
        console.log('no more posts to parse')
        job.stop()
      }
    })
  })
}

FbGroupImport.prototype.start = function () {
  var job = this
  this.running = true
  fbModel.graphApiRequest(this.fbAccessToken, '/' + this.fbGroupId + '/feed', {limit: LIMIT_FIRST}, function (json) {
    job.stats.page = 1
    if (!json || json.error) {
      console.error('=> fbGroupImportERR', (json || {}).error)
      job.emit('error', {message: (json || {}).error || 'first facebook request failed'})
    } else { job.processJsonPages(json) } // recursive call
  })
  return job
}

FbGroupImport.prototype.stop = function () {
  console.log('import job', this.jobId, 'has stopped')
  this.running = false
  this.emit('end')
}
