/// <reference types="cypress" />

// To let TypeScript compiler know that we have added a custom command and have IntelliSense working
// (see https://github.com/cypress-io/cypress-example-todomvc#cypress-intellisense)

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Login as the admin user defined in initdb_testing.js
     * @example
     * cy.loginAsAdmin()
     */
    loginAsAdmin(): Chainable<any>;
  }
}
