/* global cy, beforeEach */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

/// <reference types="./" />

import '@cypress/code-coverage/support';
import './commands';

beforeEach(function () {
  // mock the /api/notif endpoint, to prevent tests from timing out because of dangling calls to that endpoint, preventing the "load" event from firing.
  cy.intercept('GET', '/api/notif*', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', 'https://cdns-files.deezer.com/js/min/dz.js', {
    statusCode: 200,
    body: '',
  });

  // reset the db before each it() test, across all files no matter what,
  // as recommended in https://docs.cypress.io/guides/references/best-practices.html#State-reset-should-go-before-each-test
  cy.resetDb();
  // Safety: this function will work only against the "openwhyd_test" database.
  // => otherwise, it fail throw and prevent tests from running.
});
