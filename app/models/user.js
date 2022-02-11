/**
 * user model
 * fetch user information from mongodb
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var ObjectId = mongodb.ObjectId; //ObjectID.createFromHexString;
var postModel = require('../models/post.js');
var snip = require('../snip.js');

var crypto = require('crypto');

var USERNAME_REGEX = /^[a-z0-9]+[a-z0-9_\-.]+[a-z0-9]+$/i;
var USERNAME_MIN_LENGTH = 3;
var USERNAME_MAX_LENGTH = 18;
var USERNAME_RESERVED = {
  // blacklist of user urls
  'index.html': true,
  null: true,
  undefined: true,
  whyd: true,
  blog: true,
  music: true,
  playlist: true,
  playlists: true,
  about: true,
  'robots.txt': true,
  'favicon.ico': true,
  'favicon.png': true,
};

/*
var USER_FIELDS = {
  _id: true,
  bio: true,
  email: true,
  fbId: true,
  fbTok: true,
  handle: true,
  img: true,
  name: true,
  pl: true,
  pref: true,
  pub: 1,
  pwd: true,
  consent: true, // gdpr consent (boolean set to true when consent is given by user)
  lastFm: true,
};
// fields that should not be stored: id, mid, n
*/

// default user preferences
var defaultPref = (exports.DEFAULT_PREF = {
  // ui preferences
  hideBkAd: false, // hide the "add bookmaklet" side box on home page

  // email notification freq (7=weekly, 1=daily, 0=instantly, -1=never)
  emLik: -1, // "like" notif (default: never)
  emAdd: 0, // "re-add" notif (default: immediate)
  emSub: 0, // subscription notif (default: immediate)
  emSam: 1, // added same track(s) (default: daily)
  emCom: 0, // commented your track(s) (default: immediate)
  emMen: 0, // mentioned you in a comment (default: immediate)
  emRep: 0, // replied to your comment (default: immediate)
  emFrd: 0, // a friend joined whyd
  emAcc: 0, // a friend accepted your invite
  pendEN: 0, // pending email notifications
  //nextEN: Date()	// date of next digest
  //prevEN: Date()	// date of last digest

  // mobile/push notifications (0=enabled, -1=disabled)
  mnLik: -1, // "like" notif
  mnAdd: -1, // "re-add" notif
  mnSub: -1, // subscription notif
  mnSam: -1, // added same track(s)
  mnCom: -1, // commented your track(s)
  mnMen: -1, // mentioned you in a comment
  mnRep: -1, // replied to your comment
  mnFrd: -1, // a friend joined whyd
  mnAcc: -1, // a friend accepted your invite
  mnSnt: -1, // a friend sent you a track
  mnSnp: -1, // a friend sent you a playlist
});

exports.EM_FREQ_LABEL = {
  '-1': 'never',
  0: 'immediate',
  1: 'daily',
  7: 'weekly',
};

exports.EM_LABEL = {
  emLik: 'likes',
  emAdd: 're-posts',
  emSub: 'subscriptions',
  emSam: 'same tracks',
  emCom: 'comments',
  emMen: 'mentions',
  emRep: 'replies',
  emFrd: 'friends',
  emAcc: 'accepted invites',
};

(function parseHandlesFromRouteFile(routeFile) {
  // console.log('Parsing reserved usernames from', routeFile, '...');
  snip.forEachFileLine(routeFile, function (line) {
    if (typeof line != 'string') return; // console.log('=> Parsed', nb, 'handles from:', routeFile);
    line = line.substr(line.indexOf('/') + 1);
    var end = line.search(/[\t/]/);
    if (end > -1) {
      var handle = line.substr(0, end);
      if (handle.indexOf('{') == -1) {
        USERNAME_RESERVED[handle] = true;
      }
    }
  });
})('config/app.route');

(function parseHandlesFromTextFile(fileName) {
  // console.log('Parsing reserved usernames from', fileName, '...');
  snip.forEachFileLine(fileName, function (line) {
    if (typeof line != 'string') return; // console.log('=> Parsed', nb, 'handles from:', fileName);
    if (!line.length || line[0] == '#') return;
    USERNAME_RESERVED[line] = true;
  });
})('config/reservedwords.txt');

