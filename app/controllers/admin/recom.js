/**
 * recommendation evaluation console
 * @author adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js');
var recomModel = require('../../models/recom.js');
var followModel = require('../../models/follow.js');
var postModel = require('../../models/post.js');
var snip = require('../../snip.js');
var jStat = require('../../jstat.js').jStat;
require('../../jstat-vector.js').init(jStat, Math);
var FileController = require('./FileController.js');

// fetching + caching helpers

var cachedTrackAnalytics;

function countOccurences(array) {
  var count = {};
  for (var j in array) count[array[j]] = (count[array[j]] || 0) + 1;
  return snip.mapToObjArray(count, 'id', 'c').sort(function(a, b) {
    return b.c - a.c;
  });
}

function wrapJsonGeneratorToText(name) {
  return function(p, cb) {
    fileGenerators[name](p, function(items) {
      cb(JSON.stringify(items, null, 2));
    });
  };
}

function gatherTrackAnalytics(cb) {
  /** returns number of posts and likes per track eid **/
  function generateMap(cb) {
    var nb = 0;
    var eIds = {};
    mongodb.collections['post'].find(
      {},
      { batchSize: 1000, fields: { _id: 0, eId: 1, lov: 1, name: 1 } },
      function(err, cursor) {
        cursor.each(function(err, track) {
          ++nb;
          if (!track)
            // we're done
            cb(eIds, nb);
          else if (!track.eId) console.error('warning: null track eid');
          else {
            eIds[track.eId] = eIds[track.eId] || {
              name: track.name,
              posts: 0,
              likes: 0
            };
            eIds[track.eId].posts++;
            eIds[track.eId].likes += (track.lov || []).length;
          }
        });
      }
    );
  }
  if (cachedTrackAnalytics) cb(cachedTrackAnalytics);
  else
    generateMap(function(eIds, nb) {
      console.log('cached', nb, 'posts');
      for (var eId in eIds)
        eIds[eId].interacted = eIds[eId].posts + eIds[eId].likes;
      cb((cachedTrackAnalytics = eIds), nb);
    });
}

var cachedArtistAnalytics;

function gatherArtistAnalytics(cb) {
  /** returns number of posts and likes per artist name **/
  function generateMap(cb) {
    var nb = 0;
    var artists = {};
    postModel.forEachPost(
      {},
      { batchSize: 1000, fields: { _id: 0, lov: 1, name: 1 } },
      function(track) {
        if (!track) cb(artists, nb);
        else {
          ++nb;
          if (track.name) {
            var artistName = snip.detectArtistName(
              snip.cleanTrackName(track.name)
            );
            if (artistName) {
              var artist = snip.normalizeArtistName(artistName);
              artists[artist] = artists[artist] || {
                name: /*track.name*/ artistName,
                posts: 0,
                likes: 0
              };
              artists[artist].posts++;
              artists[artist].likes += (track.lov || []).length;
            } else console.log('unrecognized track artist: ', track.name);
          } else console.error('warning: missing track name');
        }
      }
    );
  }
  if (cachedArtistAnalytics) cb(cachedArtistAnalytics);
  else
    generateMap(function(map, nb) {
      console.log('cached', nb, 'posts');
      for (var artist in map)
        map[artist].interacted = map[artist].posts + map[artist].likes;
      cb((cachedArtistAnalytics = map), nb);
    });
}

/**
 * applies given recommendation algorithm on all users,
 * then return results and score ranges for each of them in TSV format
 **/
