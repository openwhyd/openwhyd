// To let TypeScript compiler know that we have added a custom command and have IntelliSense working
// (see https://github.com/cypress-io/cypress-example-todomvc#cypress-intellisense)

declare namespace Cypress {
  interface Chainable {
    /**
     * Ask Openwhyd to reset the database to its initial state.
     * Important: After calling this, other pending HTTP requests may never return and cause Cypress timeouts.
     * Also: This function may fail with 403/FORBIDDEN, "Error: allowed on test database only".
     */
    resetDb(): Chainable;

    /**
     * Logout the user
     */
    logout(): Chainable;

    /**
     * Login, given an email address and md5 password hash
     * @example
     * cy.login({ email: admin.email, md5: admin.md5 })
     */
    login({ email, md5 }: { email: string; md5: string }): Chainable;

    /**
     * Login as the admin user defined in initdb_testing.js
     */
    loginAsAdmin(): Chainable;

    /**
     * Login as the admin user defined in initdb_testing.js
     */
    postDummyTracks(
      count: number,
      propOverrides?: Partial<
        import('../../app/infrastructure/mongodb/types.js').PostDocument
      >,
    ): Chainable;
  }
}