exports.validateName = function (name) {
  if (!name) return null;
  name = ('' + name).trim();
  if (name.length < 2) return { error: 'name is too short' };
  if (name.length > 32) return { error: 'name is too long' };
  return { name: name, ok: true };
};

// turn a string to lower case, removes accents and simplify white space, to improve full-text search
exports.normalizeName = function (origName) {
  return origName
    .toLowerCase()
    .replace(/[àáâãäåāąă]/g, 'a')
    .replace(/[çćčĉċ]/g, 'c')
    .replace(/[ďđð]/g, 'd')
    .replace(/[èéêëēęěĕė]/g, 'e')
    .replace(/[ƒſ]/g, 'f')
    .replace(/[ĝğġģ]/g, 'g')
    .replace(/[ĥħ]/g, 'h')
    .replace(/[ìíîïīĩĭįı]/g, 'i')
    .replace(/[ĳĵ]/g, 'j')
    .replace(/[ķĸ]/g, 'k')
    .replace(/[łľĺļŀ]/g, 'l')
    .replace(/[ñńňņŉŋ]/g, 'n')
    .replace(/[òóôõöøōőŏœ]/g, 'o')
    .replace(/[Þþ]/g, 'p')
    .replace(/[ŕřŗ]/g, 'r')
    .replace(/[śšşŝș]/g, 's')
    .replace(/[ťţŧț]/g, 't')
    .replace(/[ùúûüūůűŭũų]/g, 'u')
    .replace(/[ŵ]/g, 'w')
    .replace(/[ýÿŷ]/g, 'y')
    .replace(/[žżź]/g, 'z')
    .replace(/[æ]/g, 'ae')
    .replace(/[ÀÁÂÃÄÅĀĄĂ]/g, 'A')
    .replace(/[ÇĆČĈĊ]/g, 'C')
    .replace(/[ĎĐÐ]/g, 'D')
    .replace(/[ÈÉÊËĒĘĚĔĖ]/g, 'E')
    .replace(/[ĜĞĠĢ]/g, 'G')
    .replace(/[ĤĦ]/g, 'H')
    .replace(/[ÌÍÎÏĪĨĬĮİ]/g, 'I')
    .replace(/[Ĵ]/g, 'J')
    .replace(/[Ķ]/g, 'K')
    .replace(/[ŁĽĹĻĿ]/g, 'L')
    .replace(/[ÑŃŇŅŊ]/g, 'N')
    .replace(/[ÒÓÔÕÖØŌŐŎ]/g, 'O')
    .replace(/[ŔŘŖ]/g, 'R')
    .replace(/[ŚŠŞŜȘ]/g, 'S')
    .replace(/[ÙÚÛÜŪŮŰŬŨŲ]/g, 'U')
    .replace(/[Ŵ]/g, 'W')
    .replace(/[ÝŶŸ]/g, 'Y')
    .replace(/[ŹŽŻ]/g, 'Z')
    .replace(/[ß]/g, 'ss')
    .replace(/\W+/g, ' ');
};

exports.md5 = function (data) {
  return crypto.createHash('md5').update(data).digest('hex');
};

// make sure user prefs are set with default values, if not set manually yet
function processUserPref(user) {
  user.pref = user.pref || {}; //defaultPref;
  for (let i in defaultPref)
    user.pref[i] =
      user.pref[i] === undefined || user.pref[i] === null
        ? defaultPref[i] // default is better than null/undefined value
        : typeof defaultPref[i] == 'boolean'
        ? !!user.pref[i]
        : user.pref[i]; // type existing values accordingly to defaults
  return user;
}

exports.processUser = processUserPref;

function processUsers(list) {
  for (let i in list) if (list[i]) processUserPref(list[i]);
}

function fetch(q, handler) {
  // snip.console.log('fetching user ', q, '...');
  if (q._id && typeof q._id == 'string') q._id = ObjectId(q._id);
  mongodb.collections['user'].findOne(q, function (err, user) {
    if (user) {
      user.id = '' + user._id;
      user.mid = '/u/' + user.id;
      processUsers([user]);
    }
    handler(err, user);
  });
}

exports.fetchAll = function (handler) {
  mongodb.collections['user'].find(
    {},
    { sort: [['_id', 'desc']] },
    function (err, cursor) {
      cursor.toArray(function (err, array) {
        processUsers(array);
        handler(array);
      });
    }
  );
};

