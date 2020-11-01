var config = require('./config.js');
var mongodb = require('./mongodb.js');
var snip = require('../snip.js');

var postModel = {
  forEachPost: function (q, p, handler) {
    mongodb.collections['post'].find(q, p, function (err, cursor) {
      cursor.forEach(function (err, track) {
        if (err)
          // we're done
          console.log('recom.forEachPost error:', err);
        handler(track);
      });
    });
  },
};

function countOccurences(array) {
  var count = {};
  for (let j in array) count[array[j]] = (count[array[j]] || 0) + 1;
  return snip.mapToObjArray(count, 'id', 'c').sort(function (a, b) {
    return b.c - a.c;
  });
}

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
      for (let fct; (fct = whenReady.pop()); fct());
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

  return {
    init: populateIndex,
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
        for (let i in artistList) {
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
    fetchUsersByArtists: function (myArtists, options = {}, cb) {
      waitForIndex(function () {
        var recomUsers = {};
        var excludedUid = snip.arrayToSet(options.excludeUids || []);
        for (let artist in myArtists) {
          artist = myArtists[artist][0];
          var users = usersByArtist[artist];
          for (let u in users) {
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
        cb(recomUsers);
      });
    },
    /**
     * returns { uId: {manisnotabird:4, ...} }
     **/
    fetchCommonArtists: function (uId, options = {}, cb) {
      options.excludeUids = (options.excludeUids || []).concat(['' + uId]);
      waitForIndex(() =>
        this.fetchUsersByArtists(artistsByUser[uId], options, cb)
      );
    },
  };
})();

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
    for (let i in users) {
      var commonArtists = (users[i].posted || [])
        .concat(users[i].liked || [])
        .concat(users[i].liker || []);
      var bestArtists = countOccurences(commonArtists);
      users[i].artistNames = [];
      bestArtists = bestArtists.map(function (artist) {
        return {
          name: exports.matchingEngine.getArtistName(artist.id),
        };
      });
      for (let j in bestArtists) {
        var artist = bestArtists[j];
        if (artist && artist.name)
          users[i].artistNames.push(bestArtists[j].name);
      }
      users[i].score = ((users[i].posted || []).length * 1) / nbArtists;
    }
    cb(users);
  });
};
