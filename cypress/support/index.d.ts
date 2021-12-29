// To let TypeScript compiler know that we have added a custom command and have IntelliSense working
// (see https://github.com/cypress-io/cypress-example-todomvc#cypress-intellisense)

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Ask Openwhyd to reset the database to its initial state.
     * Important: After calling this, other pending HTTP requests may never return and cause Cypress timeouts.
     * Also: This function may fail with 403/FORBIDDEN, "Error: allowed on test database only".
     */
    resetDb(): Chainable<any>;

    /**
     * Logout the user
     */
    logout(): Chainable<any>;

    /**
     * Login, given an email address and md5 password hash
     * @example
     * cy.login({ email: admin.email, md5: admin.md5 })
     */
    login({ email, md5 }: { email: string; md5: string }): Chainable<any>;

    /**
     * Login as the admin user defined in initdb_testing.js
     */
    loginAsAdmin(): Chainable<any>;

    /**
     * Login as the admin user defined in initdb_testing.js
     */
    postDummyTracks(count: number): Chainable<any>;
  }
}
