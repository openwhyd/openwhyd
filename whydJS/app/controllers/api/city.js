/**
 * city pages API controller
 */

var path = require('path')
var snip = require('../../snip.js')
var config = require('../../models/config.js')
var mongodb = require('../../models/mongodb.js')
var userModel = require('../../models/user.js')
var postModel = require('../../models/post.js')
// var searchModel = require("../../models/search.js");
var plTagsModel = require('../../models/plTags.js')
var mainTemplate = require('../../templates/mainTemplate.js')

var RELEASE_DATE = new Date('Thursday April 17, 2014 14:00') // paris page release date
var PLAYLIST_QUERY_LIMIT = 1000

var memberCache = (function MemberCache () {
  var perCity = {}
  function refresh (city, cb) {
    console.log('caching users of city', city, '...')
    var filePath = path.resolve('app/data/citymembers.' + city + '.js')
    console.log('path:', filePath)
    delete require.cache[filePath] // clear the cache entry for this file before reloading it below
    try {
      var users = (require(filePath).members || []).map(function (uid) {
        return {id: uid}
      })
      userModel.fetchUserFields(users, ['name', 'bio'], function (users) {
        perCity[city] = users
        cb && cb(users)
      })
    } catch (e) {
      console.log('city controller => error: ', e)
      cb && cb()
    }
  }
  return {
    hasCity: function (city, cb) {
      if (perCity[city]) { cb(perCity[city]) } else { refresh(city, cb) }
    },
    refresh: function (city, cb) {
      refresh(city, cb)
    },
    getCityMembers: function (city, cb) {
      if (!perCity[city]) { refresh(city, cb) } else { cb(perCity[city]) }
    },
    getCityUids: function (city, cb) {
      this.getCityMembers(city, function (users) {
        cb(snip.objArrayToValueArray(users, 'id'))
      })
    },
    getCityUidSet: function (city, cb) {
      this.getCityUids(city, function (uids) {
        cb(snip.arrayToSet(uids))
      })
    }
  }
})()

function refreshCityMembers (p, cb) {
  memberCache.refresh(p.city, cb)
}

function posModulo (n, m) {
  return ((n % m) + m) % m
}

function fetchCityMembers (p, cb) {
  memberCache.getCityMembers(p.city, function (users) {
    cb(users.slice(0, parseInt(p.limit)))
  })
}

// fetch "featured" users: cycling to all members, 3 new per day (with limit=3)
function fetchPeopleCurrent (p, cb) {
  var limit = parseInt(p.limit)
  memberCache.getCityMembers(p.city, function (users) {
    var diff = Date.now() - RELEASE_DATE.getTime()
    var nbDays = Math.round(diff / 1000 / 60 / 60 / 24)
    var offset = posModulo(limit * nbDays, users.length)
    var end = offset + limit
    if (end > users.length) { users = users.concat(users) }
    cb(users.slice(offset, end))
  })
}

// fetch users that most recently shared a track
function fetchPeopleRecent (p, cb) {
  var uidSet = {}
  memberCache.getCityMembers(p.city, function (users) {
    var limit = Math.min(parseInt(p.limit), users.length)
    var uids = snip.objArrayToValueArray(users, 'id')
    mongodb.forEach2('post', {q: {uId: {$in: uids}}, sort: [['_id', 'desc']]}, function (post, next) {
      if (!next || !limit) { userModel.fetchUserFields(snip.values(uidSet), ['name', 'bio'], cb) } else {
        if (!uidSet[post.uId]) {
          uidSet[post.uId] = {id: post.uId}
          uidSet[post.uId].lastPost = post
          --limit
        }
        next()
      }
    })
  })
}

