const mongodb = require('../../whydJS/app/models/mongodb.js');

const DEFAULT_PARAMS = {
  mongoDbDatabase: process.env.MONGODB_DATABASE,
  mongoDbHost: process.env.MONGODB_HOST,
  mongoDbPort: process.env.MONGODB_PORT,
  mongoDbAuthUser: process.env.MONGODB_USER,
  mongoDbAuthPassword: process.env.MONGODB_PASS,
};

const init = (params) => new Promise((resolve, reject) => {
  process.appParams = Object.assign({}, DEFAULT_PARAMS, params);
  mongodb.init(function(err) {
    if (err) {
      reject(err);
    } else {
      const db = this;
      db.cacheCollections(() => resolve(db));
    }
  });
});

const forEachObject = (coll, handler, options = {}) => new Promise((resolve, reject) => {
  let count = 0;
  const interval = setInterval(() => console.log('fetching...', count), 1000);
  // options.batchSize = options.batchSize || 100;
  // options.cursorDelay = options.cursorDelay || 0;
  coll.find({}, options, function(err, cursor) {
    const onObject = (err, obj) => {
      if (err) {
        clearInterval(interval);
        reject(err);
      } else if (obj) {
        ++count;
        handler(obj);
        setTimeout(() => cursor.nextObject(onObject), 0);
      } else {
        clearInterval(interval);
        resolve();
      }
    };
    cursor.nextObject(onObject);
  });
});

module.exports = {
  init,
  forEachObject,
};
