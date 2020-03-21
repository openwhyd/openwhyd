// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('loginAsAdmin', (email, password) => {
  cy.visit('/');

  cy.get('#signin') // https://on.cypress.io/interacting-with-elements
    .click()
    .get('.btnCreateAccount')
    .should('be.visible');

  cy.fixture('users.js').then(({ admin }) => {
    cy.get('input[name=email]').type(admin.email); // https://on.cypress.io/type
    cy.get('input[name=password]').type(admin.password);
    cy.get('form').submit();
    // cy.get('#loginDiv .username').should('have.text', admin.name); // https://youtu.be/5XQOK0v_YRE?t=1430
  });
  // ... or send the login request directly to the API, as in https://youtu.be/5XQOK0v_YRE?t=1430
});

//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
