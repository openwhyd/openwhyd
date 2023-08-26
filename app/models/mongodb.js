// @ts-check

/**
 * mongodb model
 * wraps a accessor to collections of a mongodb database
 * @author adrienjoly, whyd
 **/

const fs = require('fs');
const mongodb = require('mongodb');
const async = require('async');
const shellRunner = require('./mongodb-shell-runner.js');
let userModel = null; // require("./user.js") will be lazy-loaded here

const DB_INIT_SCRIPT = './config/initdb.js';
const DB_TEST_SCRIPT = './config/initdb_testing.js';

let isTesting = false;

exports.isObjectId = function (i) {
  //return isNaN(i);
  return ('' + i).length == 24;
};

const USER_CACHE_FIELDS = {
  _id: 1,
  fbId: 1,
  name: 1,
  img: 1,
  email: 1,
  digest: 1,
  iBy: 1,
  handle: 1,
  pref: 1, // needed by mainTemplate
  lastFm: 1, // needed by mainTemplate
};

/** @type Record<string, import("mongodb").Collection> */
exports.collections = {};

/** @deprecated */
exports.usernames = {};

/** @param { ConstructorParameters<typeof mongodb.ObjectId>[0] } inputId */
exports.ObjectId = (inputId) => new mongodb.ObjectId(inputId);

// http://www.mongodb.org/display/DOCS/Object+IDs#ObjectIDs-DocumentTimestamps
exports.dateToHexObjectId = function (date) {
  const seconds = Math.round(date.getTime() / 1000);
  let t = seconds.toString(16); // translate into hexadecimal representation
  t = t + '0000000000000000'; // add null values for 8 other bytes
  while (
    t.length <
    2 * 12 // pad with leading zeroes, to reach 12 bytes
  )
    t = '0' + t;
  return t;
};

// other way around: _id.getTimestamp() // _id.generationTime IS DEPRECATED;

exports.getUserFromId = function (uid) {
  return exports.usernames['' + uid];
};

exports.getUserNameFromId = function (uid) {
  return (exports.usernames['' + uid] || {}).name;
};

exports.getPublicProfileFromId = function (uid) {
  const user = exports.usernames['' + uid];
  return !user
    ? undefined
    : {
        _id: user._id,
        name: user.name,
      };
};

exports.cacheUser = function (user) {
  if (!user) return console.log('[db] WARNING: trying to cache a null user!');
  user.id = '' + (user._id || user.id);
  exports.usernames[user.id] = exports.usernames[user.id] || {};
  exports.usernames[user.id].id = user.id;
  for (const i in user)
    if (USER_CACHE_FIELDS[i])
      exports.usernames[user.id][i] = user[i] || exports.usernames[user.id][i];
};

exports.cacheUsers = function (callback) {
  userModel = userModel || require('./user.js');
  userModel.fetchMulti(
    {},
    { projection: USER_CACHE_FIELDS },
    function (results) {
      for (const i in results) exports.cacheUser(results[i]);
      if (callback) callback();
    },
  );
};

exports.forEach = async function (colName, params, handler, cb, cbParam) {
  let q = {};
  params = params || {};
  if (!params.batchSize) params.batchSize = 1000;
  if (params.q) {
    q = params.q;
    delete params.q;
  }
  const { fields } = params ?? {};
  if (params) delete params.fields;
  const cursor = await exports.collections[colName]
    .find(q, params)
    .project(fields ?? {});
  for await (const item of cursor) {
    if (item) handler(item);
  }
  cb && cb(cbParam);
};

// handler is responsible for calling the provided "next" function
exports.forEach2 = async function (colName, params, handler) {
  let q = {};
  params = params || {};
  if (!params.batchSize) params.batchSize = 100;
  if (params.q) {
    q = params.q;
    delete params.q;
  }
  if (params.after != null && exports.isObjectId(params.after))
    q._id = { $lt: exports.ObjectId('' + params.after) };

  const { fields } = params ?? {};
  if (params) delete params.fields;
  const cursor = await exports.collections[colName]
    .find(q, params)
    .project(fields ?? {});
  (function next() {
    cursor.next().then(
      (item) => {
        handler(item, item ? next : undefined, (cb) =>
          cursor.close().then(cb, cb),
        );
        // TODO: close the cursor whenever we've run out of documents?
      },
      (err) => {
        console.error('[db] mongodb.forEach2 ERROR', err);
        handler({ error: err }, undefined, (cb) => cursor.close().then(cb, cb));
        cursor.close(); // TODO: prevent closing twice?
      },
    );
  })();
};

