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
});

Cypress.Commands.add('logout', () => {
  cy.request('GET', `/logout`);
});

Cypress.Commands.add('login', ({ email, md5 }) => {
  cy.request('GET', `/login?action=login&ajax=1&email=${email}&md5=${md5}`);
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users.js').then(({ admin }) => {
    cy.login(admin);
  });
});

function postTrack(track) {
  const params = { action: 'insert', ...track };
  const flattened = Object.entries(params).reduce((acc, [key, value]) => {
    if (typeof value !== 'object')
      return {
        ...acc,
        [key]: value,
      };
    else {
      Object.entries(value).forEach(([subKey, subVal]) => {
        acc[`${key}[${subKey}]`] = subVal;
      });
      return acc;
    }
  }, {});
  const querystring = Object.entries(flattened)
    .map(
      ([param, value]) =>
        `${encodeURIComponent(param)}=${encodeURIComponent('' + value)}`,
    )
    .join('&');
  return cy.request('GET', `/api/post?${querystring}`);
}

Cypress.Commands.add('postDummyTracks', (count, propOverrides = {}) => {
  const makeTrack = (i) => ({
    name: `Fake track #${i}`,
    eId: '/fi/https://github.com/openwhyd/openwhyd/raw/241a6f1025ba601a4f63d730d41690474db6a8c2/public/html/test-resources/sample-15s.mp3',
    img: '/images/cover-track.png',
    ...propOverrides,
  });

  for (let i = 0; i < count; ++i) {
    const track = makeTrack(i);
    postTrack(track);
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
