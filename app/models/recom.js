var config = require('./config.js');
var mongodb = require('./mongodb.js');
var snip = require('../snip.js');
//var postModel = require("./post.js");
var postModel = {
  forEachPost: function (q, p, handler) {
    mongodb.collections['post'].find(q, p, function (err, cursor) {
      cursor.each(function (err, track) {
        if (err)
          // we're done
          console.log('recom.forEachPost error:', err);
        handler(track);
      });
    });
  },
};

var MAX_ARTISTS_PER_MATCH = 3;
var TRACK_MEMORY_USAGE = false;

var sizeof = TRACK_MEMORY_USAGE ? require('object-sizeof') : function () {};

function countOccurences(array) {
  var count = {};
  for (var j in array) count[array[j]] = (count[array[j]] || 0) + 1;
  return snip.mapToObjArray(count, 'id', 'c').sort(function (a, b) {
    return b.c - a.c;
  });
}

/** returns common liked/posted tracks for each user **/
/*
exports.fetchCommonTracks = function(uId, options, cb) {
	var eIds = {};
	var users = {};
	var tracks = {};
	var options = options || {};
	options.excludeUids = (options.excludeUids || []).concat([""+uId]);
	function fetchPostedTracks(cb) {
		console.log("fetching posted tracks...");
		var q = {eId:{$in:Object.keys(eIds)}, uId:{$nin:options.excludeUids}};
		postModel.forEachPost(q, {batchSize:1000, fields:{_id: 0, eId:1, uId:1, uNm:1, name:1}}, function(track) {
			if (!track)
				cb(users);
			else if (track.eId && track.uId) {
				users[track.uId] = users[track.uId] || {id: track.uId, name:track.uNm};
				(users[track.uId].posted = users[track.uId].posted || []).push(track.eId);
				tracks[track.eId] = tracks[track.eId] || track.name;
			}
		});		
	}
	function fetchLikedTracks(cb) {
		console.log("fetching liked tracks...");
		var q = {lov:""+uId, uId:{$nin:options.excludeUids}};
		postModel.forEachPost(q, {batchSize:1000, fields:{_id: 0, eId:1, uId:1, uNm:1, name:1}}, function(track) {
			if (!track)
				cb(users);
			else if (track.eId && track.uId) {
				users[track.uId] = users[track.uId] || {id: track.uId, name:track.uNm};
				(users[track.uId].liked = users[track.uId].liked || []).push(track.eId);
				tracks[track.eId] = tracks[track.eId] || track.name;
			}
		});		
	}
	function fetchTrackLikers(cb) {
		console.log("fetching track likers...");
		var excludedUids = snip.arrayToSet(options.excludeUids);
		postModel.forEachPost({uId:""+uId}, {batchSize:1000, fields:{_id: 0, eId:1, lov:1, name:1}}, function(track) {
			if (!track)
				cb(users);
			else if (track.eId) {
				tracks[track.eId] = tracks[track.eId] || track.name;
				for(var i in track.lov) {
					var id = track.lov[i];
					if (!excludedUids[id]) {
						//likers[track.lov[i]] = true;
						users[id] = users[id] || {id: id, name:(mongodb.usernames[id] || {}).name};
						(users[id].liker = users[id].liker || []).push(track.eId);
					}
				}
			}
		});		
	}
	var steps = [fetchTrackLikers, fetchLikedTracks, fetchPostedTracks];
	postModel.forEachPost({uId:""+uId}, {batchSize:1000, fields:{_id: 0, eId:1}}, function(track) {
		if (!track)
			(function runNextStep() {
				if (steps.length)
					steps.shift()(runNextStep);
				else
					cb(users, tracks);
			})();
		else if (track.eId)
			eIds[track.eId] = true;
	});
}
*/
exports.matchingEngine = (function () {
  var artists; /// { "manisnotabird" : ["Man Is Not A Bird", popularity] }
  var usersByArtist; // { "manisnotabird" : [ [uId, posted], ... ] }
  var artistsByUser; // { uId: [ ["manisnotabird", posted], ... ] }
  var mostPopular = 1; // number of posts/likes of the most popular artist
  var populating = false;
  var ready = false;
  var whenReady = [];

  /* warning: to be called only when index is already populated */
  function addPost(track) {
    if (track && track.name && track.uId) {
      var artistName = track.name
        ? snip.detectArtistName(snip.cleanTrackName(track.name))
        : '';
      var artist = artistName ? snip.normalizeArtistName(artistName) : '';
      if (artist) {
        artists[artist] = artists[artist] || [artistName, 0];
        mostPopular = Math.max(mostPopular, ++artists[artist][1]); // increment artist popularity counter, and update max score
        (usersByArtist[artist] = usersByArtist[artist] || []).push([
          track.uId,
          true,
        ]);
        (artistsByUser[track.uId] = artistsByUser[track.uId] || []).push([
          artist,
          true,
        ]);
      }
    }
  }

  function populateIndex(cb) {
    populating = true;
    artists = {};
    usersByArtist = {};
    artistsByUser = {};
    if (cb) whenReady.push(cb);
    function whenDone() {
      populating = false;
      ready = true;
      // TODO: delete artists that have only 1 reference (useless for matches)
      for (var fct; !!(fct = whenReady.pop()); fct());
      if (TRACK_MEMORY_USAGE) printMemUsage();
    }
    if (config.recomPopulation) {
      console.log(
        'recom.matchingEngine.populateIndex: fetching posted and liked artists...'
      );
      postModel.forEachPost(
        {},
        { batchSize: 1000, fields: { _id: 0, uId: 1, uNm: 1, name: 1 } },
        function (track) {
          if (!track) {
            console.log(
              'recom.matchingEngine.populateIndex: done indexing! => score of most popular artist',
              mostPopular
            );
            whenDone();
          } else addPost(track);
        }
      );
    } else {
      console.log('config.recomPopulation SET TO FALSE => skipping');
      whenDone();
    }
  }

  function waitForIndex(cb) {
    if (ready) cb();
    else if (populating) whenReady.push(cb);
    else populateIndex(cb);
  }

  var printMemUsage = !TRACK_MEMORY_USAGE
    ? function () {}
    : function () {
        console.log('RECOM MEMORY USAGE...');
        console.log('RECOM MEMORY USAGE, artists:', sizeof(artists));
        console.log(
          'RECOM MEMORY USAGE, usersByArtist:',
          sizeof(usersByArtist)
        );
        console.log(
          'RECOM MEMORY USAGE, artistsByUser:',
          sizeof(artistsByUser)
        );
      };

  if (TRACK_MEMORY_USAGE) printMemUsage();

  return {
    init: populateIndex,
    getMemoryUsage: function () {
      return {
        artists: sizeof(artists),
        usersByArtist: sizeof(usersByArtist),
        artistsByUser: sizeof(artistsByUser),
      };
    },
    getArtistsByUser: function (uid) {
      return artistsByUser['' + uid];
    },
    getArtistName: function (artistId) {
      var artist = artists['' + artistId];
      return artist ? artist[0] : null;
    },
    getArtistRarity: function (artistId) {
      var artist = artists['' + artistId];
      return artist ? (mostPopular - artist[1]) / mostPopular : 0;
    },
    addPost: function (post, cb) {
      waitForIndex(function () {
        addPost(post);
        if (cb) cb();
      });
    },
    /**
     * returns {manisnotabird:4, ...}
     **/
    fetchCommonArtistsForTwoUsers: function (uId1, uId2, cb) {
      waitForIndex(function () {
        var artistSet = snip.objArrayToSet(artistsByUser['' + uId1], 0, true);
        //console.log("artistSet", artistSet);
        var artistList = artistsByUser['' + uId2];
        //console.log("artistList", artistList);
        var common = {};
        for (var i in artistList) {
          var artist = artistList[i][0];
          if (artistSet[artist]) common[artist] = (common[artist] || 0) + 1;
        }
        //console.log("common", common);
        cb(common);
      });
    },
    /**
     * myArtists: [[ artistId, (int)weight ]]
     * returns { uId: {manisnotabird:4, ...} }
     **/
    fetchUsersByArtists: function (myArtists, options, cb) {
      var options = options || {}; // this line must stay before call to waitForIndex, in order to keep in scope
      waitForIndex(function () {
        var recomUsers = {};
        var excludedUid = snip.arrayToSet(options.excludeUids || []);
        for (var artist in myArtists) {
          artist = myArtists[artist][0];
          var users = usersByArtist[artist];
          for (var u in users) {
            var userId = users[u][0];
            if (excludedUid[userId]) continue;
            if (!mongodb.usernames['' + userId]) {
              //console.error("warning: user missing in cache: ", userId);
              continue;
            }
            var recomUser = (recomUsers[userId] = recomUsers[userId] || {
              id: userId,
              name: mongodb.usernames[userId].name,
            });
            (recomUser.posted = recomUser.posted || []).push(artist);
          }
        }
        cb(recomUsers /*, artists*/);
      });
    },
    /**
     * returns { uId: {manisnotabird:4, ...} }
     **/
    fetchCommonArtists: function (uId, options, cb) {
      var self = this;
      var options = options || {}; // this line must stay before call to waitForIndex, in order to keep in scope
      options.excludeUids = (options.excludeUids || []).concat(['' + uId]);
      waitForIndex(function () {
        self.fetchUsersByArtists(artistsByUser[uId], options, cb);
      });
    },
  };
})();