function RecomEvaluator(recomUsersFct) {
  var TSV_HEADER = ['id', 'name', 'nbRecoms', 'minScore', 'maxScore'];
  var cachedEvalTable, totalUsers, nbUsersWithMatches;
  function forEachUserRecom(handler, cb) {
    var users = snip.mapToObjArray(mongodb.usernames);
    totalUsers = users.length;
    nbUsersWithMatches = 0;
    (function next() {
      if (!users.length) return cb();
      var user = users.pop();
      recomUsersFct(user.id, function(allUsers) {
        var min = NaN,
          max = NaN;
        // separate already subscribed users
        var recomUsers = [];
        for (var i in allUsers)
          if (!allUsers[i].subscribed) recomUsers.push(allUsers[i]);
        if (recomUsers && recomUsers.length) {
          max = recomUsers[0].score;
          min = recomUsers[recomUsers.length - 1].score;
          nbUsersWithMatches++;
        }
        handler({
          user: user,
          recomUsers: recomUsers,
          allRecomUsers: allUsers,
          minScore: min,
          maxScore: max
        });
        next();
      });
    })();
  }
  function buildEvalTable(cb) {
    var table = [TSV_HEADER];
    function addUserRecoms(res) {
      var recom = [
        res.user.id,
        res.user.name,
        res.recomUsers.length,
        res.minScore,
        res.maxScore
      ];
      //console.log("=> recom", recom);
      table.push(recom);
    }
    forEachUserRecom(addUserRecoms, function() {
      cb((cachedEvalTable = table));
    });
  }
  function gatherEvalTable(cb) {
    if (cachedEvalTable) cb(cachedEvalTable);
    else buildEvalTable(cb);
  }
  return {
    genTsv: function(cb) {
      gatherEvalTable(function(table) {
        var dataTable = new snip.DataTable();
        dataTable.table = table;
        console.log(
          'generated recommendations for ',
          nbUsersWithMatches,
          '/',
          totalUsers,
          'users'
        );
        cb({ tsv: dataTable.toTsv() });
      });
    },
    countClasses: function(nbClasses, cb) {
      gatherEvalTable(function(table) {
        console.log(
          'generated recommendations for ',
          nbUsersWithMatches,
          '/',
          totalUsers,
          'users'
        );
        var classes = [
          /* {gte:4, c:0}, {gte:3, c:0}, {gte:2, c:0}, {gte:1, c:0}, {gte:0, c:0} */
        ];
        for (var j = 0; j < nbClasses; ++j) classes.push(0);
        for (var i = table.length - 1; i > 0; --i) {
          console.log(table[i]);
          var nbRecoms = table[i][2];
          for (var j = 0; j < nbClasses; ++j)
            if (nbRecoms >= j) ++classes[j];
            else break; // => jump to next user of the recom table
        }
        cb(classes);
      });
    }
  };
}

//var trackBasedRecom = new RecomEvaluator(recomUsersByTracks);
var artistBasedRecom = new RecomEvaluator(recomUsersByArtists);

// sorting functions

function makeAlphaFieldSort(field) {
  return function(a, b) {
    if (a[field] < b[field]) return -1;
    if (a[field] > b[field]) return 1;
    return 0;
  };
}

// recommendation functions
/*
function recomUsersByTracks(uId, cb) {
	followModel.fetchUserSubscriptions(uId, function(userSub) {
		var followedIdSet = snip.objArrayToSet(userSub.subscriptions, "id", true);
		recomModel.recomUsersByTracks(uId, null, function(users){
			var users = snip.mapToObjArray(users);
			users.sort(function(a,b){
				return b.score - a.score;
			})
			for (var i in users) {
				users[i].posted = (users[i].posted || []).length;
				users[i].liked = (users[i].liked || []).length;
				users[i].liker = (users[i].liker || []).length;
				users[i].subscribed = !!followedIdSet[users[i].id];
			}
			cb(users);
		});
	});
}
*/
function recomUsersByArtists(uId, cb) {
  followModel.fetchUserSubscriptions(uId, function(userSub) {
    var followedIdSet = snip.objArrayToSet(userSub.subscriptions, 'id', true);
    recomModel.recomUsersByArtists(uId, null, function(users) {
      var users = snip.mapToObjArray(users);
      users.sort(function(a, b) {
        return b.score - a.score;
      });
      for (var i in users) {
        users[i].posted = (users[i].posted || []).length;
        users[i].liked = (users[i].liked || []).length;
        users[i].liker = (users[i].liker || []).length;
        users[i].subscribed = !!followedIdSet[users[i].id];
      }
      cb(users);
    });
  });
}

// file generators

