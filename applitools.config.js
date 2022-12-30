// cf https://www.npmjs.com/package/@applitools/eyes-cypress#global-configuration-properties
module.exports = {
  appName: 'Openwhyd',
  browser: { width: 1000, height: 660 }, // cf https://docs.cypress.io/api/commands/viewport.html#Defaults
  isDisabled: false,
  failCypressOnDiff: true,
  disableBrowserFetching: false,
  testConcurrency: 5,
};
