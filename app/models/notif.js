/**
 * notif model
 * stores and retrieves user notifications, and send emails when required
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('./mongodb.js');
var config = require('../models/config.js');
var notifEmails = require('../models/notifEmails.js');

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
  db['notif'].updateOne(
    q,
    p,
    { upsert: true, /*w:0*/ safe: true },
    logErrors(function (res) {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
      cb && cb(res);
    }),
  );
}

function insertNotif(to, p, cb) {
  p = p || {};
  p.t = Math.round(new Date().getTime() / 1000);
  p.uId = to.splice ? to : ['' + to];
  db['notif'].insertOne(
    p,
    { /*w:0*/ safe: true },
    logErrors(async function (res) {
      invalidateUserNotifsCache(to); // author(s) will be invalidated later by clearUserNotifsForPost()
      cb &&
        cb(
          res?.insertedId &&
            (await db['notif'].findOne({ _id: res.insertedId })),
        );
    }),
  );
}

function pushNotif(to, q, set, push, cb) {
  set = set || {};
  set.t = Math.round(new Date().getTime() / 1000);
  if (!(push || {}).uId) set.uId = ['' + to];
  var p = { $set: set };
  if (push) p.$push = push;
  db['notif'].updateOne(
    q,
    p,
    { upsert: true, /*w:0*/ safe: true },
    logErrors(function (res) {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
      cb && cb(res);
    }),
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
      mongodb.ObjectId(
        typeof pId === 'string'
          ? extractObjectID(pId) // strip the eventual "/u/" prefix or "/reposts" suffix (e.g. in notif-tests.js)
          : pId,
      ),
    );
  } catch (e) {
    console.error('error in clearUserNotifsForPost:', e);
  }
  db['notif'].updateOne(
    { _id: { $in: idList } },
    { $pull: { uId: uId } },
    { safe: true /*w:0*/ },
    function (err) {
      if (err) console.log(err);
      // remove documents with empty uid
      db['notif'].deleteMany(
        { _id: { $in: idList }, uId: { $size: 0 } },
        { multi: true /*w: 0*/ },
        () => invalidateUserNotifsCache(uId),
      );
    },
  );
};

exports.clearAllNotifs = () =>
  db['notif'].deleteMany().then(() => {
    exports.userNotifsCache = {}; // => force fetch on next request
  });

exports.clearUserNotifs = function (uId, cb) {
  if (!uId) return;
  db['notif']
    .find({ uId: uId }, { limit: 1000 })
    .project({ uId: 1 })
    .then((cursor) => {
      var idsToRemove = [];
      function whenDone() {
        // delete records that were only associated to that user
        db['notif'].deleteMany(
          { _id: { $in: idsToRemove } },
          { multi: true, safe: true },
          function () {
            // ...then, remove the user from remaining records
            db['notif'].updateMany(
              { uId: uId },
              { $pull: { uId: uId } },
              { multi: true, w: 0 },
              () => {
                invalidateUserNotifsCache(uId);
                cb && cb();
              },
            );
          },
        );
      }
      cursor.forEach(
        (err, item) => {
          if (item && item.uId.length === 1) idsToRemove.push(item._id);
        },
        () => whenDone(),
      );
    });
};

exports.fetchAllNotifs = () => db['notif'].find().toArray();

exports.fetchUserNotifs = function (uId, handler) {
  db['notif']
    .find({ uId: uId }, { sort: ['t', 'desc'] })
    .toArray()
    .then(function (results) {
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
};

exports.getUserNotifs = function (uid, handler) {
  var cachedNotifs = exports.userNotifsCache[uid];
  if (cachedNotifs) handler(cachedNotifs.notifs, cachedNotifs.t);
  else exports.fetchUserNotifs(uid, handler);
};

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
    { w: 0 },
  );
  invalidateUserNotifsCache(uId);
};

// specific notification methods

exports.love = function (loverUid, post, callback) {
  var user = mongodb.usernames['' + loverUid];
  var author = mongodb.usernames['' + post.uId];
  if (!user) throw new Error('user not found');
  if (!author) throw new Error(`post author not found`);
  db['notif'].updateOne(
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
    { upsert: true, w: 0 },
    callback,
  );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  notifEmails.sendLike(user, post, author);
};

exports.unlove = function (loverUid, pId) {
  var criteria = { _id: pId + '/loves' };
  var col = db['notif'];
  col.updateOne(
    criteria,
    { $inc: { n: -1 }, $pull: { lov: loverUid } },
    { safe: true },
    function () {
      col.findOne(criteria, function (err, res) {
        if (res) {
          if (!res.lov || res.lov.length == 0 || res.n < 1)
            col.deleteOne(criteria, { w: 0 });
          else
            col.updateOne(
              criteria,
              { $set: { uIdLast: res.lov[res.lov.length - 1] } },
              { w: 0 },
            );
          invalidateUserNotifsCache(res.uId); // author will be invalidated later by clearUserNotifsForPost()
        }
      });
    },
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
    projection: { uId: true },
  };
  mongodb.forEach2('post', query, function (sameTrack, next) {
    var author =
      sameTrack && !sameTrack.error && mongodb.usernames[sameTrack.uId];
    if (author) {
      notifEmails.sendPostedSameTrack(author, next);
    } else if (next) {
      next();
    }
  });
};

exports.repost = function (reposterUid, post) {
  var reposter = mongodb.usernames['' + reposterUid];
  var author = mongodb.usernames['' + post.uId];
  if (!reposter || !author) return;
  db['notif'].updateOne(
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
    { upsert: true, w: 0 },
  );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  notifEmails.sendRepost(reposter, post, author /*.email*/);
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
    db['notif'].updateOne(
      { _id: '/u/' + sender.id },
      {
        $set: {
          eId: '/u/' + sender.id,
          name: sender.name,
          t: Math.round(new Date().getTime() / 1000),
        },
        $push: { uId: favoritedId },
      },
      { upsert: true, w: 0 },
    );
    invalidateUserNotifsCache(favoritedId);
    notifEmails.sendSubscribedToUser(sender, favorited, cb); // may reject with "Permission denied, wrong credentials"
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
      },
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
      },
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
      },
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
    function () {},
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
    // no email to send
    cb && cb(res);
  });
};
