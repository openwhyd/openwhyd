/// <reference types="Cypress" />

context('Openwhyd', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/')
  })

  // https://on.cypress.io/interacting-with-elements

  it('can go to login page', () => {
    // https://on.cypress.io/type
    cy.get('#signin').click()
      .get('.btnCreateAccount').should('be.visible')
  })
})
