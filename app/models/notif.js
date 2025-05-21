// @ts-check

/**
 * notif model
 * stores and retrieves user notifications, and send emails when required
 * @author adrienjoly, whyd
 **/

const snip = require('../snip.js');
const mongodb = require('./mongodb.js');
const config = require('../models/config.js');
const notifEmails = require('../models/notifEmails.js');
const userModel = require('./user.js');

exports.userNotifsCache = {}; // uId -> { t, notifs: [pId, topic, t, lastAuthor, n] }

const db = mongodb.collections;

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
    for (const i in uId) delete exports.userNotifsCache['' + uId[i]];
  else delete exports.userNotifsCache['' + uId]; // => force fetch on next request
}

function detectTo(p) {
  for (const i in p) {
    const uId = (p[i] || {}).uId;
    const to = ((uId || {}).$each || [uId])[0];
    if (to) return to;
  }
}

function updateNotif(q, p, cb) {
  q = q || {};
  p = p || {};
  p.$set = p.$set || {};
  p.$set.t = Math.round(new Date().getTime() / 1000);
  const to = detectTo(p);
  db['notif']
    .updateOne(q, p, { upsert: true })
    .then(
      (res) => cb?.(res),
      (err) => cb?.({ error: err }) ?? console.trace('updateNotif', err),
    )
    .finally(() => {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
    });
}

function insertNotif(to, p, cb) {
  p = p || {};
  p.t = Math.round(new Date().getTime() / 1000);
  p.uId = to.splice ? to : ['' + to];
  db['notif']
    .insertOne(p)
    .then(
      async (res) =>
        cb?.(
          res?.insertedId &&
            (await db['notif'].findOne({ _id: res.insertedId })),
        ),
      (err) => cb?.({ error: err }) ?? console.trace('insertNotif', err),
    )
    .finally(() => {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
    });
}

function pushNotif(to, q, set, push, cb) {
  set = set || {};
  set.t = Math.round(new Date().getTime() / 1000);
  if (!(push || {}).uId) set.uId = ['' + to];
  const p = { $set: set };
  if (push) p.$push = push;
  db['notif']
    .updateOne(q, p, { upsert: true })
    .then(
      (res) => cb?.(res),
      (err) => cb?.({ error: err }) ?? console.trace('pushNotif', err),
    )
    .finally(() => {
      invalidateUserNotifsCache(to); // author will be invalidated later by clearUserNotifsForPost()
    });
}

function makeLink(text, url) {
  url; // just to ignore ts(6133): 'url' is declared but its value is never read.
  //return "<a href='" + url + "'>" + snip.htmlEntities(text) + "</a>";
  return '<span>' + snip.htmlEntities(text) + '</span>';
}

// main methods

const extractObjectID = (str) => str.match(/[0-9a-f]{24}/)[0];

exports.clearUserNotifsForPost = async function (uId, pId) {
  if (!uId || !pId) return;
  const idList = [pId];
  try {
    idList.push(
      mongodb.ObjectId(
        typeof pId === 'string'
          ? extractObjectID(pId) // strip the eventual "/u/" prefix or "/reposts" suffix (e.g. in notif-tests.js)
          : pId,
      ),
    );
  } catch (e) {
    console.trace('error in clearUserNotifsForPost:', e);
  }
  db['notif']
    .updateOne({ _id: { $in: idList } }, { $pull: { uId: uId } })
    .catch((err) => console.trace('clearUserNotifsForPost', err))
    .finally(() => {
      // remove documents with empty uid
      db['notif']
        .deleteMany({ _id: { $in: idList }, uId: { $size: 0 } })
        .finally(() => invalidateUserNotifsCache(uId));
    });
};

/** WARNING: for automated tests only. */
exports.clearAllNotifs = () =>
  db['notif'].deleteMany({}).then(() => {
    exports.userNotifsCache = {}; // => force fetch on next request
  });

/** @param {string} uId */
exports.clearUserNotifs = async function (uId, cb) {
  if (!uId) return cb?.({ error: 'missing uId' });
  const idsToRemove = [];
  // delete records that were only associated to that user
  // note: we may delete those in one command, using https://www.mongodb.com/docs/manual/tutorial/query-arrays/#query-an-array-by-array-length
  await db['notif']
    .find({ uId: uId }, { limit: 1000 })
    .project({ uId: 1 })
    .forEach((item) => {
      // reminder: item.uId is an array of user ids
      if (item && item.uId.length === 1) idsToRemove.push(item._id);
    });
  await db['notif'].deleteMany({ _id: { $in: idsToRemove } });
  // ...then, remove the user from remaining records
  // @ts-ignore ts(2322), Type 'string' is not assignable to type 'never', cf https://www.mongodb.com/community/forums/t/type-objectid-is-not-assignable-to-type-never/139699
  await db['notif'].updateMany({ uId: uId }, { $pull: { uId: uId } });
  invalidateUserNotifsCache(uId);
  cb && cb();
};

exports.fetchAllNotifs = () => db['notif'].find().toArray();

exports.fetchUserNotifs = async function (uId, handler) {
  const results = await db['notif']
    .find({ uId: uId }, { sort: ['t', 'desc'] })
    .toArray();

  const notifs = [];

  for (const i in results) {
    let n = 0;
    if (('' + results[i]._id).endsWith('/loves')) n = results[i].n;
    else for (const j in results[i].uId) if (results[i].uId[j] == uId) n++;
    const lastAuthor = await userModel.fetchAndProcessUserById(
      results[i].uIdLast,
    );
    notifs.push({
      type: results[i].type,
      pId: '' + results[i]._id,
      track: {
        eId: results[i].eId,
        name: results[i].name,
        img: config.imgUrl(results[i].img),
      },
      t: new Date(results[i].t * 1000),
      lastAuthor: { id: lastAuthor?.id, name: lastAuthor?.name },
      n: n,
      img: results[i].img,
      html: results[i].html,
      href: results[i].href,
    });
  }

  cacheUserNotifs(uId, notifs);
  if (handler) handler(notifs);
  return notifs;
};

