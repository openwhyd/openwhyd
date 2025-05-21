//@ts-check
/**
 * user model
 * fetch user information from mongodb
 * @author adrienjoly, whyd
 **/

/**
 * @typedef {import('../infrastructure/mongodb/types').UserDocument} UserDocument
 */

const mongodb = require('../models/mongodb.js');
const { ObjectId } = mongodb;
const emailModel = require('../models/email.js');
const postModel = require('../models/post.js');
const searchModel = require('../models/search.js');
const snip = require('../snip.js');

const crypto = require('crypto');

const USERNAME_REGEX = /^[a-z0-9]+[a-z0-9_\-.]+[a-z0-9]+$/i;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 18;
const USERNAME_RESERVED = {
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
  iphone: true,
  ios: true,
  'robots.txt': true,
  'favicon.ico': true,
  'favicon.png': true,
};

// used to be called USER_CACHE_FIELDS
const PARTIAL_USER_FIELDS = {
  _id: 1,
  fbId: 1,
  name: 1,
  img: 1,
  email: 1,
  // digest: 1, // probably not needed anymore
  iBy: 1,
  handle: 1,
  pref: 1, // needed by mainTemplate
  lastFm: 1, // needed by mainTemplate
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
const defaultPref = (exports.DEFAULT_PREF = {
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

const TESTING_DIGEST = process.appParams?.digestImmediate;

(function parseHandlesFromRouteFile(routeFile) {
  snip.forEachFileLine(routeFile, function (line) {
    if (typeof line != 'string') return;
    line = line.substr(line.indexOf('/') + 1);
    const end = line.search(/[\t/]/);
    if (end > -1) {
      const handle = line.substr(0, end);
      if (handle.indexOf('{') == -1) {
        USERNAME_RESERVED[handle] = true;
      }
    }
  });
})('config/app.route');

(function parseHandlesFromTextFile(fileName) {
  snip.forEachFileLine(fileName, function (line) {
    if (typeof line != 'string') return;
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
  for (const i in defaultPref)
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
  for (const i in list) if (list[i]) processUserPref(list[i]);
}

function fetch(q, handler) {
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

exports.fetchAll = async function (handler) {
  const array = await mongodb.collections['user']
    .find({}, { sort: [['_id', 'desc']] })
    .toArray();
  processUsers(array);
  handler(array);
};

exports.fetchMulti = async function (q, options, handler) {
  if (q._id && typeof q._id == 'string') q._id = ObjectId(q._id);
  if (q._id && typeof q._id == 'object')
    // $in:[]
    for (const i in q._id)
      if (i == '$in')
        for (const j in q._id['$in'])
          q._id['$in'][j] = ObjectId('' + q._id['$in'][j]);
  const { fields } = options ?? {};
  if (options) delete options.fields;
  const array = await mongodb.collections['user']
    .find(q, options || {})
    .project(fields ?? {})
    .toArray();
  processUsers(array);
  handler?.(array);
  return array;
};

/**
 * @type {(uid : string, handler : (user : UserDocument) => void) => void }
 */
exports.fetchByUid = exports.model = function (uid, handler) {
  fetch(
    { _id: typeof uid == 'string' ? ObjectId(uid) : uid },
    function (err, user) {
      if (err) console.error('fetchByUid error:', err);
      handler(user);
    },
  );
};

/** @typedef {Pick<UserDocument, keyof typeof PARTIAL_USER_FIELDS> & { id: string, mid: string }} PartialUserDocument */

/**
 * Fetch a partial user document by id.
 * Function written to replace the in-memory users cache.
 * @type {(uid : import('mongodb').ObjectId | string) => Promise<PartialUserDocument | null> }
 */
exports.fetchAndProcessUserById = async function (uid) {
  /** @satisfies {PartialUserDocument | null} */
  const user = await mongodb.collections['user'].findOne(
    { _id: typeof uid == 'string' ? ObjectId(uid) : uid },
    { projection: PARTIAL_USER_FIELDS },
  );
  if (user) {
    user.id = '' + user._id;
    user.mid = '/u/' + user.id;
    processUserPref(user);
  }
  return user;
};

/**
 * @type {(uid : import('mongodb').ObjectId | string) => Promise<string | undefined> }
 */
exports.fetchUserNameById = async function (uid) {
  const user = await mongodb.collections['user'].findOne(
    { _id: typeof uid == 'string' ? ObjectId(uid) : uid },
    { projection: { name: 1 } },
  );
  return user?.name;
};

exports.fetchByHandle = function (handle, handler) {
  fetch({ handle: handle }, function (err, user) {
    if (err) console.error('fetchByHandle error:', err);
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
  fetch({ email: emailModel.normalize(email) }, function (err, user) {
    if (err) console.error('fetchByEmail error:', err);
    handler(user);
  });
};

exports.fetchInvitedUsers = async function (uid, handler) {
  const array = await mongodb.collections['user']
    .find({ iBy: '' + uid })
    .toArray()
    .catch((err) => console.error('fetchInvitedUsers error:', err));
  processUsers(array);
  handler(array);
};

exports.updateAndFetch = function (criteria, update, opts, cb) {
  mongodb.collections['user'].updateOne(
    criteria,
    /*{$set:*/ update /*}*/,
    opts || {},
    function (err) {
      fetch(criteria, function (err2, user) {
        cb && cb(err || err2, user);
      });
    },
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
    },
  );
};

/**
 *
 * @param {Partial<UserDocument> & ({_id: string} | {id: string} | {email: string})} pUser
 * @param {(userDocument:UserDocument) => any} handler
 */
exports.save = function (pUser, handler) {
  const uid = pUser._id || pUser.id;
  const criteria = uid
    ? { _id: typeof uid == 'string' ? ObjectId(uid) : uid }
    : { email: emailModel.normalize(pUser.email) };
  const user = pUser;
  delete user._id;
  if (user.name) user.n = exports.normalizeName(user.name);
  mongodb.collections['user'].updateOne(
    criteria,
    { $set: user },
    { upsert: true },
    function (err) {
      if (err) console.trace('user.save error 1:', err);
      fetch(criteria, function (err, user) {
        if (err) console.error('user.save error 2:', err);
        if (user) searchModel.indexTyped('user', user);
        if (handler) handler(user);
      });
    },
  );
};

/** Delete a user account. */
exports.delete = function (features, criteria, handler) {
  criteria = criteria || {};
  if (criteria._id) {
    criteria._id = ObjectId('' + criteria._id);
    fetch(criteria, function (err, user) {
      if (err) console.error('user.delete error:', err);
      if (!user) return handler && handler({ error: 'user not found' });
      // delete playlists from index
      if (user.pl)
        (function next() {
          if (!user.pl.length) console.log('done deleting user playlists');
          else {
            const pl = user.pl.pop() || {};
            console.log(
              'deleting user playlists',
              user._id + '_' + pl.id,
              pl.name,
            );
            searchModel.deletePlaylist(user._id, pl.id, next); // TODO: use new deletePlaylist use case, instead
          }
        })();
      // delete user
      mongodb.collections['user'].deleteOne(criteria, function (err, item) {
        if (err) console.error('user.delete error:', err);
        searchModel.deleteDoc('user', '' + criteria._id);
        if (handler) handler(criteria, item);
        features.auth?.deleteUser(criteria._id.toString());
        // todo: delete user avatar file
      });
      // TODO: delete tracks
    });
  } else if (handler) handler({ error: '_id not found' });
};

// signup list (from landing)

exports.fetchEmail = function (email, callback) {
  mongodb.collections['email'].findOne(
    { _id: emailModel.normalize(email) },
    callback,
  );
};

exports.deleteEmails = function (emailArray, callback) {
  mongodb.collections['email'].deleteMany(
    { _id: { $in: emailArray } },
    callback,
  );
};

exports.storeEmail = function (email) {
  mongodb.collections['email'].updateOne(
    { _id: emailModel.normalize(email) },
    { date: new Date() },
    { upsert: true },
  );
};

// invites

exports.fetchInvite = function (inviteCode, handler) {
  mongodb.collections['invite'].findOne(
    { _id: ObjectId(inviteCode) },
    function (err, user) {
      handler(user);
    },
  );
};

exports.fetchInviteByEmail = function (email, handler) {
  mongodb.collections['invite'].findOne(
    { email: emailModel.normalize(email) },
    function (err, user) {
      handler(user);
    },
  );
};

function insertInvite(obj, handler) {
  let criteria = {};
  if (obj.email) {
    const normalized = emailModel.normalize(obj.email);
    if (!emailModel.validate(normalized)) {
      return handler ? handler(null) : null;
    }
    criteria = { email: (obj.email = normalized) };
  } else if (obj.fbId) {
    criteria = { fbId: obj.fbId };
  } else {
    return handler && handler();
  }

  mongodb.collections['invite'].updateMany(
    criteria,
    { $set: obj },
    { upsert: true },
    function (err) {
      if (err) console.trace('insertInvite error 1:', err);
      mongodb.collections['invite'].findOne(criteria, function (err, user) {
        if (err) console.error('insertInvite error 2:', err);
        if (user && obj.email)
          mongodb.collections['email'].deleteOne(
            { _id: obj.email },
            function () {
              if (handler) handler(user);
            },
          );
        else if (handler) handler(user);
      });
    },
  );
}

exports.inviteUser = function (email, handler) {
  insertInvite({ email: email }, handler);
};

exports.inviteUserBy = function (email, senderId, handler) {
  insertInvite({ email: email, iBy: senderId }, handler);
};

exports.inviteFbUserBy = function (fbId, senderId, handler) {
  // formerly inviteToJoinConversation()
  insertInvite({ fbId: fbId, iBy: senderId }, handler);
};

exports.removeInvite = function (inviteCode, handler) {
  const id = typeof inviteCode == 'string' ? ObjectId(inviteCode) : inviteCode;
  mongodb.collections['invite'].deleteOne({ _id: id }, function (err) {
    console.log('removeInvite =>', err || 'removed invite ' + id);
    if (handler) handler({ _id: id });
  });
};

exports.removeInviteByEmail = function (emailList, handler) {
  mongodb.collections['invite'].deleteMany(
    { email: { $in: emailList } },
    function (err) {
      console.log(
        'removeInviteByEmail =>',
        err || 'removed invites ' + emailList,
      );
      if (handler) handler({ emailList: emailList });
    },
  );
};

// playlist management

exports.fetchPlaylist = function (uId, plId, cb) {
  exports.fetchByUid(uId, function (user) {
    if (user && user.pl && user.pl.length)
      for (const i in user.pl) {
        if (user.pl[i].id == plId) return cb(user.pl[i]);
      }
    else if (cb) cb();
  });
};

exports.hasPlaylistName = function (user, name) {
  if (!user && user.id != null)
    console.error(
      'user.hasPlaylistName error: null user provided in user.hasPlaylist',
    );
  else if (user.pl && user.pl.length)
    for (const i in user.pl) if (user.pl[i].name == name) return user.pl[i];
  return false;
};

exports.hasPlaylistNameByUid = function (uId, name, cb) {
  exports.fetchByUid(uId, function (user) {
    cb(exports.hasPlaylistName(user, name));
  });
};

exports.setPlaylist = function (uId, plId, upd, handler) {
  upd = upd || {};
  fetch({ _id: '' + uId }, function (err, user) {
    let found = true;
    user.pl = user.pl || [];
    for (const i in user.pl)
      if ('' + user.pl[i].id == '' + plId) {
        found = user.pl[i]; // = {id:plId, name:plName};
        if (upd.name) user.pl[i].name = upd.name;
        if (upd.fbId) user.pl[i].fbId = upd.fbId;
        break;
      }
    if (found) {
      exports.save(user, async function () {
        if (upd.name) {
          searchModel.indexPlaylist(uId, plId, upd.name);
          await new Promise((resolve) =>
            postModel.setPlaylist(uId, plId, upd.name, () => resolve()),
          );
        }
        if (handler) handler(found);
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

// === USER PREFS

function daysToMillisecs(freq) {
  return freq * 24 * 60 * 60 * 1000;
}

function msToDigestTimestamp(date) {
  return new Date(date);
}

exports.getEmailNotifsFreq = function (user) {
  let freq = -1; // daily (by default)
  for (const i in user.pref)
    if (i.indexOf('em') == 0) freq = Math.max(freq, user.pref[i]);
  return freq;
};

exports.fetchEmailNotifsToSend = async function (now = new Date()) {
  const criteria = {
    'pref.pendEN': { $gt: 0 }, // number of pending email notifs
  };
  if (!TESTING_DIGEST)
    criteria['pref.nextEN'] = { $lte: msToDigestTimestamp(now) }; // next email notif date

  return await exports.fetchMulti(criteria, {});
};

exports.incrementNotificationCounter = function (uId, handler) {
  mongodb.collections['user'].updateOne(
    { _id: ObjectId('' + uId) },
    { $inc: { 'pref.pendEN': 1 } },
    function (err, item) {
      handler && handler(err ? { error: err } : item);
    },
  );
};

exports.setPref = function (uId, pref, handler) {
  if (!pref) handler({ error: 'Invalid preferences' });
  else {
    const cleanPref = {};
    let emailFreq = 0;
    for (const i in defaultPref)
      if (pref[i] !== undefined && pref[i] !== null) {
        // only clean provided pref values
        cleanPref['pref.' + i] =
          typeof defaultPref[i] == 'boolean' ? !!pref[i] : pref[i]; // type each value accordingly to defaults
        if (i.indexOf('em') == 0)
          // enabled email notification => set next notification date
          emailFreq = Math.max(emailFreq, parseInt('' + pref[i]));
      }
    if (emailFreq > 0) {
      const now = new Date().getTime();
      cleanPref['pref.prevEN'] = msToDigestTimestamp(now);
      cleanPref['pref.nextEN'] = msToDigestTimestamp(
        now + daysToMillisecs(emailFreq),
      );
      exports.update(uId, { $set: cleanPref }, handler);
    } else
      exports.update(
        uId,
        { $set: cleanPref, $unset: { 'pref.prevEN': 1, 'pref.nextEN': 1 } },
        handler,
      );
  }
};

// === OTHER METHODS

exports.setFbId = function (uId, fbId, cb, fbTok) {
  exports.fetchByFbUid(fbId, function (user) {
    if (user) {
      if (user._id != uId) {
        cb &&
          cb({
            error:
              'This Facebook account is already associated to another user',
          });
      } else
        cb &&
          cb({
            error: 'This Facebook account is already associated to this user',
          });
    } else {
      const u = { _id: uId, fbId: fbId };
      if (fbTok) u.fbTok = fbTok;
      // @ts-ignore
      exports.save(u, cb);
    }
  });
};

exports.setTwitterId = function (uId, twId, twTok, twSec, cb) {
  if (!uId) return cb && cb({ error: 'invalid parameters' });
  else if (!twId)
    // disconnect twitter account
    mongodb.collections['user'].updateOne(
      { _id: ObjectId('' + uId) },
      { $unset: { twId: '', twTok: '', twSec: '' } },
      function (err, success) {
        cb && cb(err || !success ? { error: err } : { ok: success });
      },
    );
  else if (!twTok || !twSec) return cb && cb({ error: 'invalid parameters' });
  else
    fetch({ twId: twId }, function (err, user) {
      if (user && user._id != uId)
        cb &&
          cb({
            error: 'This Twitter account is already associated to another user',
          });
      else {
        // @ts-ignore
        exports.save({ _id: uId, twId: twId, twTok: twTok, twSec: twSec }, cb);
      }
    });
};

/** @param {{auth?: import('../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures}} features */
exports.setHandle = function (features, uId, username, handler) {
  function res(result) {
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
          handler({ ok: 1, user: user, username: username, handle: username });
          features.auth?.setUserHandle(uId, username);
        });
      });
  });
};

/** @param {{auth?: import('../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures}} features */
exports.renameUser = async function (features, uid, name, callback) {
  function whenDone() {
    console.log('renameUser last step: save the actual user record');
    exports.save({ _id: uid, name: name }, callback);
  }
  const cols = ['follow', 'post'];
  uid = '' + uid;
  const user = await exports.fetchAndProcessUserById(uid);
  const oldName = (user || {}).name;
  if (!user) {
    callback({ error: 'renameUser error: user not found' });
  } else if (oldName == name) {
    callback({}); // nothing to do
  } else {
    try {
      await features.auth?.setUserProfileName(uid, name); // validates the name
    } catch (err) {
      callback({ error: err.message }); // e.g. "String is too short (0 chars)"
      return;
    }
    // update user name in other collections where it's mentionned
    (function next() {
      let col;
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
            function (err) {
              if (err) console.log('err', err);
              //console.log("-> updated to ", result);
              col.updateMany(
                { tId: uid /*, tNm: oldName*/ },
                { $set: { tNm: name } },
                function (err) {
                  if (err) console.log('err', err);
                  //console.log("-> updated to ", result);
                  next();
                },
              );
            },
          );
        },
      );
    })();
  }
};

exports.fetchUserFields = function (subList, attrToCopy, cb) {
  const uidList = [];
  if (subList) for (const i in subList) uidList.push(subList[i].id);
  if (uidList.length) {
    const attrSet = snip.arrayToSet(attrToCopy, 1);
    exports.fetchMulti(
      { _id: { $in: uidList } },
      { fields: attrSet },
      function (userList) {
        const uidSet = {};
        if (userList)
          for (const i in userList) uidSet['' + userList[i]._id] = userList[i];
        for (const i in subList)
          for (const j in attrToCopy)
            if (subList[i] && uidSet[subList[i].id])
              subList[i][attrToCopy[j]] = uidSet[subList[i].id][attrToCopy[j]];
        cb(subList);
      },
    );
  } else cb();
};

exports.fetchUserBios = function (subList, cb) {
  exports.fetchUserFields(subList, ['name', 'bio'], cb);
};

exports.fetchPlaylists = async function (user, params, cb) {
  const pl = (user || {}).pl || [];
  const uId = (user || {}).id;
  const counts = await mongodb.collections['post']
    .aggregate([
      { $match: { uId: uId } },
      { $group: { _id: '$pl.id', c: { $sum: 1 } } },
    ])
    .toArray();
  const plCount = {}; //snip.objArrayToSet(counts, "_id"); // => {plId -> {_id: plId, c: nbTracks}}
  counts.map(function (counter) {
    // necessary to make a sum, because playlist ids can be both stored as int and string
    plCount['' + counter._id] = (plCount['' + counter._id] || 0) + counter.c;
  });
  cb(
    pl.reverse().map(function (p) {
      p.url = '/u/' + uId + '/playlist/' + p.id;
      p.nbTracks = plCount['' + p.id] || 0;
      return p;
    }),
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
