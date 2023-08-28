// @ts-check

const util = require('util');
const mongodb = require('mongodb');
const request = require('request');
const childProcess = require('child_process');
const { loadEnvVars, resetTestDb } = require('./fixtures');
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
  get({ url, cookies }) {
    return promisify(request.get)({ uri: url, jar: cookies }).then(
      ({ body, headers }) => ({
        body,
        cookies: extractCookieJar(headers, new URL(url).origin),
      }),
    );
  },
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

const errPrinter = ((blocklist) => {
  return (chunk) => {
    const message = chunk.toString();
    if (process.env.DEBUG || !blocklist.some((term) => message.includes(term)))
      console.error(message);
  };
})([
  'server.close => OK',
  'closing server',
  'deprecated',
  'gm: command not found',
  'convert: command not found',
  'please install graphicsmagick',
]);

const withCoverage = () => process.env.COVERAGE === 'true';

/** @returns {Promise<childProcess.ChildProcessWithoutNullStreams & {exit: () => Promise<void>}>} */
const startOpenwhydServerWith = async (env) =>
  new Promise((resolve, reject) => {
    const serverProcess = withCoverage()
      ? childProcess.spawn('npm', ['run', 'start:coverage:no-clean'], {
          env: { ...env, PATH: process.env.PATH },
          shell: true,
          detached: true, // when running on CI, we need this to kill the process group using `process.kill(-serverProcess.pid)`
        })
      : childProcess.fork(
          './app.js',
          ['--fakeEmail', '--digestInterval', '-1'],
          {
            env,
            silent: true, // necessary to initialize serverProcess.stderr
          },
        );
    // @ts-ignore
    serverProcess.URL = `http://localhost:${env.WHYD_PORT}`;
    // @ts-ignore
    serverProcess.exit = () =>
      new Promise((resolve) => {
        if (serverProcess.exitCode !== null) return resolve();
        serverProcess.on('close', resolve);
        const killed =
          withCoverage() && serverProcess.pid
            ? process.kill(-serverProcess.pid, 'SIGINT')
            : serverProcess.kill(/*'SIGTERM'*/);
        if (!killed) throw new Error('🧟‍♀️ failed to kill childprocess!');
      });
    serverProcess.on('error', reject);
    serverProcess.stderr.on('data', errPrinter);
    serverProcess.stdout.on('data', (str) => {
      if (process.env.DEBUG) errPrinter(str);
      // @ts-ignore
      if (str.includes('Server running')) resolve(serverProcess);
    });
  });

/* Refresh openwhyd's in-memory cache of users, e.g. to allow freshly added users to login. */
async function refreshOpenwhydCache(urlPrefix) {
  const res = await promisify(request.post)(urlPrefix + '/testing/refresh');
  if (res.statusCode !== 200)
    throw new Error(res.body ?? 'non-200 status code');
}

/** @param {{startWithEnv:unknown, port?: number | string | undefined}} options */
async function startOpenwhydServer({ startWithEnv, port }) {
  if (port) {
    const URL = `http://localhost:${port}`;
    await refreshOpenwhydCache(URL);
    return { URL };
  } else if (startWithEnv) {
    const env = {
      ...(await loadEnvVars(startWithEnv)),
      ...process.env, // allow overrides
    };
    return { ...(await startOpenwhydServerWith(env)), env }; // returns serverProcess instance with additional URL property (e.g. http://localhost:8080)
  }
}

class OpenwhydTestEnv {
  /**
   * If port is not provided, OpenwhydTestEnv will start Openwhyd's server programmatically,
   * reading environment variables from the file provided in startWithEnv.
   * @param {{ startWithEnv: string } | { port: number | string }} options
   */
  constructor(options) {
    this.options = options;
    this.isSetup = false;
  }

  /** Start Openwhyd, if startWithEnv was provided at time of instanciation. */
  async setup() {
    if ('startWithEnv' in this.options)
      this.serverProcess = await startOpenwhydServer(this.options);
    this.isSetup = true;
  }

  /** Stop Openwhyd, if startWithEnv was provided at time of instanciation. */
  async release() {
    if (this.serverProcess && 'exit' in this.serverProcess)
      await this.serverProcess.exit();
  }

  /** Return the environment variables used by Openwhyd. */
  getEnv() {
    return this.serverProcess && 'env' in this.serverProcess
      ? this.serverProcess.env
      : process.env;
  }

  /** Return the URL of the Openwhyd server. */
  getURL() {
    return `http://localhost:${this.getEnv().WHYD_PORT}`;
  }

  /** Return the documents of the provided MongoDB collection. */
  async dumpCollection(collection) {
    return await dumpMongoCollection(this.getEnv().MONGODB_URL, collection);
  }

  /** Clears and (re)initializes Openwhyd's database, for testing. */
  async reset() {
    if (!this.isSetup) throw new Error('please call setup() before reset()');
    await resetTestDb({ silent: true, env: this.getEnv() });
    await this.refreshCache();
  }

  /* Refresh openwhyd's in-memory cache of users, e.g. to allow freshly added users to login. */
  async refreshCache() {
    await refreshOpenwhydCache(this.getURL());
  }

  /** Clear and populate MongoDB collections with the provided documents. */
  async insertTestData(docsPerCollection) {
    await insertTestData(this.getEnv().MONGODB_URL, docsPerCollection);
    if ('user' in docsPerCollection) await this.refreshCache();
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
  OpenwhydTestEnv,
};
