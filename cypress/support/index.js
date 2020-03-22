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

require('./commands');

beforeEach(function() {
  // reset the db before each it() test, across all files no matter what
  // as recommended in https://docs.cypress.io/guides/references/best-practices.html#State-reset-should-go-before-each-test
  cy.resetDb();
});
