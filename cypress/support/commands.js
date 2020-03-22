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

// Note: please document these commands in index.d.ts.

Cypress.Commands.add('resetDb', () => {
  cy.request('POST', `/testing/reset/db`, { timeout: 10000 });
});

Cypress.Commands.add('login', ({ email, md5 }) => {
  cy.request('GET', `/login?action=login&ajax=1&email=${email}&md5=${md5}`);
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users.js').then(({ admin }) => {
    cy.login(admin);
  });
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
