// @ts-check

const util = require('util');
const childProcess = require('child_process');
const request = require('request');
const { loadEnvVars, resetTestDb } = require('./fixtures');
const {
  dumpMongoCollection,
  insertTestData,
  connectToMongoDB,
} = require('./approval-tests-helpers');

const { promisify } = util;

/** Refresh openwhyd's in-memory cache of users, e.g. to allow freshly added users to login. */
async function refreshOpenwhydCache(urlPrefix) {
  const res = await promisify(request.post)(urlPrefix + '/testing/refresh');
  if (res.statusCode !== 200)
    throw new Error(res.body ?? 'non-200 status code');
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

/** @returns {Promise<childProcess.ChildProcessWithoutNullStreams>} serverProcess */
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
    serverProcess.on('error', reject);
    serverProcess.stderr.on('data', errPrinter);
    serverProcess.stdout.on('data', (str) => {
      if (process.env.DEBUG) errPrinter(str);
      if (str.includes('Server running')) resolve(serverProcess);
    });
  });

/**
 * @param {childProcess.ChildProcessWithoutNullStreams} serverProcess
 */
const stopOpenwhyd = (serverProcess) =>
  new Promise((resolve) => {
    if (serverProcess.exitCode !== null) return resolve();
    serverProcess.on('close', resolve);
    const killed =
      withCoverage() && serverProcess.pid
        ? process.kill(-serverProcess.pid, 'SIGINT')
        : serverProcess.kill(/*'SIGTERM'*/);
    if (!killed) throw new Error('🧟‍♀️ failed to kill childprocess!');
  });

/**
 * Manages the environment and execution of Openwhyd server and its database, for automated tests.
 * The goal is to make automated tests easier to write, by abstracting technical details about the backend under test.
 */
class OpenwhydTestEnv {
  /**
   * If `startWithEnv` is provided, `setup()` will start Openwhyd's server programmatically,
   * by reading environment variables from the corresponding file.
   * Otherwise, please provide the `port` on which Openwhyd is currently running.
   * @param {{ startWithEnv: string, withMockAuth0?: boolean } | { port: string, withMockAuth0?: boolean }} options
   */
  constructor(options) {
    this.options = options;
    this.env = null;
    this.serverProcess = null;
    this.mongoClient = null;
    this.mockAuth0 = null;
  }

  /**
   * Start Openwhyd, if `startWithEnv` was provided at time of instanciation.
   * If `withMockAuth0` option is true, also start a mock Auth0 server.
   * Don't forget:
   * - call `reset()` to clear and (re)initialize Openwhyd's database, before each test;
   * - call `refreshCache()` after every modification to the `user` collection;
   * - call `release()` to stop Openwhyd, when you're done testing.
   */
  async setup() {
    // Start mock Auth0 server if requested
    if (this.options.withMockAuth0) {
      const { MockAuth0Server } = require('./MockAuth0Server.js');
      this.mockAuth0 = new MockAuth0Server();
      await this.mockAuth0.start(18082); // Use a fixed port for consistency
    }

    if ('startWithEnv' in this.options && this.options.startWithEnv) {
      this.env = {
        ...(await loadEnvVars(this.options.startWithEnv)),
        ...process.env, // allow overrides
      };
      
      // If mock Auth0 is running, override Auth0 env vars
      if (this.mockAuth0) {
        Object.assign(this.env, this.mockAuth0.getEnvVars());
      }
      
      this.serverProcess = await startOpenwhydServerWith(this.env);
    } else {
      this.env = { ...process.env };
      if ('port' in this.options && this.options.port)
        this.env.WHYD_PORT = this.options.port;
      if (!this.env.WHYD_PORT)
        throw new Error('please provide startWithEnv or port');
      
      // If mock Auth0 is running, override Auth0 env vars
      if (this.mockAuth0) {
        Object.assign(this.env, this.mockAuth0.getEnvVars());
      }
      
      await refreshOpenwhydCache(this.getURL());
    }
  }

  /** Stop Openwhyd, if startWithEnv was provided at time of instanciation. */
  async release() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    if (this.serverProcess) {
      await stopOpenwhyd(this.serverProcess);
    }
    if (this.mockAuth0) {
      await this.mockAuth0.stop();
    }
  }

  /** Return the environment variables used by Openwhyd. */
  getEnv() {
    if (!this.env) throw new Error('please call setup() before getEnv()');
    return this.env;
  }

  /** Return the URL of the Openwhyd server. */
  getURL() {
    return `http://localhost:${this.getEnv().WHYD_PORT}`;
  }

  /** Return the mock Auth0 server instance, if it was started. */
  getMockAuth0() {
    return this.mockAuth0;
  }

  getMongoClient() {
    if (!this.mongoClient) {
      this.mongoClient = connectToMongoDB(this.getEnv().MONGODB_URL);
    }
    return this.mongoClient;
  }

  /** Return the documents of the provided MongoDB collection. */
  async dumpCollection(collection) {
    return await dumpMongoCollection(this.getEnv().MONGODB_URL, collection);
  }

  /** Clears and (re)initializes Openwhyd's database, for testing. */
  async reset() {
    if (!this.env) throw new Error('please call setup() before reset()');
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

module.exports = { OpenwhydTestEnv };
