/// <reference types="cypress" />

// To let TypeScript compiler know that we have added a custom command and have IntelliSense working
// (see https://github.com/cypress-io/cypress-example-todomvc#cypress-intellisense)

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Login, given an email address and md5 password hash
     * @example
     * cy.loginAsAdmin()
     */
    login({ email, md5 }: { email: string; md5: string }): Chainable<any>;
    /**
     * Login as the admin user defined in initdb_testing.js
     * @example
     * cy.loginAsAdmin()
     */
    loginAsAdmin(): Chainable<any>;
  }
}
