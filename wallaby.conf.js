// See https://wallabyjs.com/docs/intro/config.html#configuration-file

module.exports = function (wallaby) {
  return {
    env: {
      type: 'node', // see https://wallabyjs.com/docs/integration/node.html
      runner: `${require('os').homedir()}/.nvm/versions/node/${require('fs')
        .readFileSync('./.nvmrc')
        .toString()
        .trim()}/bin/node`,
    },
    files: ['app/**/*.js', 'public/**/*.js', 'public/html/test-resources/*.*'],
    tests: ['test/unit/*-tests.js'],
  };
};