exports.getUserNotifs = async function (uid, handler) {
  const cachedNotifs = exports.userNotifsCache[uid];
  if (cachedNotifs) {
    handler?.(cachedNotifs.notifs, cachedNotifs.t);
    return cachedNotifs.notifs;
  } else {
    const notifs = await exports.fetchUserNotifs(uid, handler);
    return notifs;
  }
};

// generation notification method

exports.html = function (uId, html, href, img) {
  db['notif'].insertOne({
    t: Math.round(new Date().getTime() / 1000),
    uId: [uId],
    html: html,
    href: href,
    img: img,
  });
  invalidateUserNotifsCache(uId);
};

// specific notification methods

/** @typedef {{_id: import('mongodb').ObjectId | string, eId?: string, name?: string, uId?: string}} LovablePost */

/**
 * @param {import('mongodb').ObjectId | string} loverUid
 * @param {LovablePost} post
 */
exports.love = async function (loverUid, post, callback) {
  const user = await userModel.fetchAndProcessUserById(loverUid);
  const author = await userModel.fetchAndProcessUserById(post.uId);
  if (!user) throw new Error('user not found');
  if (!author) throw new Error(`post author not found`);
  db['notif']
    .updateOne(
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
      { upsert: true },
    )
    .then(
      (res) => callback?.(null, res),
      (err) => callback?.(err) ?? console.trace('love error:', err),
    );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  await notifEmails.sendLike(user, post, author);
};

/**
 * @param {import('mongodb').ObjectId | string} loverUid
 * @param {LovablePost} post
 */
exports.unlove = async function (loverUid, post) {
  const pId = post._id;
  const criteria = { _id: pId + '/loves' };
  const col = db['notif'];
  await col.updateOne(criteria, { $inc: { n: -1 }, $pull: { lov: loverUid } });
  const res = await col.findOne(criteria);
  if (!res.lov || res.lov.length === 0 || res.n < 1) col.deleteOne(criteria);
  else
    col.updateOne(criteria, { $set: { uIdLast: res.lov[res.lov.length - 1] } });
  invalidateUserNotifsCache(res.uId); // author will be invalidated later by clearUserNotifsForPost()
};

exports.post = function (post) {
  if (!post || !post.eId || !post.uId) return;
  const query = {
    q: {
      eId: post.eId,
      uId: { $nin: ['' + post.uId, mongodb.ObjectId('' + post.uId)] },
    },
    limit: 100,
    projection: { uId: true },
  };
  mongodb.forEach2('post', query, async function (sameTrack, next) {
    if (sameTrack && !sameTrack.error) {
      const author = await userModel.fetchAndProcessUserById(sameTrack.uId);
      if (author) {
        await notifEmails.sendPostedSameTrack(author, next);
      } else if (next) {
        next();
      }
    } else if (next) {
      next();
    }
  });
};

exports.repost = async function (reposterUid, post) {
  const reposter = await userModel.fetchAndProcessUserById(reposterUid);
  const author = await userModel.fetchAndProcessUserById(post.uId);
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
    { upsert: true },
  );
  invalidateUserNotifsCache(post.uId); // author will be invalidated later by clearUserNotifsForPost()
  await notifEmails.sendRepost(reposter, post, author /*.email*/);
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
exports.subscribedToUser = async function (senderId, favoritedId, cb) {
  const sender = await userModel.fetchAndProcessUserById(senderId);
  const favorited = await userModel.fetchAndProcessUserById(favoritedId);
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
      { upsert: true },
    );
    invalidateUserNotifsCache(favoritedId);
    await notifEmails.sendSubscribedToUser(sender, favorited, cb); // may reject with "Permission denied, wrong credentials"
  }
};

exports.comment = async function (post = {}, comment = {}, cb) {
  const commentUser = await userModel.fetchAndProcessUserById(comment.uId);
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
      async function () {
        await notifEmails.sendComment(post, comment, cb);
      },
    );
  }
};

exports.mention = async function (post = {}, comment = {}, mentionedUid, cb) {
  const commentUser = await userModel.fetchAndProcessUserById(comment.uId);
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
      async function () {
        await notifEmails.sendMention(mentionedUid, post, comment, cb);
      },
    );
  }
};

exports.commentReply = async function (
  post = {},
  comment = {},
  repliedUid,
  cb,
) {
  const commentUser = await userModel.fetchAndProcessUserById(comment.uId);
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
      async function () {
        await notifEmails.sendCommentReply(post, comment, repliedUid, cb);
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
  const fieldCheck = snip.checkMistypedFields(p, {
    uId: 'string', // id of the sender
    uNm: 'string', // name of the sender
    pId: 'string', // id of the post to share
    uidList: 'array', // list of IDs of users to share this track with
  });
  if (fieldCheck) {
    cb(fieldCheck); // {error:"..."}
    return;
  }
  const payload = {
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
  const fieldCheck = snip.checkMistypedFields(p, {
    uId: 'string', // id of the sender
    uNm: 'string', // name of the sender
    plId: 'string', // id of the playlist to share (format: <uid>_<number>)
    uidList: 'array', // list of IDs of users to share this track with
  });
  if (fieldCheck) {
    cb(fieldCheck); // {error:"..."}
    return;
  }
  const plUri = p.plId.replace('_', '/playlist/');
  const payload = {
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
