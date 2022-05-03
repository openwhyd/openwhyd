// See https://wallabyjs.com/docs/intro/config.html#configuration-file

const fs = require('fs');

module.exports = function (/*wallaby*/) {
  process.env.WHYD_GENUINE_SIGNUP_SECRET = 'whatever'; // from env-vars-testing.conf
  process.env.TEST_WITH_FAKE_MONGO = 'true';

  const nodeVersion = fs.readFileSync('./.nvmrc').toString().trim();

  return {
    testFramework: 'mocha',
    env: {
      type: 'node', // see https://wallabyjs.com/docs/integration/node.html
      runner: `${require('os').homedir()}/.nvm/versions/node/${nodeVersion}/bin/node`,
    },
    setup: function () {
      delete require.cache[require.resolve('./app.js')];
    },
    workers: {
      initial: 1,
      regular: 1,
    },
    files: [
      // code files under test:
      'app.js',
      'app/**/*.*',
      'public/**/*.*',
      'public/html/test-resources/*.*',
      // test helpers:
      { pattern: 'package.json', instrument: false, load: false },
      { pattern: 'env-vars-testing.conf', instrument: false, load: false },
      { pattern: 'config/*.*', instrument: false, load: false },
      { pattern: 'test/api-client.js', instrument: false, load: false },
      { pattern: 'test/fixtures.js', instrument: false, load: false },
      { pattern: 'test/reset-test-db.js', instrument: false, load: false },
      {
        pattern: 'test/approval-tests-helpers.js',
        instrument: false,
        load: false,
      },
    ],
    tests: ['test/unit/**/*.js', 'test/integration/**/*.js'],
  };
};
