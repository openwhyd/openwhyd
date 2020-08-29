/**
 * plTags model
 * allows tab-based navigation, based on names of playlist in which tracks are stored
 * @author: adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('../models/mongodb.js');

var TWO_WEEKS = 6 * 7 * 24 * 60 * 60 * 1000;

/**
 * transforms [tag1, tag1, tag2] into [{id:tag1, c:2}, {id:tag2, c:1}]
 **/
function countOccurences(array, valueSet, coef) {
  var count = {};
  for (var j in array) {
    var incr = !valueSet || !valueSet[array[j]] ? 1 : coef || 0;
    count[array[j]] = (count[array[j]] || 0) + incr;
  }
  return snip.mapToObjArray(count, 'id', 'c').sort(function (a, b) {
    return b.c - a.c;
  });
}

var MIN_SCORE_FOR_TAGGED_USER = 0;

var PHRASE_BLACKLIST = {
  'daft punk': true, // because daft punk != punk
};

exports.ORDERED_GENRES = [
  { name: 'Electro' },
  { name: 'Hip hop' },
  { name: 'Indie' },
  { name: 'Folk' },
  { name: 'Rock' },
  { name: 'Punk' },
  { name: 'Metal' },
  { name: 'Blues' },
  { name: 'R&B' },
  { name: 'Soul' },
  { name: 'Jazz' },
  { name: 'Classical' },
  { name: 'Reggae' },
  { name: 'Pop' },
  { name: 'Latin' },
  { name: 'World' },
];

for (var i in exports.ORDERED_GENRES)
  exports.ORDERED_GENRES[i].id = exports.ORDERED_GENRES[i].name
    .toLowerCase()
    .replace('&', 'n')
    .replace(' ', '-');

var GENRES_WITH_SYNONYMS = {
  Reggae: ['reggae', 'dancehall', 'roots', 'ska', 'rocksteady', 'ragga'],
  Latin: [
    'latin',
    'salsa',
    'caliente',
    'paso doble',
    'meringue',
    'bossa nova',
    'reggaeton',
    'flamenco',
  ],
  Punk: ['punk', 'screamo', 'post-hardcore', 'straight edge'],
  Metal: ['metal'],
  Electro: [
    'electro',
    'electronica',
    'electronique',
    'dance',
    'techno',
    'beats',
    'idm',
  ],
  Blues: ['blues'],
  Classical: ['classical', 'classique', 'baroque', 'opera', 'piano', 'violin'],
  'Hip hop': ['hip hop', 'hip-hop', 'hiphop', 'rap', 'swag', 'gangsta'],
  Indie: ['indie', 'independant'],
  Jazz: ['jazz', 'swing'],
  Soul: ['soul', 'funk'],
  'R&B': ['r&b', 'rnb', 'rhythm and blues', 'rhythm & blues'],
  Rock: ['rock', 'post-rock', 'emo'],
  World: ['world', 'africa', 'arabic', 'ethnic', 'gypsy', 'indian'],
  Folk: [
    'folk',
    'blue grass',
    'bluegrass',
    'blue-grass',
    'acoustic',
    'country',
    'americana',
    'celtic',
    'acoustic',
  ],
  Pop: ['pop', 'variety', 'variétés'],
};

var tagSynonyms = {};
for (var tag in GENRES_WITH_SYNONYMS)
  for (var syn in GENRES_WITH_SYNONYMS[tag])
    tagSynonyms[GENRES_WITH_SYNONYMS[tag][syn]] = tag;

exports.extractGenreTags = function (plName) {
  var tags = [];
  if (plName)
    snip
      .removeAccents(plName.toLowerCase())
      .split(/[^\-a-z 1-3&]+/g)
      .map(function (phrase) {
        if (!PHRASE_BLACKLIST[phrase])
          for (var synonym in tagSynonyms)
            if (phrase.indexOf(synonym) > -1) {
              tags.push(tagSynonyms[synonym]);
              break;
            }
      });
  return tags;
};

/**
 * maintains and checks against an associative array of tags.
 * strings are turned into tags by following formatting/normalization rules. synonyms are supported.
 **/
