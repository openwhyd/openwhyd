/// <reference types="Cypress" />
/// <reference types="@applitools/visual-grid-client" />

declare namespace Cypress {
    interface Chainable {
      /**
       * Create an Applitools test.
       * This will start a session with the Applitools server.
       * @example
       * cy.eyesOpen({ appName: 'My App' })
      */
      eyesOpen(options?: Eyes.Open.Options): null // add isDisabled

      /**
       * Generate a screenshot of the current page and add it to the Applitools Test.
       * @example
       * cy.eyesCheckWindow()
       *
       * OR
       *
       * cy.eyesCheckWindow({
       *  target: 'region',
       *  selector: '.my-element'
       * });
      */
      eyesCheckWindow(config?: Eyes.Check.Options|String): null

      /**
       * Close the applitools test and check that all screenshots are valid.
       * @example cy.eyesClose()
      */
      eyesClose(): null
    }
  }
