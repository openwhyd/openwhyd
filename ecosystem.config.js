const fs = require('fs');
const { loadEnvVarsFromString } = require('./test/fixtures.js');

module.exports = {
  apps: [
    {
      name: 'openwhyd',
      script: './app.js',
      watch: false,
      env: loadEnvVarsFromString(
        fs.readFileSync('./env-vars-local.sh', 'utf8'),
      ),
    },
  ],
};
