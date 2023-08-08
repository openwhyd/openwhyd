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
  var host = params.mongoDbHost || process.env.MONGODB_HOST;
  var port = params.mongoDbPort || process.env.MONGODB_PORT;
  var authUser = params.mongoDbAuthUser || process.env.MONGODB_USER;
  var authPassword = params.mongoDbAuthPassword || process.env.MONGODB_PASS;
  var authStr =
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
    var remaining = collections.length;
    const cacheCollection = (colName) => {
      db.collections[colName] = db.collection(colName);
      if (0 == --remaining) callback(null, db);
    };
    for (let i in collections) {
      cacheCollection(collections[i].collectionName);
      // cacheCollection will mutate remaining, and callback when remaining == 0
    }
  });
};

const initMongo = (params, callback) => {
  var url = makeConnUrl(params) + '/' + dbName;
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
