//@ts-check

const fs = require('fs');
const childProcess = require('child_process');

const readFile = (file) => fs.promises.readFile(file, 'utf-8');

exports.loadEnvVarsFromString = (str) => {
  const envVars = {};
  str
    .split(/[\r\n]+/)
    .map((line) => line.split('#')[0].trim()) // strip comments
    .forEach((envVar) => {
      if (!envVar) return;
      const [key, def] = envVar.split('=');
      envVars[key] = def.replace(/(^")|("$)/g, '');
    });
  return envVars;
};

exports.loadEnvVars = async (file) => {
  return exports.loadEnvVarsFromString(await readFile(file));
};

exports.FAKE_ID = 'a0000000000000000000000a';

// inserted by config/initdb_testing.js
exports.ADMIN_USER = Object.freeze({
  id: '000000000000000000000001',
  email: process.env.WHYD_ADMIN_EMAIL || 'test@openwhyd.org',
  name: 'admin',
  username: 'admin',
  password: 'admin',
  pwd: '21232f297a57a5a743894a0e4a801fc3', // MD5 hash of password
  md5: '21232f297a57a5a743894a0e4a801fc3', // MD5 hash of password
});

// inserted by config/initdb_testing.js
exports.DUMMY_USER = Object.freeze({
  id: '000000000000000000000002',
  email: 'dummy@openwhyd.org',
  name: 'dummy',
  handle: 'dummy',
  password: 'admin',
  pwd: '21232f297a57a5a743894a0e4a801fc3', // MD5 hash of password
  md5: '21232f297a57a5a743894a0e4a801fc3', // MD5 hash of password
});

exports.TEST_USER = Object.freeze({
  email: 'test-user@openwhyd.org',
  name: 'Test User',
  username: 'test-user',
  password: 'test-user', // for the /register api endpoint
  pwd: '42b27efc1480b4fe6d7eaa5eec47424d', // MD5 hash of password
  md5: '42b27efc1480b4fe6d7eaa5eec47424d', // MD5 hash of password
});

/**
 * Clears and (re)initializes Openwhyd's database, for automated tests.
 * Call this before each test to prevent side effects between tests.
 * Requires MONGODB_HOST and MONGODB_PORT env vars.
 * @param {object} opts
 * @param {typeof process.env} opts.env - environment variables to pass to Openwhyd server
 * @param {boolean} opts.silent - if true, no logs from Openwhyd server will be displayed
 */
exports.resetTestDb = async (
  { env, silent } = { env: process.env, silent: false },
) => {
  if (!env?.MONGODB_HOST) throw new Error('missing env var: MONGODB_HOST');
  if (!env?.MONGODB_PORT) throw new Error('missing env var: MONGODB_PORT');
  const resetDbProcess = childProcess.fork('test/reset-test-db.js', {
    env: { ...env, ...(!silent ? { DEBUG: 'true' } : {}) },
    silent: true,
  });
  if (!silent)
    resetDbProcess.stdout.on('data', (txt) =>
      console.debug(`[cleanup] ${txt}`),
    );
  resetDbProcess.stderr.on('data', (txt) => console.error(`[cleanup] ${txt}`));
  resetDbProcess.on('error', (err) => console.trace('[cleanup] error:', err));
  return new Promise((resolve) => resetDbProcess.on('close', () => resolve()));
};

/**
 * Clears and (re)initializes Openwhyd's database, for automated tests.
 * Environment variables will be read from file, if provided in START_WITH_ENV_FILE.
 * Don't forget to bind to `this`, so Mocha's timeout can be adjusted.
 * Note: For tests that need Openwhyd server to run, use OpenwhydTestEnv.reset() instead.
 * @param {object} opts
 * @param {boolean} opts.silent - if true, no logs from Openwhyd server will be displayed
 */
exports.cleanup = async function ({ silent } = { silent: false }) {
  this.timeout(4000);
  if (!silent) console.warn('🧹 Cleaning up test db...');
  const env = process.env.START_WITH_ENV_FILE
    ? await exports.loadEnvVars(process.env.START_WITH_ENV_FILE)
    : {};
  await exports.resetTestDb({ silent, env: { ...process.env, ...env } });
};
