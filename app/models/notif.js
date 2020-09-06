/**
 * notif model
 * stores and retrieves user notifications, and send emails when required
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('./mongodb.js');
var config = require('../models/config.js');
var userModel = require('../models/user.js');
var notifEmails = require('../models/notifEmails.js');
var applenotif = require('../models/applenotif.js');

exports.userNotifsCache = {}; // uId -> { t, notifs: [pId, topic, t, lastAuthor, n] }

var db = mongodb.collections;

/**
  NOTIF COLLECTION MODEL

  .t:   timestamp of the notification (in seconds)
  .uId: list of recipients of the notification
  .uIdLast: id of last user who emitted this notification
  ._id: id of the post
  	- "/u/<uId>" => subscription
  	- "<pId>/loves" =>
  		.n = number of likes received on this post (.uId == <pId>.uId)
  		.lov = list of users who loved this post
  	- "<pId>/reposts" =>
  		.n = number of reposts of this post (.uId == <pId>.uId)
  		.reposters = list of users who reposted this post
  	- "<pId>/comments" =>
  		.n = number of reposts of this post (.uId == <pId>.uId)
  	- "<pId>/mentions" ...
  	- "<pId>/replies" ...

  .eId: post's content identifier
  .name: post's content name
  .img: post's content thumb image url

  .html: html code of the notification 
  .href: href url of the notification

**/

// private functions

function pushToMobileTokens(toUser, text, payload) {
  payload = payload || {};
  exports.getUserNotifs(toUser.id || '' + toUser._id, function (notifs) {
    payload.badge = countUserNotifs(notifs);
    (toUser.apTok || []).map(function (device) {
      console.log(
        '[notif] sending to user',
        toUser.id || '' + toUser._id,
        'tok:',
        device.tok
      );
      applenotif.pushToDevice(device.tok, text, payload);
    });
  });
}

function getUser(u) {
  return u && mongodb.usernames['' + (u.id || u._id || u)];
}

function pushToMobile(code, initialToUser, text, payload) {
  var toUser = getUser(initialToUser);
  if (!(toUser || {}).pref)
    return console.error(
      'push notif prefs not found for user: ',
      initialToUser
    );
  if (parseInt('' + toUser.pref['mn' + code]) > -1) {
    if (toUser.apTok) pushToMobileTokens(toUser, text, payload);
    else
      userModel.fetchUserFields([toUser], ['apTok'], function (toUsers) {
        pushToMobileTokens(toUsers[0], text, payload);
      });
  }
}

function pushToMobiles(code, toUsers, text, payload) {
  for (let i in toUsers) pushToMobile(code, toUsers[i], text, payload);
}

function cacheUserNotifs(uId, notifs) {
  exports.userNotifsCache[uId] = { t: new Date(), notifs: notifs };
}

function invalidateUserNotifsCache(uId) {
  if (uId.splice)
    for (let i in uId) delete exports.userNotifsCache['' + uId[i]];
  else delete exports.userNotifsCache['' + uId]; // => force fetch on next request
}

function logErrors(cb) {
  return function (err, res) {
    res = res || { error: err };
    if (res.error) console.log(res);
    cb && cb(res);
  };
}

function detectTo(p) {
  for (let i in p) {
    var uId = (p[i] || {}).uId;
    var to = ((uId || {}).$each || [uId])[0];
    if (to) return to;
  }
}

function updateNotif(q, p, cb) {
  q = q || {};
  p = p || {};
  p.$set = p.$set || {};
  p.$set.t = Math.round(new Date().getTime() / 1000);
  var to = detectTo(p);
  db['notif'].update(
    q,
    p,
    { upsert: true, /*w:0*/ safe: true },
    logErrors(function (res) {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
      cb && cb(res);
    })
  );
}

function insertNotif(to, p, cb) {
  p = p || {};
  p.t = Math.round(new Date().getTime() / 1000);
  p.uId = to.splice ? to : ['' + to];
  db['notif'].insertOne(
    p,
    { /*w:0*/ safe: true },
    logErrors(function (res) {
      invalidateUserNotifsCache(to); // author(s) will be invalidated later by clearUserNotifsForPost()
      cb && cb(res && res.ops[0]);
    })
  );
}

function pushNotif(to, q, set, push, cb) {
  set = set || {};
  set.t = Math.round(new Date().getTime() / 1000);
  if (!(push || {}).uId) set.uId = ['' + to];
  var p = { $set: set };
  if (push) p.$push = push;
  db['notif'].update(
    q,
    p,
    { upsert: true, /*w:0*/ safe: true },
    logErrors(function (res) {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
      cb && cb(res);
    })
  );
}

