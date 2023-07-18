/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config);
  require('cypress-log-to-output').install(on); // note: only works with Chrome

  // add other tasks to be registered here

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config;
};
