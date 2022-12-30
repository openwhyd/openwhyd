import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '8mw8bh',
  screenshotOnRunFailure: true,
  video: true,
  chromeWebSecurity: false,
  defaultCommandTimeout: 4000,
  execTimeout: 5000,
  taskTimeout: 5000,
  pageLoadTimeout: 10000,
  requestTimeout: 5000,
  responseTimeout: 5000,
  eyesIsDisabled: false,
  eyesFailCypressOnDiff: true,
  eyesDisableBrowserFetching: false,
  eyesTestConcurrency: 5,
  eyesIsGlobalHooksSupported: false,
  eyesPort: 52717,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    slowTestThreshold: 30000,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
