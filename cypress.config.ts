import { defineConfig } from 'cypress';

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
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('./cypress/plugins/index.ts')(on, config);
    },
    supportFile: 'cypress/support/e2e-with-applitools.ts',
    baseUrl: 'http://localhost:8080',
    slowTestThreshold: 30000,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@applitools/eyes-cypress')(module);
