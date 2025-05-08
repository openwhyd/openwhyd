/**
 * comment model
 * comments on posts
 * @author: adrienjoly, whyd
 **/

const snip = require('../snip.js');
const mongodb = require('../models/mongodb.js');
const postModel = require('../models/post.js');
const notifModel = require('../models/notif.js');

const MIN_COMMENT_DELAY = 2000; // min 2 seconds between comments

function getCol() {
  return mongodb.collections['comment'];
}

function stringify(a) {
  return '' + a;
}

function combineResult(cb) {
  return function (err, res) {
    if (cb) cb(err ? { error: err } : res);
    else if (err) console.trace('error in comment.combineResult', err);
  };
}

function combineResultArray(cb) {
  return function (err, res) {
    if (err) {
      if (cb) cb({ error: err });
      else console.trace('error in comment.combineResultArray', err);
    } else {
      res.toArray(combineResult(cb));
    }
  };
}

exports.fetchLast = function (p, cb) {
  p = p || {};
  if (!p.pId) cb({ error: 'missing field: pId' });
  else
    getCol()
      .findOne({ pId: '' + p.pId }, { sort: [['_id', 'desc']] })
      .then(cb, (err) => cb({ error: err }));
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
    const notifiedUidSet = {};
    const todo = [];
    // notif mentioned users
    const mentionedUsers = snip.extractMentions(comment.text);
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
          const commentsByUid = snip.excludeKeys(
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

exports.insert = async function (p, cb) {
  p = p || {};
  const comment = {
    uId: p.uId,
    uNm: await mongodb.getUserNameFromId(p.uId) /*p.uNm*/,
    pId: /*mongodb.ObjectId*/ '' + p.pId,
    text: (p.text || '').trim(),
  };
  // checking parameters
  for (const f in comment)
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
      getCol()
        .insertOne(comment)
        .then(
          async function (res) {
            cb?.(await getCol().findOne({ _id: res.insertedId }));
            notifyUsers(comment);
          },
          (err) => cb({ error: err }),
        );
  });
};

exports.delete = function (p, cb) {
  p = p || {};
  const q = { _id: mongodb.ObjectId('' + p._id) };
  getCol()
    .findOne(q)
    .then(
      function (comment) {
        if (!comment) {
          cb?.({ error: 'comment not found' });
          return;
        }
        postModel.fetchPostById(comment.pId, (post) => {
          if (!post || post.error) {
            cb && cb({ error: post ? post.error : 'post not found' });
            return;
          }
          if (p.uId != post.uId && comment.uId != p.uId) {
            cb && cb({ error: 'you are not allowed to delete this comment' });
            return;
          }
          getCol()
            .deleteOne(q)
            .then(cb, (err) => cb({ error: err }));
        });
      },
      (err) => cb({ error: err }),
    );
};
