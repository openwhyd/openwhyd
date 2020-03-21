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
Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users.js').then(({ admin }) => {
    cy.request(
      'GET',
      `/login?action=login&ajax=1&email=${admin.email}&md5=${admin.md5}`
    );
    cy.request('POST', `/consent`);
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