exports.fetchMulti = function (q, options, handler) {
  if (q._id && typeof q._id == 'string') q._id = ObjectId(q._id);
  if (q._id && typeof q._id == 'object')
    // $in:[]
    for (let i in q._id)
      if (i == '$in')
        for (let j in q._id['$in'])
          q._id['$in'][j] = ObjectId('' + q._id['$in'][j]);
  mongodb.collections['user'].find(q, options || {}, function (err, cursor) {
    cursor.toArray(function (err, array) {
      processUsers(array);
      handler(array);
    });
  });
};

exports.fetchByUid = exports.model = function (uid, handler) {
  if (typeof uid == 'string') uid = ObjectId(uid);
  fetch({ _id: uid }, function (err, user) {
    if (err) console.error(err);
    handler(user);
  });
};

exports.fetchByHandle = function (handle, handler) {
  fetch({ handle: handle }, function (err, user) {
    if (err) console.error(err);
    handler(user);
  });
};

exports.fetchByFbUid = function (fbUid, handler) {
  if (typeof fbUid != 'string') fbUid = fbUid.toString();
  fetch({ fbId: fbUid }, function (err, user) {
    handler(user);
  });
};

exports.fetchByEmail = function (email, handler) {
  fetch({ email }, function (err, user) {
    if (err) console.error(err);
    handler(user);
  });
};

exports.fetchInvitedUsers = function (uid, handler) {
  mongodb.collections['user'].find({ iBy: '' + uid }, function (err, cursor) {
    if (err) console.error(err);
    cursor.toArray(function (err, array) {
      if (err) console.error(err);
      processUsers(array);
      handler(array);
    });
  });
};

exports.updateAndFetch = function (criteria, update, opts, cb) {
  console.log('models.user.update criteria', criteria);
  mongodb.collections['user'].updateOne(
    criteria,
    /*{$set:*/ update /*}*/,
    opts || {},
    function (err) {
      if (err) console.error(err);
      fetch(criteria, function (err2, user) {
        if (err2) console.error(err2);
        if (user) mongodb.cacheUser(user);
        cb && cb(err || err2, user);
      });
    }
  );
};

// used for updating fb id/token, settings prefs, unsubscribing from newsletter, and delete cvrImg
exports.update = function (uid, update, handler) {
  exports.updateAndFetch(
    { _id: ObjectId('' + uid) },
    update,
    null,
    function (err, user) {
      handler && handler(user);
    }
  );
};

exports.save = function (pUser, handler) {
  var uid = pUser._id || pUser.id;
  var criteria = uid
    ? { _id: typeof uid == 'string' ? ObjectId(uid) : uid }
    : { email: pUser.email };
  var user = pUser;
  delete user._id;
  if (user.name) user.n = exports.normalizeName(user.name);
  // console.log(
  //   'models.user.save : ',
  //   Object.keys(user),
  //   '=> criteria: ',
  //   criteria
  // );
  mongodb.collections['user'].updateOne(
    criteria,
    { $set: user },
    { upsert: true },
    function (err) {
      //console.log("updated user => item ", item);
      if (err) console.log(err);
      fetch(criteria, function (err, user) {
        if (err) console.error(err);
        //console.log("user stored as ", user);
        mongodb.cacheUser(user);
        if (handler) handler(user);
      });
    }
  );
};

exports.delete = function (criteria, handler) {
  criteria = criteria || {};
  if (criteria._id) {
    criteria._id = ObjectId('' + criteria._id);
    fetch(criteria, function (err, user) {
      if (err) console.error(err);
      if (!user) return handler && handler({ error: 'user not found' });
      // delete playlists from index
      if (user.pl)
        (function next() {
          if (!user.pl.length) console.log('done deleting user playlists');
          else {
            var pl = user.pl.pop() || {};
            console.log(
              'deleting user playlists',
              user._id + '_' + pl.id,
              pl.name
            );
            // todo: delete playlist cover image file
          }
        })();
      // delete user
      mongodb.collections['user'].deleteOne(criteria, function (err, item) {
        if (err) console.error(err);
        else console.log('removed users', criteria);
        delete mongodb.usernames['' + criteria._id];
        if (handler) handler(criteria, item);
        // todo: delete user avatar file
      });
      // TODO: delete tracks
    });
  } else if (handler) handler({ error: '_id not found' });
};

