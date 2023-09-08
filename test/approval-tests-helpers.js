// @ts-check

const util = require('util');
const mongodb = require('mongodb');
const request = require('request');
const { loadEnvVars } = require('./fixtures');
const { promisify } = util;

const makeJSONScrubber = (scrubbers) => (obj) =>
  JSON.parse(
    scrubbers.reduce((data, scrub) => scrub(data), JSON.stringify(obj)),
  );

function extractCookieJar(headers, origin) {
  const jar = request.jar();
  if (((headers || {})['set-cookie'] || []).length) {
    jar.setCookie(request.cookie(headers['set-cookie'][0]), origin);
  }
  return jar;
}

const httpClient = {
  /**
   * @param {object} params
   * @param {string} params.url
   * @param {string} [params.cookies]
   * @returns {Promise<{ body: string, headers: Record<string, string> }>}
   */
  get({ url, cookies }) {
    return promisify(request.get)({ uri: url, jar: cookies }).then(
      ({ body, headers }) => ({
        body,
        cookies: extractCookieJar(headers, new URL(url).origin),
      }),
    );
  },

  /**
   * @param {object} params
   * @param {string} params.url
   * @param {object | string} params.body
   * @param {*} [params.headers]
   * @param {string} [params.cookies]
   * @returns {Promise<{ body: string, cookies: unknown }>}
   */
  post({ url, body, headers, cookies }) {
    if (typeof body === 'object') {
      body = JSON.stringify(body);
      headers = {
        ...headers,
        'content-type': 'application/json',
        'content-length': body.length,
      };
    }
    return promisify(request.post)({
      uri: url,
      body,
      headers,
      jar: cookies,
    }).then(({ body, headers }) => ({
      body,
      cookies: extractCookieJar(headers, new URL(url).origin),
    }));
  },
};

function connectToMongoDB(url) {
  return new mongodb.MongoClient(url);
}

const ObjectId = (id) => new mongodb.ObjectId(id);

async function readMongoDocuments(file) {
  const ISODate = (d) => new Date(d);
  return require(file)({ ObjectId, ISODate });
}

/** Important: don't forget to call refreshOpenwhydCache() after mutating the `user` collection. */
async function insertTestData(url, docsPerCollection) {
  const mongoClient = await connectToMongoDB(url);
  const db = mongoClient.db();
  await Promise.all(
    Object.keys(docsPerCollection).map(async (collection) => {
      await db.collection(collection).deleteMany({});
      const docs = docsPerCollection[collection];
      if (docs.length > 0) await db.collection(collection).insertMany(docs);
    }),
  );
  await mongoClient.close();
}

async function dumpMongoCollection(url, collection) {
  const mongoClient = await connectToMongoDB(url);
  const db = mongoClient.db();
  const documents = await db.collection(collection).find({}).toArray();
  await mongoClient.close();
  return documents;
}

function indentJSON(json) {
  return util.inspect(typeof json === 'string' ? JSON.parse(json) : json, {
    sorted: true,
    compact: false,
    depth: Infinity,
    breakLength: Infinity,
    maxArrayLength: Infinity,
    maxStringLength: Infinity,
  });
}

/** This function serializes `new ObjectId` instances into objects. */
function sortAndIndentAsJSON(obj) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class ObjectId {
    constructor(id) {
      this._bsontype = 'ObjectID';
      this.id = id;
    }
  }
  return eval(indentJSON(obj));
}

function getCleanedPageBody(body) {
  try {
    return JSON.parse(body);
  } catch (err) {
    return body
      .replace(/(src|href)="(.*\.[a-z]{2,3})\?\d+\.\d+\.\d+"/g, '$1="$2"') // remove openwhyd version from paths to html resources, to reduce noise in diff
      .replace(/>[a-zA-Z]+ \d{4}/g, '>(age)') // remove date of posts, because it depends on the time when tests are run
      .replace(/>\d+ (second|minute|hour|day|month|year)s?( ago)?/g, '>(age)'); // remove age of posts, because it depends on the time when tests are run
  }
}

module.exports = {
  makeJSONScrubber,
  loadEnvVars,
  httpClient,
  ObjectId,
  connectToMongoDB,
  readMongoDocuments,
  dumpMongoCollection,
  insertTestData,
  indentJSON,
  sortAndIndentAsJSON,
  getCleanedPageBody,
};