//exports.matchingEngine.init(); // init recommendation index on startup

/** returns common liked/posted artists for each user **/
/*
exports.fetchCommonArtists = function(uId, options, cb) {
	function fetchTheirLikedArtists(cb) {
		console.log("fetching their liked artists...");
		var excludedUids = snip.arrayToSet(options.excludeUids);
		postModel.forEachPost({uId:""+uId}, {batchSize:1000, fields:{_id: 0, lov:1, name:1}}, function(track) {
			if (!track)
				cb(users);
			else if (track.name && track.uId && track.lov && track.lov.length) {
				var artistName = track.name ? snip.detectArtistName(snip.cleanTrackName(track.name)) : "";
				artistName = artistName ? snip.normalizeArtistName(artistName) : "";
				if (artistName && myArtists[artistName]) {
					for(var i in track.lov) {
						var id = track.lov[i];
						users[id] = users[id] || {id: id, name:(mongodb.usernames[id] || {}).name};
						(users[id].liker = users[id].liker || []).push(artistName);
					}						
				}
			}
		});		
	}
}
*/

/** returns a scored list of recommended users, based on common tracks **/
/*
exports.recomUsersByTracks = function(uId, options, cb) {
	exports.fetchCommonTracks(uId, options, function(users, tracks){
		for(var i in users) {
			var eids = (users[i].posted || []).concat(users[i].liked || []).concat(users[i].liker || []);
			var bestTracks = countOccurences(eids);
			if (bestTracks.length > MAX_ARTISTS_PER_MATCH)
				bestTracks = bestTracks.slice(0, MAX_ARTISTS_PER_MATCH);
			users[i].artistNames = [];
			for (var j in bestTracks) {
				var artistName = snip.detectArtistName(snip.cleanTrackName(tracks[bestTracks[j].id]));
				if (artistName)
					users[i].artistNames.push(artistName);
			}
			users[i].score = (users[i].posted || []).length * 4 + (users[i].liked || []).length * 2 + (users[i].liker || []).length
		}
		cb(users);
	});
}
*/