// signup list (from landing)

exports.fetchEmail = function (email, callback) {
  mongodb.collections['email'].findOne({ _id: email }, callback);
};

exports.deleteEmails = function (emailArray, callback) {
  mongodb.collections['email'].deleteMany(
    { _id: { $in: emailArray } },
    callback
  );
};

exports.storeEmail = function (email) {
  mongodb.collections['email'].save({ _id: email, date: new Date() }, { w: 0 });
};

// playlist management

exports.fetchPlaylist = function (uId, plId, cb) {
  console.log('user.fetchPlaylist', uId, plId);
  exports.fetchByUid(uId, function (user) {
    if (user && user.pl && user.pl.length)
      for (let i in user.pl) {
        if (user.pl[i].id == plId) return cb(user.pl[i]);
      }
    else if (cb) cb();
  });
};

exports.hasPlaylistName = function (user, name) {
  console.log('user.hasPlaylist', (user || {}).id, name);
  if (!user && user.id != null)
    console.error('null user provided in user.hasPlaylist');
  else if (user.pl && user.pl.length)
    for (let i in user.pl) if (user.pl[i].name == name) return user.pl[i];
  return false;
};

exports.hasPlaylistNameByUid = function (uId, name, cb) {
  exports.fetchByUid(uId, function (user) {
    cb(exports.hasPlaylistName(user, name));
  });
};

exports.createPlaylist = function (uId, name, handler) {
  // console.log('user.createPlaylist', uId, name);
  fetch({ _id: uId }, function (err, user) {
    user.pl = user.pl || [];
    var pl = {
      id: user.pl.length > 0 ? parseInt(user.pl[user.pl.length - 1].id) + 1 : 0,
      name: name,
    };
    user.pl.push(pl);
    exports.save(user, function () {
      // console.log('created playlist:', pl.name, pl.id);
      handler(pl);
    });
  });
};

exports.setPlaylist = function (uId, plId, upd, handler) {
  upd = upd || {};
  console.log('user.setPlaylist', uId, plId, upd);
  fetch({ _id: '' + uId }, function (err, user) {
    var found = true;
    user.pl = user.pl || [];
    for (let i in user.pl)
      if ('' + user.pl[i].id == '' + plId) {
        found = user.pl[i]; // = {id:plId, name:plName};
        if (upd.name) user.pl[i].name = upd.name;
        if (upd.fbId) user.pl[i].fbId = upd.fbId;
        break;
      }
    if (found) {
      exports.save(user, function () {
        console.log('updated playlist => ', found);
        if (handler) handler(found);
        if (upd.name) {
          console.log(
            'updating playlist name in index and corresponding tracks...'
          );
          postModel.setPlaylist(uId, plId, upd.name, function () {
            /* do nothing */
          });
        }
      });
    } else if (handler) handler();
  });
};

exports.renamePlaylist = function (uId, plId, plName, handler) {
  exports.setPlaylist(uId, plId, { name: plName }, handler);
};
/*
exports.setPlaylistImg = function(uId, plId, img, cb) {
	console.log("user.setPlaylistImg", uId, plId, img);
	fetch({_id:uId}, function(err, user) {
		var found = true;
		user.pl = user.pl || [];
		for (let i in user.pl)
			if (""+user.pl[i].id == ""+plId) {
				if (img || img.indexOf("blank") == -1)
					user.pl[i].img = img;
				else
					delete user.pl[i].img;
				found = user.pl[i];
				break;
			}
		if (found)
			exports.save(user, function() {
				cb(found);
			});
		else if (cb)
			cb();
	});
}
*/
exports.deletePlaylist = function (uId, plId, handler) {
  console.log('user.deletePlaylist', uId, plId);
  fetch({ _id: uId }, function (err, user) {
    var newPl = [];
    user.pl = user.pl || [];
    for (let i in user.pl)
      if ('' + user.pl[i].id != '' + plId) newPl.push(user.pl[i]);
    postModel.unsetPlaylist(uId, plId, function () {
      user.pl = newPl;
      exports.save(user, function () {
        console.log(
          'deleted playlist (and updated corresponding tracks):',
          plId
        );
        handler(plId);
      });
    });
  });
  // TODO: delete image file
};