var fileGenerators = {
  // bands to artists (called by /html/bandsToUsers.html)

  'bandsToUsers.json': function(p, cb) {
    var bands = (p.artists || '').split(/[,\n\r]+/g).map(function(band) {
      return [snip.normalizeArtistName(band)];
    });
    console.log('bands', bands);
    recomModel.matchingEngine.fetchUsersByArtists(bands, null, function(users) {
      var users = snip.mapToObjArray(users).map(function(user) {
        var artists = countOccurences(user.posted || []);
        user.score = artists.length; //(user.posted || []).length;
        user.artists = artists
          .map(function(artist) {
            return artist.id + ' (' + artist.c + ')';
          })
          .join(', ');
        delete user.posted;
        return user;
      });
      users.sort(function(a, b) {
        return b.score - a.score;
      });
      cb(users);
    });
  },
  'bandsToUsers.tsv': function(p, cb) {
    fileGenerators['bandsToUsers.json'](p, function(users) {
      var fields = ['id', 'name', 'score', 'artists'];
      cb({
        tsv: new snip.DataTable()
          .fromArray(
            users.map(function(user) {
              return fields.map(function(field) {
                return user[field];
              });
            }),
            fields
          )
          .toTsv()
      });
    });
  },
  'bandsToUsers.txt': wrapJsonGeneratorToText('bandsToUsers.json'),

  // stats about tracks

  'tracks.txt': function(p, cb) {
    gatherTrackAnalytics(function(map) {
      var trackNames = [];
      for (var eId in map) {
        var cleaned = snip.detectTrackFields(
          snip.cleanTrackName(map[eId].name)
        );
        if (cleaned /*!= map[eId].name*/)
          trackNames.push(cleaned + ' <- ' + map[eId].name);
      }
      cb(trackNames.join('\n'));
    });
  },
  'tracks.tsv': function(p, cb) {
    gatherTrackAnalytics(function(eIds) {
      cb({ tsv: new snip.DataTable().fromMap(eIds).toTsv() });
    });
  },
  'tracks.json': function(p, cb) {
    gatherTrackAnalytics(function(eIds, nb) {
      //snip.mapToObjArray(eIds, "eid");
      var postedTracks = snip
        .objArrayToValueArray(eIds, 'posts')
        .sort(snip.descSort);
      var likedTracks = snip
        .objArrayToValueArray(eIds, 'likes')
        .sort(snip.descSort);
      var interactedTracks = snip
        .objArrayToValueArray(eIds, 'interacted')
        .sort(snip.descSort);
      cb({
        quartiles: {
          postedTracks: jStat(postedTracks).quartiles(),
          likedTracks: jStat(likedTracks).quartiles(),
          interactedTracks: jStat(interactedTracks).quartiles()
        },
        nbPosts: nb,
        nbTracks: interactedTracks.length
        //eIds: Object.keys(eIds)
      });
    });
  },

  // stats about artists

  'artists.tsv': function(p, cb) {
    gatherArtistAnalytics(function(map) {
      var table = new snip.DataTable().fromMap(map);
      console.log('=>', table.table.length, 'artists');
      table.sort(makeAlphaFieldSort(0)); // order by name
      //table.sort(makeDescFieldSort(2)); // order by descending number of posts
      //table.sort(makeDescFieldSort(3)); // order by descending number of likes
      //table.sort(makeDescFieldSort(4)); // order by descending number of interactions (posts + likes)
      cb({ tsv: table.toTsv() });
    });
  },
  'artists.json': function(p, cb) {
    gatherArtistAnalytics(function(map, nb) {
      var posted = snip.objArrayToValueArray(map, 'posts').sort(snip.descSort);
      var liked = snip.objArrayToValueArray(map, 'likes').sort(snip.descSort);
      var interacted = snip
        .objArrayToValueArray(map, 'interacted')
        .sort(snip.descSort);
      console.log('=>', interacted.length, 'artists');
      cb({
        quartiles: {
          posted: jStat(posted).quartiles(),
          liked: jStat(liked).quartiles(),
          interacted: jStat(interacted).quartiles()
        },
        nbPosts: nb,
        nbArtists: interacted.length
      });
    });
  },
  /*
	// personalized user recommendations, for a given user

	"recomByTracks.json": function(p, cb) {
		recomUsersByTracks(p.loggedUser.id, cb);
	},
	"recomByTracks.tsv": function(p, cb) {
		recomUsersByTracks(p.uid || p.loggedUser.id, function(users){
			if (users) {
				cb({tsv: (new snip.DataTable()).fromMap(users).toTsv()});
			}
			else
				cb("error");
		});
	},
*/
  // apply recommendation algorithms on all users
  /*
	"evalRecomByTracks.tsv": function(p, cb) {
		trackBasedRecom.genTsv(cb);
	},
	"evalRecomByTracks.json": function(p, cb) {
		trackBasedRecom.countClasses(5, cb);
	},
*/
  'evalRecomByArtists.tsv': function(p, cb) {
    artistBasedRecom.genTsv(cb);
  },
  'evalRecomByArtists.json': function(p, cb) {
    artistBasedRecom.countClasses(5, cb);
  }
};

// main controller

exports.controller = FileController.buildController({
  controllerName: 'admin.recom',
  adminOnly: true,
  fileGenerators: fileGenerators
});
