// @ts-check

const mongodb = require('mongodb');
const Progress = require('./Progress');

/** @type mongodb.MongoClientOptions */
const MONGO_OPTIONS = {
  writeConcern: {
    w: 'majority', // write concern: (value of > -1 or the string 'majority'), where < 1 means no write acknowlegement
  },
};

const makeConnUrl = (params) => {
  const host = params.mongoDbHost || process.env.MONGODB_HOST;
  const port = params.mongoDbPort || process.env.MONGODB_PORT;
  const authUser = params.mongoDbAuthUser || process.env.MONGODB_USER;
  const authPassword = params.mongoDbAuthPassword || process.env.MONGODB_PASS;
  const authStr =
    authUser && authPassword
      ? encodeURIComponent(authUser) +
        ':' +
        encodeURIComponent(authPassword) +
        '@'
      : '';
  return 'mongodb://' + authStr + host + ':' + port;
};

// populates db.<collection_name>, for each collection
const cacheCollections = function (db, callback) {
  db.collections(function (err, collections) {
    if (err || 0 == collections.length) {
      callback(err, db);
      return;
    }
    let remaining = collections.length;
    const cacheCollection = (colName) => {
      db.collections[colName] = db.collection(colName);
      if (0 == --remaining) callback(null, db);
    };
    for (const i in collections) {
      cacheCollection(collections[i].collectionName);
      // cacheCollection will mutate remaining, and callback when remaining == 0
    }
  });
};

const initMongo = (params, callback) => {
  const url = makeConnUrl(params) + '/' + dbName;
  var dbName = params.mongoDbDatabase || process.env.MONGODB_DATABASE;
  console.log('Connecting to ' + url + '...');
  const client = new mongodb.MongoClient(url, MONGO_OPTIONS);
  const db = client.db(dbName);
  cacheCollections(db, callback); // will mutate db and callback
};

const init = (params) =>
  new Promise((resolve, reject) => {
    initMongo(params, function (err, db) {
      if (err) {
        reject(err);
      } else {
        console.log('MongoDB model is now ready for queries!');
        resolve(db);
      }
    });
  });

const forEachObject = (coll, handler, options = {}) =>
  new Promise((resolve, reject) => {
    const progress = new Progress({ label: 'fetching from mongodb...' });
    // options.batchSize = options.batchSize || 100;
    // options.cursorDelay = options.cursorDelay || 0;
    coll.find({}, options).then(function (cursor) {
      const onObject = (err, obj) => {
        if (err) {
          progress.done();
          reject(err);
        } else if (obj) {
          progress.incr();
          handler(obj);
          setTimeout(() => cursor.next(onObject), 0);
        } else {
          progress.done();
          resolve();
        }
      };
      cursor.next(onObject);
    });
  });

module.exports = {
  init,
  forEachObject,
};
