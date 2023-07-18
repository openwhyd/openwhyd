// See https://wallabyjs.com/docs/intro/config.html#configuration-file

module.exports = function (/*wallaby*/) {
  return {
    env: {
      type: 'node', // see https://wallabyjs.com/docs/integration/node.html
      runner: `${require('os').homedir()}/.nvm/versions/node/${require('fs')
        .readFileSync('./.nvmrc')
        .toString()
        .trim()}/bin/node`,
    },
    files: [
      // code files under test:
      'app/**/*.js',
      'public/**/*.js',
      'public/html/test-resources/*.*',
      // test helpers:
      { pattern: 'test/functional/stubs/*.js', instrument: false, load: false },
    ],
    tests: ['test/unit/*-tests.js', 'test/functional/*.tests.js'],
  };
};
