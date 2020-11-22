/**
 * db maintenance console
 * @author adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js');
var trackModel = require('../../models/track.js');
var snip = require('../../snip.js');
var FileController = require('./FileController.js');

function wrapJsonGeneratorToText(name) {
  return function (p, cb) {
    fileGenerators[name](p, function (items) {
      cb(JSON.stringify(items, null, 2));
    });
  };
}

function wrapJsonGeneratorToCsv(name) {
  return function (p, cb) {
    fileGenerators[name](p, function (items) {
      var table = new snip.DataTable().fromMap(items);
      //table.header = ["source", "tracks added", "unique users"];
      cb({ csv: table.toCsv() });
    });
  };
}

function fetchUidList(cb) {
  mongodb.collections['post'].distinct('uId', {}, function (err, uidList) {
    cb(uidList);
  });
}

function cleanUidList(uidList) {
  var uids = [];
  for (let i in uidList)
    if (mongodb.isObjectId(uidList[i]))
      try {
        uids.push(mongodb.ObjectId('' + uidList[i]));
      } catch (e) {
        console.error(e);
      }
  //console.log(uids);
  return uids;
}

function listMissingUsers(uids, cb) {
  var users = [];
  mongodb.forEach(
    'user',
    { q: { _id: { $nin: uids } }, fields: { _id: 1, name: 1 } },
    function (user) {
      users.push(user);
    },
    cb,
    users
  );
}

var fileGenerators = {
  refreshTrackCollection: function (p, cb) {
    trackModel.refreshTrackCollection(function (r) {
      console.log('refreshTrackCollection => ', r || { ok: 'done' });
    });
    cb('refreshing track collection...');
  },
  snapshotTrackScores: function (p, cb) {
    trackModel.snapshotTrackScores(function (r) {
      console.log('snapshotTrackScores => ', r || { ok: 'done' });
    });
    cb('refreshing track trends...');
  },
  'listUsersWithoutPosts.html': function (p, cb) {
    fetchUidList(function (uidList) {
      listMissingUsers(cleanUidList(uidList), function (users) {
        cb({
          html: new snip.DataTable().fromMap(users).toHtml(true),
        });
      });
    });
  },
  'find.json': function (p, cb) {
    var col = mongodb.collections[p.col];
    delete p.col;
    if (!col) cb({ error: 'invalid col parameter' });
    else {
      // clean query (from GET parameters) first
      var limit = p.limit || 100;
      if (p.limit) delete p.limit;
      if (p._subCtr) delete p._subCtr;
      if (p.action) delete p.action;
      if (p.loggedUser) delete p.loggedUser;
      if (p._id) p._id = mongodb.ObjectId(p._id);
      for (let i in p) {
        if (p[i] == '$exists') p[i] = { $exists: true };
      }
      console.log('query:', p);
      col.find(p, { limit: limit }, function (error, cursor) {
        if (error) cb({ error: error });
        else
          cursor.toArray(function (error, items) {
            if (error) cb({ error: error });
            else cb(items);
          });
      });
    }
  },
  'find.txt': wrapJsonGeneratorToText('find.json'),
  'find.csv': wrapJsonGeneratorToCsv('find.json'),
};

exports.controller = FileController.buildController({
  controllerName: 'admin.db',
  adminOnly: true,
  fileGenerators: fileGenerators,
});