function makeLink(text /*, url*/) {
  //return "<a href='" + url + "'>" + snip.htmlEntities(text) + "</a>";
  return '<span>' + snip.htmlEntities(text) + '</span>';
}

// main methods

const extractObjectID = (str) => str.match(/[0-9a-f]{24}/)[0];

exports.clearUserNotifsForPost = function (uId, pId) {
  if (!uId || !pId) return;
  var idList = [pId];
  try {
    idList.push(
      mongodb.ObjectID.createFromHexString(
        typeof pId === 'string'
          ? extractObjectID(pId) // strip the eventual "/u/" prefix or "/reposts" suffix (e.g. in notif-tests.js)
          : pId
      )
    );
  } catch (e) {
    console.error('error in clearUserNotifsForPost:', e);
  }
  db['notif'].update(
    { _id: { $in: idList } },
    { $pull: { uId: uId } },
    { safe: true /*w:0*/ },
    function () {
      // remove documents with empty uid
      db['notif'].remove(
        { _id: { $in: idList }, uId: { $size: 0 } },
        { multi: true, w: 0 }
      );
      //console.log("notif update callback objects ", objects);
      invalidateUserNotifsCache(uId);
    }
  );
};

exports.clearUserNotifs = function (uId) {
  if (!uId) return;
  db['notif'].find({ uId: uId }, { uId: 1 }, { limit: 1000 }, function (
    err,
    cursor
  ) {
    var idsToRemove = [];
    function whenDone() {
      // delete records that were only associated to that user
      db['notif'].remove(
        { _id: { $in: idsToRemove } },
        { multi: true, safe: true },
        function () {
          // ...then, remove the user from remaining records
          db['notif'].update(
            { uId: uId },
            { $pull: { uId: uId } },
            { multi: true, w: 0 }
          );
          invalidateUserNotifsCache(uId);
        }
      );
    }
    cursor.each(function (err, item) {
      if (!item) whenDone();
      else if (item.uId.length == 1) idsToRemove.push(item._id);
    });
  });
};

exports.fetchUserNotifs = function (uId, handler) {
  db['notif'].find({ uId: uId }, { sort: ['t', 'desc'] }, function (
    err,
    cursor
  ) {
    cursor.toArray(function (err, results) {
      var notifs = [];
      for (let i in results) {
        var n = 0;
        if (('' + results[i]._id).endsWith('/loves')) n = results[i].n;
        else for (let j in results[i].uId) if (results[i].uId[j] == uId) n++;
        var lastAuthor = mongodb.usernames[results[i].uIdLast] || {};
        notifs.push({
          type: results[i].type,
          pId: '' + results[i]._id,
          track: {
            eId: results[i].eId,
            name: results[i].name,
            img: config.imgUrl(results[i].img),
          },
          t: new Date(results[i].t * 1000),
          lastAuthor: { id: lastAuthor.id, name: lastAuthor.name },
          n: n,
          img: results[i].img,
          html: results[i].html,
          href: results[i].href,
        });
      }
      cacheUserNotifs(uId, notifs);
      if (handler) handler(notifs);
    });
  });
};

exports.getUserNotifs = function (uid, handler) {
  var cachedNotifs = exports.userNotifsCache[uid];
  if (cachedNotifs) handler(cachedNotifs.notifs, cachedNotifs.t);
  else exports.fetchUserNotifs(uid, handler);
};

function countUserNotifs(notifs) {
  var total = 0;
  for (let i in notifs) total += notifs[i].n || 1;
  return total;
}

// generation notification method

exports.html = function (uId, html, href, img) {
  db['notif'].insertOne(
    {
      t: Math.round(new Date().getTime() / 1000),
      uId: [uId],
      html: html,
      href: href,
      img: img,
    },
    { w: 0 }
  );
  invalidateUserNotifsCache(uId);
};

// specific notification methods

exports.love = function (loverUid, post) {
  var user = mongodb.usernames['' + loverUid];
  var author = mongodb.usernames['' + post.uId];
  if (!user || !author) return;
  db['notif'].update(
    { _id: post._id + '/loves' },
    {
      $set: {
        eId: post.eId,
        name: post.name,
        t: Math.round(new Date().getTime() / 1000),
        uIdLast: loverUid, // last lover of this post
        uId: [post.uId],
      },
      $push: { lov: loverUid },
      $inc: { n: 1 },
    },
    { upsert: true, w: 0 }
  );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  notifEmails.sendLike(user, post, author);
  pushToMobile('Lik', author, user.name + ' liked one of your tracks', {
    href: '/c/' + post._id,
  });
};

