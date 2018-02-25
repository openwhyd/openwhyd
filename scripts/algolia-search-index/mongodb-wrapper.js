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
  coll.find({}, options, function(err, cursor) {
    const onObject = (err, obj) => {
      if (err) {
        reject(err);
      } else if (obj) {
        handler(obj)
        cursor.nextObject(onObject);
      } else {
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
