// @ts-check

/**
 * mongodb model
 * wraps a accessor to collections of a mongodb database
 * @author adrienjoly, whyd
 **/

const fs = require('fs');
const util = require('node:util');
const mongodb = require('mongodb');
const shellRunner = require('./mongodb-shell-runner.js');
let userModel = null; // require("./user.js") will be lazy-loaded here

const DB_INIT_SCRIPT = './config/initdb.js';
const DB_TEST_SCRIPT = './config/initdb_testing.js';

let isTesting = false;

exports.isObjectId = function (i) {
  return mongodb.ObjectId.isValid('' + i);
};

// used to be called USER_CACHE_FIELDS renamed and moved to models/user.js

/** @typedef {import('../infrastructure/mongodb/types.js').UserDocument} UserDocument */
/** @type {{ user?: import("mongodb").Collection<UserDocument> } & Record<string, import("mongodb").Collection>} */
exports.collections = {};

// usernames export removed - use fetchAndProcessUserById from user.js instead

/** @param { ConstructorParameters<typeof mongodb.ObjectId>[0] } inputId */
exports.ObjectId = (inputId) => {
  try {
    return new mongodb.ObjectId(inputId);
  } catch (err) {
    err.message += ` (value: ${inputId})`;
    throw err;
  }
};

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

exports.getPublicProfileFromId = async function (uid) {
  userModel = userModel || require('./user.js');
  const user = await userModel.fetchAndProcessUserById(uid);
  return !user
    ? undefined
    : {
        _id: user._id,
        name: user.name,
      };
};

// cacheUser and cacheUsers functions removed - use fetchAndProcessUserById from user.js instead

/** @deprecated because the cursor cannot be released until results are exhausted. */
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
  const cursor = exports.collections[colName]
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
        console.trace('[db] mongodb.forEach2 ERROR', err);
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
exports.runShellScript = async function (script) {
  return await shellRunner.runScriptOnDatabase(script, exports._db);
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

exports.initCollections = async function ({ addTestData = false } = {}) {
  const dbInitScripts = [DB_INIT_SCRIPT];
  if (addTestData) {
    if (!isTesting) {
      throw new Error('allowed on test database only');
    } else {
      dbInitScripts.push(DB_TEST_SCRIPT); // will create the admin user + some fake data for automated tests
    }
  }
  for (const initScript of dbInitScripts) {
    console.log('[db] Applying db init script:', initScript, '...');
    await exports.runShellScript(await fs.promises.readFile(initScript, 'utf8'));
  }
  // all db init scripts were interpreted => continue app init
  await util.promisify(exports.cacheCollections)();
  console.log('[db] ready for queries');
};

/**
 * @param {{ mongoDbHost: string, mongoDbPort: string, mongoDbDatabase: string, mongoDbAuthUser?: string, mongoDbAuthPassword?: string }} connParams
 * @param {(err: null, db: mongodb.Db) => any} readyCallback
 */
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
  return module.exports;
};
