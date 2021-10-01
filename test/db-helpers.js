const fs = require('fs');
const { promisify } = require('util');
const mongodb = require('mongodb');
const request = require('request');

async function readMongoDocuments(file) {
  const ISODate = (d) => new Date(d);
  const ObjectId = (id) => mongodb.ObjectID.createFromHexString(id);
  return eval(await fs.promises.readFile(file, 'utf-8'));
}

async function insertTestData(url, docsPerCollection) {
  const mongoClient = await mongodb.MongoClient.connect(url);
  const db = mongoClient.db();
  await Promise.all(
    Object.keys(docsPerCollection).map(async (collection) => {
      await db.collection(collection).deleteMany({});
      await db.collection(collection).insertMany(docsPerCollection[collection]);
    })
  );
  await mongoClient.close();
}

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix = 'http://localhost:8080') {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

module.exports = {
  readMongoDocuments,
  insertTestData,
  refreshOpenwhydCache,
};