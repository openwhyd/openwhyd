/**
 * comment model
 * comments on posts
 * @author: adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var notifModel = require('../models/notif.js');

var MIN_COMMENT_DELAY = 2000; // min 2 seconds between comments

function getCol() {
  return mongodb.collections['comment'];
}

function stringify(a) {
  return '' + a;
}

function combineResult(cb) {
  return function (err, res) {
    (cb || console.log)(err ? { error: err } : res);
  };
}

function combineInsertedResult(cb) {
  return function (err, res) {
    (cb || console.log)(err ? { error: err } : res);
  };
}

function combineResultArray(cb) {
  return function (err, res) {
    if (err) (cb || console.log)({ error: err });
    else res.toArray(combineResult(cb));
  };
}

exports.fetchLast = function (p, cb) {
  p = p || {};
  if (!p.pId) cb({ error: 'missing field: pId' });
  else
    getCol().findOne(
      { pId: '' + p.pId },
      { sort: [['_id', 'desc']] },
      combineResult(cb),
    );
};

exports.fetch = async function (q, p, cb) {
  q = q || {};
  p = p || {};
  p.sort = p.sort || [['_id', 'asc']];
  if (q._id)
    q._id = q._id.push
      ? { $in: q._id.map(mongodb.ObjectId) }
      : typeof q._id == 'string'
      ? mongodb.ObjectId(q._id)
      : q._id;
  if (q.pId)
    q.pId = {
      $in: (q.pId.push ? q.pId : [q.pId]).map(/*mongodb.ObjectId*/ stringify),
    };
  const { fields } = p ?? {};
  delete p.fields;
  const results = await getCol()
    .find(q, p)
    .project(fields ?? {})
    .toArray();
  combineResultArray(cb)(results);
};

function notifyUsers(comment) {
  postModel.fetchPostById(comment.pId, function (post = {}) {
    if (post.error || !post.uId) return;
    var notifiedUidSet = {};
    var todo = [];
    // notif mentioned users
    var mentionedUsers = snip.extractMentions(comment.text);
    if (mentionedUsers.length)
      todo.push(function (cb) {
        console.log('notif mentioned users');
        snip.forEachArrayItem(
          mentionedUsers,
          function (mentionedUid, next) {
            notifiedUidSet[mentionedUid] = true;
            notifModel.mention(post, comment, mentionedUid, next);
          },
          cb,
        );
      });
    // notify post author
    todo.push(function (cb) {
      if (notifiedUidSet[post.uId]) {
        cb();
        return;
      }
      console.log('notify post author');
      notifiedUidSet[post.uId] = true;
      notifModel.comment(post, comment, cb);
    });
    // notify previous commenters
    todo.push(function (cb) {
      console.log('notify previous commenters');
      exports.fetch(
        { pId: comment.pId, _id: { $lt: comment._id } },
        { fields: { uId: 1 } },
        function (comments = []) {
          var commentsByUid = snip.excludeKeys(
            snip.groupObjectsBy(comments, 'uId'),
            notifiedUidSet,
          );
          snip.forEachArrayItem(
            Object.keys(commentsByUid),
            function (uId, next) {
              notifiedUidSet[uId] = true;
              notifModel.commentReply(post, comment, uId, next);
            },
            cb,
          );
        },
      );
    });
    snip.forEachArrayItem(todo, function (fct, next) {
      fct(next);
    });
  });
}

exports.insert = function (p, cb) {
  p = p || {};
  var comment = {
    uId: p.uId,
    uNm: mongodb.getUserNameFromId(p.uId) /*p.uNm*/,
    pId: /*mongodb.ObjectId*/ '' + p.pId,
    text: (p.text || '').trim(),
  };
  // checking parameters
  for (let f in comment)
    if (!comment[f]) {
      cb({ error: 'missing field: ' + f });
      return;
    }
  // make sure user is not spamming
  exports.fetchLast(p, function (lastC) {
    if (
      lastC &&
      lastC.uId == comment.uId &&
      new Date() - lastC._id.getTimestamp() < MIN_COMMENT_DELAY
    )
      cb({
        error:
          "You're commenting too quickly! Please try again in a few seconds.",
      });
    // actual insert
    else
      getCol().insertOne(
        comment,
        combineInsertedResult(async function (res) {
          const commentOrError = res.insertedId
            ? await getCol().findOne({ _id: res.insertedId })
            : res;
          cb && cb(commentOrError);
          if (res && !res.error) notifyUsers(comment);
        }),
      );
  });
};

exports.delete = function (p, cb) {
  p = p || {};
  var q = { _id: mongodb.ObjectId('' + p._id) };
  getCol().findOne(
    q,
    combineResult(function (comment) {
      if (!comment || comment.error) {
        cb && cb({ error: comment ? comment.error : 'comment not found' });
        return;
      }
      postModel.fetchPostById(
        comment.pId,
        (post = { error: 'post not found' }) => {
          if (post.error) {
            cb && cb(post);
            return;
          }
          if (p.uId != post.uId && comment.uId != p.uId) {
            cb && cb({ error: 'you are not allowed to delete this comment' });
            return;
          }
          getCol().deleteOne(q, combineResult(cb));
        },
      );
    }),
  );
};