// === USER PREFS

function daysToMillisecs(freq) {
  return freq * 24 * 60 * 60 * 1000;
}

function msToDigestTimestamp(date) {
  return new Date(date);
}

exports.getEmailNotifsFreq = function (user) {
  var freq = -1; // daily (by default)
  for (let i in user.pref)
    if (i.indexOf('em') == 0) freq = Math.max(freq, user.pref[i]);
  return freq;
};

exports.incrementNotificationCounter = function (uId, handler) {
  //console.log("user.incrementNotificationCounter:", uId);
  mongodb.collections['user'].updateOne(
    { _id: ObjectId('' + uId) },
    { $inc: { 'pref.pendEN': 1 } },
    function (err, item) {
      if (err) console.error(err);
      handler && handler(err ? { error: err } : item);
    }
  );
};

exports.setPref = function (uId, pref, handler) {
  console.log('user.setPref', uId, pref);
  if (!pref) handler({ error: 'Invalid preferences' });
  else {
    var cleanPref = {},
      emailFreq = 0;
    for (let i in defaultPref)
      if (pref[i] !== undefined && pref[i] !== null) {
        // only clean provided pref values
        cleanPref['pref.' + i] =
          typeof defaultPref[i] == 'boolean' ? !!pref[i] : pref[i]; // type each value accordingly to defaults
        if (i.indexOf('em') == 0)
          // enabled email notification => set next notification date
          emailFreq = Math.max(emailFreq, parseInt('' + pref[i]));
      }
    if (emailFreq > 0) {
      var now = new Date().getTime();
      cleanPref['pref.prevEN'] = msToDigestTimestamp(now);
      cleanPref['pref.nextEN'] = msToDigestTimestamp(
        now + daysToMillisecs(emailFreq)
      );
      exports.update(uId, { $set: cleanPref }, handler);
    } else
      exports.update(
        uId,
        { $set: cleanPref, $unset: { 'pref.prevEN': 1, 'pref.nextEN': 1 } },
        handler
      );
  }
};

// === OTHER METHODS

exports.setTwitterId = function (uId, twId, twTok, twSec, cb) {
  console.log('user.setTwitterId', uId, twId);
  if (!uId) return cb && cb({ error: 'invalid parameters' });
  else if (!twId)
    // disconnect twitter account
    mongodb.collections['user'].updateOne(
      { _id: ObjectId('' + uId) },
      { $unset: { twId: '', twTok: '', twSec: '' } },
      function (err, success) {
        cb && cb(err || !success ? { error: err } : { ok: success });
      }
    );
  else if (!twTok || !twSec) return cb && cb({ error: 'invalid parameters' });
  else
    fetch({ twId: twId }, function (err, user) {
      if (user && user._id != uId)
        cb &&
          cb({
            error: 'This Twitter account is already associated to another user',
          });
      else
        exports.save({ _id: uId, twId: twId, twTok: twTok, twSec: twSec }, cb);
    });
};

exports.setHandle = function (uId, username, handler) {
  console.log('user.setHandle', uId, username);
  function res(result) {
    console.log('user.setHandle response: ', result);
    handler && handler(result);
  }
  if (!username) return res({ error: 'You must enter a username' });
  username = ('' + username).trim().toLowerCase();
  if (username.length < USERNAME_MIN_LENGTH)
    return res({
      error: 'Must be at least ' + USERNAME_MIN_LENGTH + ' characters long',
    });
  if (username.length > USERNAME_MAX_LENGTH)
    return res({
      error: 'Must be less than ' + USERNAME_MAX_LENGTH + ' characters long',
    });
  if (!USERNAME_REGEX.test(username))
    return res({ error: 'Special characters are not allowed' });
  if (!isNaN(username)) return res({ error: 'Numbers are not allowed' });
  if (USERNAME_RESERVED[username])
    return res({ error: 'This username is reserved' });

  exports.fetchByHandle(username, function (user) {
    if (user && '' + user._id != '' + uId)
      res({ error: 'This username is taken by another user' });
    else
      fetch({ _id: uId }, function (err, user) {
        if (err) return res({ error: err });
        user.handle = username;
        exports.save(user, function () {
          console.log('updated username', uId, username);
          handler({ ok: 1, user: user, username: username, handle: username });
        });
      });
  });
};

