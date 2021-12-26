/* global Cypress, cy */

import 'cypress-file-upload';

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
  cy.request('POST', `/testing/reset`, {
    timeout: 5000,
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true,
  });
  cy.wait(1000);
});

Cypress.Commands.add('logout', () => {
  cy.request('GET', `/login?action=logout`);
});

Cypress.Commands.add('login', ({ email, md5 }) => {
  cy.request('GET', `/login?action=login&ajax=1&email=${email}&md5=${md5}`);
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users.js').then(({ admin }) => {
    cy.login(admin);
  });
});

Cypress.Commands.add('postDummyTracks', (count) => {
  const makeTrack = (i) => ({
    name: `Fake track #${i}`,
    eId: '/fi/https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3',
    img: '/images/cover-track.png',
  });
  for (let i = 0; i < count; ++i) {
    const params = { action: 'insert', ...makeTrack(i) };
    const querystring = Object.keys(params)
      .map(
        (param) =>
          `${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`
      )
      .join('&');
    cy.request('GET', `/api/post?${querystring}`);
  }
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