exports.unlove = function (loverUid, pId) {
  var criteria = { _id: pId + '/loves' };
  var col = db['notif'];
  col.update(
    criteria,
    { $inc: { n: -1 }, $pull: { lov: loverUid } },
    { safe: true },
    function () {
      col.findOne(criteria, function (err, res) {
        if (res) {
          if (!res.lov || res.lov.length == 0 || res.n < 1)
            col.remove(criteria, { w: 0 });
          else
            col.update(
              criteria,
              { $set: { uIdLast: res.lov[res.lov.length - 1] } },
              { w: 0 }
            );
          invalidateUserNotifsCache(res.uId); // author will be invalidated later by clearUserNotifsForPost()
        }
      });
    }
  );
};

exports.post = function (post) {
  if (!post || !post.eId || !post.uId) return;
  var query = {
    q: {
      eId: post.eId,
      uId: { $nin: ['' + post.uId, mongodb.ObjectId('' + post.uId)] },
    },
    limit: 100,
    fields: { uId: true },
  };
  mongodb.forEach2('post', query, function (sameTrack, next) {
    var author = sameTrack && mongodb.usernames[sameTrack.uId];
    if (author) notifEmails.sendPostedSameTrack(author, next);
    else if (next) next();
  });
};

exports.repost = function (reposterUid, post) {
  var reposter = mongodb.usernames['' + reposterUid];
  var author = mongodb.usernames['' + post.uId];
  if (!reposter || !author) return;
  db['notif'].update(
    { _id: post._id + '/reposts' },
    {
      $set: {
        eId: post.eId,
        name: post.name,
        t: Math.round(new Date().getTime() / 1000),
        uIdLast: reposterUid, // last reposter of this post
        uId: [post.uId],
      },
      $push: { reposters: reposterUid },
      $inc: { n: 1 },
    },
    { upsert: true, w: 0 }
  );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  notifEmails.sendRepost(reposter, post, author /*.email*/);
  pushToMobile('Add', author, reposter.name + ' re-added your track', {
    href: '/c/' + post._id,
  });
};
/*
exports.unrepost = function (reposterUid, pId) {
	var criteria = {_id:pId+"/reposts"};
	var col = db["notif"];
	col.update(criteria, { $inc:{ n:-1}, $pull:{ reposters:reposterUid}}, {safe:true}, function() {
		col.findOne(criteria, function(err, res) {
			if (res) {
				if (!res.reposters || res.reposters.length == 0 || res.n < 1)
					col.remove(criteria, {w:0});
				else
					col.update(criteria, {$set:{uIdLast:res.reposters[res.reposters.length-1]}}, {w:0});
				invalidateUserNotifsCache(res.uId); // author will be invalidated later by clearUserNotifsForPost()
			}
		});
	});
};
*/
exports.subscribedToUser = function (senderId, favoritedId, cb) {
  var sender = mongodb.usernames['' + senderId];
  var favorited = mongodb.usernames['' + favoritedId];
  if (sender && favorited) {
    db['notif'].update(
      { _id: '/u/' + sender.id },
      {
        $set: {
          eId: '/u/' + sender.id,
          name: sender.name,
          t: Math.round(new Date().getTime() / 1000),
        },
        $push: { uId: favoritedId },
      },
      { upsert: true, w: 0 }
    );
    invalidateUserNotifsCache(favoritedId);
    notifEmails.sendSubscribedToUser(sender, favorited, cb);
    pushToMobile('Sub', favorited, sender.name + ' subscribed to you', {
      href: '/u/' + senderId,
    });
  }
};

exports.comment = function (post = {}, comment = {}, cb) {
  var commentUser = mongodb.usernames['' + comment.uId];
  if (!commentUser || !post.name)
    cb && cb({ error: 'incomplete call parameters to notif.comment' });
  else if (commentUser.id == post.uId)
    cb && cb(/* user commented his own post => no notif */);
  else {
    pushNotif(
      post.uId,
      { _id: '' + post._id + '/comments' },
      {
        html:
          makeLink(commentUser.name, '/u/' + commentUser.id) +
          ' commented on your track ' +
          makeLink(post.name, '/c/' + post._id),
        img: '/img/u/' + comment.uId,
        href: '/c/' + post._id,
      },
      null,
      function () {
        notifEmails.sendComment(post, comment, cb);
        pushToMobile(
          'Com',
          post.uId,
          commentUser.name + ' commented on one of your tracks',
          {
            href: '/c/' + post._id,
          }
        );
      }
    );
  }
};