exports.tagEngine = new (function TagEngine() {
  this.tags = {}; // tag -> {c:int}
  this.plIdToTags = {}; // plId -> [tag]
  this.eidToTags = null; // eId -> [tag]
  this.uidToTagSet = {}; // uId -> {tag -> nb}, including a "_t" tag that contains the total number of tagged tracks
  this.initializing = false;
  this.totalPosts = 0;

  function appendUrl(tagObj) {
    if (tagObj.id) tagObj.url = '/genre/' + tagObj.id.replace(/\s+/g, '-');
    return tagObj;
  }

  var initFcts = [
    (/*importTagsFromPl*/ cb) => {
      var t0 = new Date();
      console.log('plTags.tagEngine: building playlists list...');
      var nbPl = 0,
        nbPlWithTags = 0,
        nbUsersWithPl = 0;
      mongodb.forEach(
        'user',
        { q: { pl: { $exists: true } }, fields: { _id: 1, pl: 1 } },
        (user) => {
          ++nbUsersWithPl;
          for (var i in user.pl) {
            ++nbPl;
            var tags = exports.extractGenreTags(user.pl[i].name);
            if (tags.length) {
              ++nbPlWithTags;
              for (var t in tags) {
                (this.tags[tags[t]] = this.tags[tags[t]] || { c: 0 }).c++;
              }
              this.plIdToTags['' + user._id + '_' + user.pl[i].id] = tags;
            }
          }
        },
        () => {
          console.log(
            'plTags.tagEngine => extracted tags from',
            nbPlWithTags,
            '/',
            nbPl,
            'playlists, from',
            nbUsersWithPl,
            'users, in',
            (new Date() - t0) / 1000,
            'seconds'
          );
          cb();
        }
      );
    },
    (/*buildTagIndex*/ cb) => {
      var t0 = new Date();
      console.log('plTags.tagEngine: indexing eId-tags from playlist names...');
      var eidToTags = (this.eidToTags = {});
      mongodb.forEach(
        'post',
        {
          q: { 'pl.id': { $exists: true } },
          fields: { _id: 0, pl: 1, eId: 1, uId: 1 },
        },
        (post) => {
          var tags = this.plIdToTags['' + post.uId + '_' + post.pl.id];
          if (tags && tags.length)
            eidToTags[post.eId] = (eidToTags[post.eId] || []).concat(tags);
        },
        () => {
          console.log(
            'plTags.tagEngine => indexed ',
            Object.keys(this.eidToTags).length,
            'eId-tags from playlist names, in',
            (new Date() - t0) / 1000,
            'seconds'
          );
          cb();
        }
      );
    },
    (/*buildUserIndex*/ cb) => {
      var t0 = new Date();
      console.log('plTags.tagEngine: indexing users for each tag...');
      var query = {
        q: {
          _id: {
            $gt: mongodb.ObjectId(
              mongodb.dateToHexObjectId(new Date(t0 - TWO_WEEKS))
            ),
          },
        }, // posted within the last two weeks
        fields: { _id: 0, eId: 1, uId: 1 },
        sort: [['_id', 'desc']],
      };
      mongodb.forEach(
        'post',
        query,
        (post) => {
          if (post.uId) {
            ++this.totalPosts;
            var userTagSet = (this.uidToTagSet[post.uId] = this.uidToTagSet[
              post.uId
            ] || {
              _t: 0, // total number of tagged tracks
            });
            userTagSet['_t']++;
            var eidTags = this.eidToTags[post.eId] || [];
            //var processedTags = {};
            eidTags.map((tag) => {
              userTagSet[tag] = userTagSet[tag] || {
                c: 0, // total weight of tag for this user (can be >1 for one track)
                //	n: 0, // number of tracks posted by user with this tag => sum(n) == userTagSet._t
                //	_l: post._id // id of last track posted by user with this tag
              };
              userTagSet[tag].c += 1;
              //userTagSet[tag].n += 1 / eidTags.length; //processedTags[tag] ? 0 : 1;
              //processedTags[tag] = true;
            });
          }
        },
        () => {
          console.log(
            'plTags.tagEngine => indexed',
            Object.keys(this.uidToTagSet).length,
            'users from',
            this.totalPosts,
            'posts, in',
            (new Date() - t0) / 1000,
            'seconds'
          );
          cb();
        }
      );
    },
  ];

  this.init = (cb) => {
    this.initializing = true;
    const next = () => {
      if (initFcts.length) initFcts.shift()(next);
      else {
        this.initializing = false;
        cb && cb(this);
      }
    };
    next();
  };

  this.waitForIndex = (cb) => {
    if (this.eidToTags) cb(this);
    else if (!this.initializing) this.init(cb);
    else
      var interval = setInterval(() => {
        if (this.eidToTags) {
          clearInterval(interval);
          cb(this);
        } else console.log('still waiting for tag index to be ready...');
      }, 1000);
  };

  this.addPost = (post, cb) => {
    if (this.eidToTags && post && post.eId && post.uId) {
      // 1) index playlist
      if ((post.pl || {}).id != undefined) {
        var plId = '' + post.uId + '_' + post.pl.id;
        var tags = exports.extractGenreTags(post.pl.name);
        if (tags && tags.length) {
          for (var t in tags) {
            (this.tags[tags[t]] = this.tags[tags[t]] || { c: 0 }).c++;
          }
          this.plIdToTags[plId] = tags;

          // 2) add tag(s) to this eId
          this.eidToTags[post.eId] = (this.eidToTags[post.eId] || []).concat(
            tags
          );
          // todo: prevent an edited (existing) track from being re-tagged
          // todo: remove duplicates from eidToTags?
        }
      }

      // 3) associate tag(s) to the user
      ++this.totalPosts;
      var userTagSet = (this.uidToTagSet[post.uId] = this.uidToTagSet[
        post.uId
      ] || {
        _t: 0, // total number of posts per user
      });
      userTagSet['_t']++;
      (this.eidToTags[post.eId] || []).map((tag) => {
        userTagSet[tag] = userTagSet[tag] || {
          c: 0, // total weight of tag for this user (can be >1 for one track)
        };
        userTagSet[tag].c += 1;
      });
    }
    if (cb) cb();
  };

  this.getTagsByEid = (eId) => {
    return countOccurences((this.eidToTags || {})[eId] || []).map(appendUrl);
  };

  const sum = (a, b) => a + b;

  this.getUsersByTags = (tags) => {
    if (!tags || !tags.length)
      // prevent reduce() from crashing because of empty array
      return [];

    // 1) init ranges

    var maxQuantity = 0;

    const evalQuantity = (userTagSet) => {
      return tags.map((tag) => (userTagSet[tag] || {}).c || 0).reduce(sum);
    };

    for (var uId in this.uidToTagSet) {
      var userTagSet = this.uidToTagSet[uId];
      maxQuantity = Math.max(maxQuantity, evalQuantity(userTagSet));
    }

    console.log('quantity range:', 0, '-', maxQuantity);

    // 2) score users

    const scoreUserAgainstTags = (uId) => {
      var tagSet = snip.arrayToSet(tags);
      var user = mongodb.getUserFromId(uId);
      var userTags = snip.objArrayToValueArray(
        this.getBestTagsByUid(uId) || [],
        'id'
      ); // this tagset is sorted by descending tag count
      if (
        !user ||
        !user.img ||
        user.img.indexOf('blank') != -1 ||
        !userTags ||
        !userTags.length
      )
        return 0;

      var steps = [
        // 1) evaluate "top tags" score
        (() => {
          var score = 0;
          var nbTopTags = Math.min(tags.length, userTags.length);
          for (var i = 0; i < nbTopTags; ++i)
            if (tagSet[userTags[i]]) score += Math.pow(2, tags.length - i - 1);
          var denom = Math.pow(2, tags.length) - 1;
          //if (score/denom > 0.5)
          //	console.log(uId, user.name, userTags.slice(0,3), "=>", score + "/" + denom, score/denom);
          return score / denom; // e.g. 4/7 + 2/7 + 1/7 if all top tags are first
        })(),
        // 2) evaluate "top tags" score
        (() => {
          var score = evalQuantity(this.uidToTagSet[uId]) / maxQuantity;
          //if (score > 0.2)
          //	console.log(uId, user.name, score);
          return score;
        })(),
      ];

      return (2 * steps[0] + 1 * steps[1]) / 3; //steps.reduce(sum) / steps.length; // compute mean of scores
    };

    var users = [];
    for (let uId in this.uidToTagSet) {
      var userScore = scoreUserAgainstTags(uId, tags);
      if (userScore > MIN_SCORE_FOR_TAGGED_USER)
        users.push({
          id: uId,
          name: mongodb.getUserNameFromId(uId),
          score: userScore,
        });
    }

    //console.log("proportion range:", minProportion, '-', maxProportion);

    return users.sort((a, b) => b.score - a.score);
  };

  this.getBestTagsByUid = (uId) => {
    var tags = [];
    for (var tag in this.uidToTagSet[uId])
      if (tag != '_t')
        tags.push({
          id: tag,
          c: this.uidToTagSet[uId][tag].c,
          url: '/genre/' + tag.replace(/\s+/g, '-'),
        });
    return tags.sort((a, b) => b.c - a.c);
  };

  this.fetchTagsByUid = (uId, cb) => {
    if (!this.eidToTags) cb();
    else cb(this.getBestTagsByUid(uId));
  };
})();

//exports.tagEngine.init();

exports.getTagEngine = function (cb) {
  exports.tagEngine.waitForIndex(cb);
};