/** returns a similarity scored and the list of common artists **/
exports.computeUserSimilarity = function (uId1, uId2, cb) {
  exports.matchingEngine.fetchCommonArtistsForTwoUsers(uId1, uId2, function (
    common
  ) {
    //console.log("common", common);
    var nbArtists =
      (exports.matchingEngine.getArtistsByUser(uId1) || []).length / 2;
    common = snip
      .mapToObjArray(common, 'id', 'c')
      .sort(function (a, b) {
        return b.c - a.c;
      })
      .map(function (artist) {
        return {
          id: artist.id,
          name: exports.matchingEngine.getArtistName(artist.id),
          c: artist.c,
        };
      });
    cb({
      artists: common,
      score: common.length / nbArtists,
    });
  });
};

/** returns a scored list of recommended users, based on common artists **/
exports.recomUsersByArtists = function (uId, options, cb) {
  exports.matchingEngine.fetchCommonArtists(uId, options, function (users) {
    var nbArtists = (exports.matchingEngine.getArtistsByUser(uId) || []).length;
    console.log('user has', nbArtists, 'artists');
    if (nbArtists == 0) return cb([]);
    nbArtists /= 2; // => a score of 50% (common artists) will be show as "holy shit!"
    for (var i in users) {
      var commonArtists = (users[i].posted || [])
        .concat(users[i].liked || [])
        .concat(users[i].liker || []);
      var bestArtists = countOccurences(commonArtists);
      users[i].artistNames = [];
      bestArtists = bestArtists.map(function (artist) {
        return {
          name: exports.matchingEngine.getArtistName(
            artist.id
          ) /*,
					rarity: exports.matchingEngine.getArtistRarity(artist.id)*/,
        };
      });
      /*bestArtists.sort(function(a,b){
				return b.rarity - a.rarity;
			});*/
      for (var j in bestArtists) {
        var artist = bestArtists[j];
        if (artist && artist.name)
          users[i].artistNames.push(bestArtists[j].name);
      }
      users[i].score =
        ((users[i].posted || []).length * 1) /
        //	+	(users[i].liked || []).length * 0.5
        //	+	(users[i].liker || []).length * 0.25
        nbArtists;
    }
    cb(users);
  });
};

/** returns a scored list of recommended users, based on common rare artists => poor results (only one artist per recommended user) **/
/*
exports.recomUsersByRareArtists = function(uId, options, cb) {
	function sortByRarity(array, artists) {
		var res = {}; // artistid -> popularity score
		for (var j in array)
			res[array[j]] = artists[array[j]][1];
		return snip.mapToObjArray(res, "id", "p").sort(function(a,b){
			return a.p - b.p;
		});
	}
	exports.matchingEngine.fetchCommonArtists(uId, options, function(users, artists){
		for(var i in users) {
			var commonArtists = (users[i].posted || []).concat(users[i].liked || []).concat(users[i].liker || []);
			var rareArtists = sortByRarity(commonArtists, artists);
			if (rareArtists.length > MAX_ARTISTS_PER_MATCH)
				rareArtists = rareArtists.slice(0, MAX_ARTISTS_PER_MATCH);
			users[i].artistNames = [];
			users[i].score = 0;
			for (var j in rareArtists) {
				var artist = artists[rareArtists[j].id];
				if (artist) {
					users[i].score -= artist[1]; // sum opposite popularities => rarity scoring
					users[i].artistNames.push(artist[0]);
				}
			}
		}
		cb(users);
	});
}
*/