exports.mention = function (post = {}, comment = {}, mentionedUid, cb) {
  var commentUser = mongodb.usernames['' + comment.uId];
  if (!commentUser || !mentionedUid || !post.name)
    cb && cb({ error: 'incomplete call parameters to notif.mention' });
  else {
    insertNotif(
      mentionedUid,
      {
        html:
          makeLink(commentUser.name, '/u/' + commentUser.id) +
          ' mentionned you about ' +
          makeLink(post.name, '/c/' + post._id),
        img: '/img/u/' + comment.uId,
        href: '/c/' + post._id,
      },
      function () {
        notifEmails.sendMention(mentionedUid, post, comment, cb);
        pushToMobile(
          'Men',
          mongodb.usernames['' + mentionedUid],
          commentUser.name + ' mentionned you',
          {
            href: '/c/' + post._id,
          }
        );
      }
    );
  }
};

exports.commentReply = function (post = {}, comment = {}, repliedUid, cb) {
  var commentUser = mongodb.usernames['' + comment.uId];
  if (!commentUser || !repliedUid || !post.name)
    cb && cb({ error: 'incomplete call parameters to notif.commentReply' });
  else if (commentUser.id == repliedUid)
    cb && cb(/* user replied to his own comment => no notif */);
  else {
    updateNotif(
      { _id: '' + post._id + '/replies' },
      {
        $set: {
          html:
            makeLink(commentUser.name, '/u/' + commentUser.id) +
            ' replied to your comment on ' +
            makeLink(post.name, '/c/' + post._id),
          img: '/img/u/' + comment.uId,
          href: '/c/' + post._id,
        },
        $addToSet: { uId: repliedUid },
      },
      function () {
        notifEmails.sendCommentReply(post, comment, repliedUid, cb);
        pushToMobile(
          'Rep',
          mongodb.usernames['' + repliedUid],
          commentUser.name + ' replied to your comment',
          {
            href: '/c/' + post._id,
          }
        );
      }
    );
  }
};

exports.inviteAccepted = function (inviterId, newUser) {
  if (!inviterId || !newUser || !newUser.name || !newUser.id) return; // cb && cb({error:"invalid parameters"});
  insertNotif(
    inviterId,
    {
      html:
        'Your friend ' +
        makeLink(newUser.name, '/u/' + newUser.id) +
        ' accepted your invite',
      img: '/img/u/' + newUser.id,
      href: '/u/' + newUser.id,
    },
    function () {
      pushToMobile(
        'Acc',
        { id: inviterId },
        'Your friend ' + newUser.name + ' accepted your invite',
        {
          href: '/u/' + newUser.id,
        }
      );
    }
  );
  notifEmails.sendInviteAccepted(inviterId, newUser);
};

exports.sendTrackToUsers = function (p, cb) {
  var fieldCheck = snip.checkMistypedFields(p, {
    uId: 'string', // id of the sender
    uNm: 'string', // name of the sender
    pId: 'string', // id of the post to share
    uidList: 'array', // list of IDs of users to share this track with
  });
  if (fieldCheck) {
    cb(fieldCheck); // {error:"..."}
    return;
  }
  var payload = {
    type: 'Snt',
    href: '/c/' + p.pId,
    img: '/img/post/' + p.pId,
    uIdLast: p.uId,
    html: makeLink(p.uNm, '/u/' + p.uId) + ' sent you a track',
  };
  //updateNotif({_id: p.pId+"/sent"}, { $set: payload, $addToSet: {uId:{$each:p.uidList}} }, function(res){
  insertNotif(p.uidList, payload, function (res) {
    pushToMobiles(payload.type, p.uidList, p.uNm + ' sent you a track', {
      href: payload.href,
    });
    // no email to send
    cb && cb(res);
  });
};

exports.sendPlaylistToUsers = function (p, cb) {
  var fieldCheck = snip.checkMistypedFields(p, {
    uId: 'string', // id of the sender
    uNm: 'string', // name of the sender
    plId: 'string', // id of the playlist to share (format: <uid>_<number>)
    uidList: 'array', // list of IDs of users to share this track with
  });
  if (fieldCheck) {
    cb(fieldCheck); // {error:"..."}
    return;
  }
  var plUri = p.plId.replace('_', '/playlist/');
  var payload = {
    type: 'Snp',
    href: '/u/' + plUri,
    img: '/img/playlist/' + p.plId,
    uIdLast: p.uId,
    html: makeLink(p.uNm, '/u/' + p.uId) + ' sent you a playlist',
  };
  insertNotif(p.uidList, payload, function (res) {
    pushToMobiles(payload.type, p.uidList, p.uNm + ' sent you a playlist', {
      href: payload.href,
    });
    // no email to send
    cb && cb(res);
  });
};
