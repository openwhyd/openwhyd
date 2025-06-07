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

const initMongo = async (params) => {
  const url = makeConnUrl(params) + '/' + dbName;
  var dbName = params.mongoDbDatabase || process.env.MONGODB_DATABASE;
  console.log('Connecting to ' + url + '...');
  const client = new mongodb.MongoClient(url, MONGO_OPTIONS);
  const db = client.db(dbName);
  return db;
};

const init = async (params) => {
  const db = await initMongo(params);
  console.log('MongoDB model is now ready for queries!');
  return db;
};

/**
 * @param {mongodb.Collection} coll
 * @param {(doc: mongodb.WithId<mongodb.Document>) => Promise<void>} handler
 * @param {mongodb.FindOptions} options
 */
const forEachObject = async (coll, handler, options = {}) => {
  const progress = new Progress({ label: 'fetching from mongodb...' });
  // options.batchSize = options.batchSize || 100;
  // options.cursorDelay = options.cursorDelay || 0;
  const cursor = await coll.find({}, options);
  await cursor.forEach((obj) => {
    progress.incr();
    handler(obj);
  });
};

module.exports = {
  init,
  forEachObject,
};
