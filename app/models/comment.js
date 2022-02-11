/**
 * comment model
 * comments on posts
 * @author: adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');

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
    (cb || console.log)(err ? { error: err } : res.ops[0]);
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
      combineResult(cb)
    );
};

exports.fetch = function (q, p, cb) {
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
  getCol().find(q, p, combineResultArray(cb));
};

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
        combineInsertedResult(function (res) {
          cb && cb(res);
        })
      );
  });
};

exports.delete = function (p, cb) {
  p = p || {};
  var q = { _id: mongodb.ObjectId('' + p._id) };
  getCol().findOne(
    q,
    combineResult(function (comment = { error: 'comment not found' }) {
      if (comment.error) {
        cb && cb(comment);
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
        }
      );
    })
  );
};