function fetchCityTracks (p, cb) {
  // p.q = {repost: {$exists: false}}, after: p.after/*, before: p.before*/, limit: LIMIT+1}
  var posts = []
  memberCache.getCityUids(p.city, function (uids) {
    plTagsModel.getTagEngine(function (tagEngine) {
      mongodb.forEach2('post', {q: {uId: {$in: uids}}, after: p.after, sort: [['_id', 'desc']]}, function (post, next) {
        if (!next || posts.length >= p.limit) { cb(posts) } else if (p.genre) {
          var tags = tagEngine.getTagsByEid((post || {}).eId || '')
          if (tags && tags.length && tags[0].id == p.genre) { posts.push(post) }
          next()
        } else {
          posts.push(post)
          next()
        }
      })
    })
  })
}
/*
function fetchPlaylistsFromSearchIndex(p, cb){
	memberCache.getCityUidSet(p.city, function(uidSet){
		searchModel.query({_type: "playlist", q: p.city, limit: PLAYLIST_QUERY_LIMIT}, function(r) {
			var playlists = [], hits = ((r || {}).hits || []);
			for (var i in hits) {
				hits[i].id = "" + hits[i]._id;
				var idParts = hits[i].id.split("_");
				hits[i].uId = idParts[0];
				if (uidSet[hits[i].uId]) {
					hits[i].plId = idParts[1];
					hits[i].uNm = (mongodb.usernames[idParts[0]] || {}).name;
					delete hits[i]._index;
					delete hits[i]._type;
					delete hits[i]._id;
					delete hits[i]._score;
					playlists.push(hits[i]);
				}
			}
			playlists = playlists.slice(0, p.limit);
			// for each playlist, fetch number of tracks
			(function next(i) {
				if (i >= playlists.length)
					return cb(playlists);
				var pl = playlists[i];
				postModel.countPlaylistPosts(pl.uId, pl.plId, function(c) {
					playlists[i].nbTracks = c;
					next(i + 1);
				});
			})(0);
		});
	});
}
*/
var ACTIONS = {
  'refresh': refreshCityMembers,
  'posts': fetchCityTracks,
  'people': fetchCityMembers,
  'peopleCurrent': fetchPeopleCurrent,
  'peopleRecent': fetchPeopleRecent
//	"playlists": fetchPlaylistsFromSearchIndex
}

function toTitleCase (str) {
  return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

var CITIZEN_NAMES = {
  paris: 'Parisian',
  madrid: 'Madrileo'
}

function renderCityPage (city, loggedUser, cb) {
  var cityDataPath = '/cityData'
  var cityDataPrefix = cityDataPath + '/' + city + '-'
  var cityName = toTitleCase(city) // TODO
  var templateParams = {
    city: city,
    cityName: cityName,
    citizensName: CITIZEN_NAMES[city],
    cityImgPrefix: '/images/pgCity-' + city + '-',
    cityUrl: config.urlPrefix + '/' + city,
    loggedUser: loggedUser
  }
  var whydPageParams = {
    // request: request, // => pageUrl => meta og:url element (useless)
    loggedUser: loggedUser,
    pageTitle: 'Whyd ' + cityName + ' Community',
    pageImage: config.urlPrefix + templateParams.cityImgPrefix + 'fb-sharing.jpg',
    js: [],
    css: [],
    endOfBody: [
      '    <script>',
      '      window.onCityPageReady = function(initCityPage){',
      '        delete window.onCityPageReady;',
      '        initCityPage("' + config.urlPrefix.substr(config.urlPrefix.indexOf('//')) + '", "' + city + '");',
      '      }',
      '    </script>',
      '    <script src="/js/jquery.ellipsis.min.js"></script>',
      '    <script src="' + cityDataPrefix + 'playlists.js"></script>',
      '    <script src="' + cityDataPrefix + 'people.js"></script>',
      '    <script src="/js/pgCity-common.js"></script>',
      '    <script src="/js/pgCity-popup.js"></script>'
    ].join('\n')
  }
  mainTemplate.renderAsyncWhydPageFromTemplateFile('public' + cityDataPath + '/template.html', templateParams, whydPageParams, cb, true)
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('city.api.controller', reqParams)

  var loggedUser = request.checkLogin()
  // if (!loggedUser) return response.badRequest();

  reqParams = reqParams || {}
  var city = ('' + (reqParams._1 || request.url)).replace(/[^a-z0-9]*/gi, '') // sanitize city name

  memberCache.hasCity(city, function (members) {
    if (!(members || []).length) { return response.badRequest() }

    var action = reqParams._2
    var actionFct = ACTIONS[action]
    if (!actionFct) { return renderCityPage(city, loggedUser, response.renderHTML.bind(response)) }

    var result = {
      time: Date.now(),
      city: city,
      action: action,
      limit: reqParams.limit || 5
    }

    if (reqParams.after) { result.after = reqParams.after }

    var genre = (plTagsModel.extractGenreTags(reqParams.genre || '') || []).shift() || ''
    if (genre) { result.genre = genre }

    actionFct(result, function (res) {
      if (!res || res.error) {
        result.error = (res || {}).error || 'null response'
        console.error('api.city.controller ERROR:', result.error)
      } else { result.data = /* JSON.stringify */(res) }
      response.renderJSON(reqParams.callback ? snip.renderJsCallback(reqParams.callback, result) : result)
    })
  })
}