exports.cacheCollections = function (callback) {
  function finishInit() {
    callback.call(module.exports, null, exports._db);
  }
  // diagnostics and collection caching
  exports._db.collections().then(
    function (collections) {
      if (0 == collections.length) finishInit();
      let remaining = collections.length;
      for (const i in collections) {
        const queryHandler = (function () {
          const table = collections[i].collectionName;
          return function (err) {
            if (err) console.error(`[db] cacheCollections error:`, err);
            // console.log('[db]  - found table: ' + table + ' : ' + result + ' rows');
            exports.collections[table] = exports._db.collection(table);
            if (0 == --remaining) finishInit();
          };
        })();
        collections[i].countDocuments(queryHandler);
      }
    },
    (err) => console.trace('[db] MongoDB Error : ' + err),
  );
};

// this method runs the commands of a mongo shell script (e.g. initdb.js)
exports.runShellScript = function (script, callback) {
  return shellRunner.runScriptOnDatabase(script, exports._db, callback);
};

exports.clearCollections = async function () {
  if (!isTesting) {
    throw new Error('allowed on test database only');
  } else {
    for (const name in exports.collections) {
      await exports.collections[name].deleteMany({});
    }
  }
};

exports.initCollections = function ({ addTestData = false } = {}) {
  return new Promise((resolve, reject) => {
    const dbInitScripts = [DB_INIT_SCRIPT];
    if (addTestData) {
      if (!isTesting) {
        return reject(new Error('allowed on test database only'));
      } else {
        dbInitScripts.push(DB_TEST_SCRIPT); // will create the admin user + some fake data for automated tests
      }
    }
    async.eachSeries(
      dbInitScripts,
      function (initScript, nextScript) {
        console.log('[db] Applying db init script:', initScript, '...');
        exports.runShellScript(fs.readFileSync(initScript), function (err) {
          if (err) console.error(err);
          nextScript(err);
        });
      },
      function (err) {
        if (err) reject(err);
        // all db init scripts were interpreted => continue app init
        exports.cacheCollections(function () {
          console.log('[db] ready for queries => now caching users...');
          exports.cacheUsers(function () {
            console.log('[db] done caching users');
            resolve();
          });
        });
      },
    );
  });
};

/** @param {{ mongoDbHost: string, mongoDbPort: string, mongoDbDatabase: string, mongoDbAuthUser?: string, mongoDbAuthPassword?: string }} connParams */
exports.init = function (connParams, readyCallback) {
  isTesting = connParams.mongoDbDatabase === 'openwhyd_test';
  const dbName = connParams.mongoDbDatabase;
  const host = connParams.mongoDbHost;
  const port = connParams.mongoDbPort;
  const authUser = connParams.mongoDbAuthUser;
  const authPassword = connParams.mongoDbAuthPassword;

  let authStr = '';
  if (authUser && authPassword)
    authStr =
      encodeURIComponent(authUser) +
      ':' +
      encodeURIComponent(authPassword) +
      '@';

  const url = 'mongodb://' + authStr + host + ':' + port + '/' + dbName; // + "?w=1";

  const publicURL = authPassword ? url.replace(authPassword, '***') : url;

  console.log(`[db] Connecting to ${publicURL} ...`);

  /** @type mongodb.MongoClientOptions */
  const options = {
    writeConcern: {
      w: 'majority', // write concern: (value of > -1 or the string 'majority'), where < 1 means no write acknowlegement
    },
  };

  const client = new mongodb.MongoClient(url, options);

  exports._db = client.db(dbName);

  console.log(`[db] Successfully connected to ${publicURL}`);
  readyCallback.call(module.exports, null, exports._db);
};