exports.renameUser = function (uid, name, callback) {
  function whenDone() {
    console.log('renameUser last step: save the actual user record');
    exports.save({ _id: uid, name: name }, callback);
  }
  var cols = ['follow', 'post'];
  uid = '' + uid;
  var user = mongodb.getUserFromId(uid);
  var oldName = (user || {}).name;
  if (!user) callback({ error: 'renameUser error: user not found' });
  else if (oldName == name) callback({});
  // nothing to do
  else
    (function next() {
      var col;
      if (!(col = cols.pop())) return whenDone();
      console.log('renameUser: processing collection', col, '...');
      col = mongodb.collections[col];
      col.countDocuments(
        { $or: [{ uId: uid }, { tId: uid }] },
        function (err, count) {
          console.log('renameUser: processing', count, 'items...');
          col.updateMany(
            { uId: uid /*, uNm: oldName*/ },
            { $set: { uNm: name } },
            { multi: true },
            function (err) {
              if (err) console.log('err', err);
              //console.log("-> updated to ", result);
              col.updateMany(
                { tId: uid /*, tNm: oldName*/ },
                { $set: { tNm: name } },
                { multi: true },
                function (err) {
                  if (err) console.log('err', err);
                  //console.log("-> updated to ", result);
                  next();
                }
              );
            }
          );
        }
      );
    })();
};

exports.fetchUserFields = function (subList, attrToCopy, cb) {
  var uidList = [];
  if (subList) for (let i in subList) uidList.push(subList[i].id);
  if (uidList.length) {
    var attrSet = snip.arrayToSet(attrToCopy, 1);
    exports.fetchMulti(
      { _id: { $in: uidList } },
      { fields: attrSet },
      function (userList) {
        var uidSet = {};
        //console.log(userList);
        if (userList)
          for (let i in userList) uidSet['' + userList[i]._id] = userList[i];
        for (let i in subList)
          for (let j in attrToCopy)
            if (subList[i] && uidSet[subList[i].id])
              subList[i][attrToCopy[j]] = uidSet[subList[i].id][attrToCopy[j]];
        cb(subList);
      }
    );
  } else cb();
};

exports.fetchUserBios = function (subList, cb) {
  exports.fetchUserFields(subList, ['name', 'bio'], cb);
};

exports.fetchPlaylists = function (user, params, cb) {
  var pl = (user || {}).pl || [];
  var uId = (user || {}).id;
  mongodb.collections['post'].aggregate(
    [{ $match: { uId: uId } }, { $group: { _id: '$pl.id', c: { $sum: 1 } } }],
    function (err, cursor) {
      if (err) console.error(err);
      cursor.toArray(function (err, counts) {
        if (err) console.error(err);
        var plCount = {}; //snip.objArrayToSet(counts, "_id"); // => {plId -> {_id: plId, c: nbTracks}}
        counts.map(function (counter) {
          // necessary to make a sum, because playlist ids can be both stored as int and string
          plCount['' + counter._id] =
            (plCount['' + counter._id] || 0) + counter.c;
        });
        cb(
          pl.reverse().map(function (p) {
            p.url = '/u/' + uId + '/playlist/' + p.id;
            p.nbTracks = plCount['' + p.id] || 0;
            return p;
          })
        );
      });
    }
  );
  /*
	function handlePlaylist(playlist, countNext) {
		var plUid = playlist.collabId ? null : uId;
		var plId = playlist.collabId || playlist.id;
		postModel.countPlaylistPosts(plUid, plId, function(count) {
			playlist.nbTracks = count;
			// if (count && count > 0)
			// 	postModel.fetchPlaylistPosts(plUid, plId, {limit:2}, function(posts) {
			// 		playlist.lastPosts = posts;
			// 		countNext();
			// 	});
			// else
				countNext();
		});
	}
	// collabModel.fetchPlaylistsByUid(uId, function(playlists){
	// 	for(var i in playlists)
	// 		pl.push({
	// 			collabId: playlists[i]._id,
	// 			name: playlists[i].name,
	// 			url: "/playlist/" + playlists[i]._id
	// 		});
		snip.forEachArrayItem((pl || []).reverse(), handlePlaylist, cb);
	//});
	*/
};
