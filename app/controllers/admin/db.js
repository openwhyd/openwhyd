/**
 * db maintenance console
 * @author adrienjoly, whyd
 **/

const mongodb = require('../../models/mongodb.js');
const snip = require('../../snip.js');
const FileController = require('./FileController.js');

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
      const table = new snip.DataTable().fromMap(items);
      //table.header = ["source", "tracks added", "unique users"];
      cb({ csv: table.toCsv() });
    });
  };
}

async function fetchUidList() {
  return await mongodb.collections['post'].distinct('uId', {});
}

function cleanUidList(uidList) {
  const uids = [];
  for (const i in uidList)
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
  const users = [];
  mongodb.forEach(
    'user',
    { q: { _id: { $nin: uids } }, fields: { _id: 1, name: 1 } },
    function (user) {
      users.push(user);
    },
    cb,
    users,
  );
}

var fileGenerators = {
  'listUsersWithoutPosts.html': async function (p, cb) {
    const uidList = await fetchUidList();
    listMissingUsers(cleanUidList(uidList), function (users) {
      cb({
        html: new snip.DataTable().fromMap(users).toHtml(true),
      });
    });
  },
  'find.json': async function (p, cb) {
    const col = mongodb.collections[p.col];
    delete p.col;
    if (!col) {
      cb({ error: 'invalid col parameter' });
      return;
    }

    try {
      // clean query (from GET parameters) first
      const limit = p.limit || 100;
      if (p.limit) delete p.limit;
      if (p._subCtr) delete p._subCtr;
      if (p.action) delete p.action;
      if (p.loggedUser) delete p.loggedUser;
      if (p._id) p._id = mongodb.ObjectId(p._id);
      for (const i in p) {
        if (p[i] == '$exists') p[i] = { $exists: true };
      }
      console.log('query:', p);

      const cursor = col.find(p).limit(limit);
      const items = await cursor.toArray();
      cb(items);
    } catch (error) {
      cb({ error });
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
