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

Cypress.Commands.add('postRealTracks', () => {
  const posts = [
    {
      // _id: '64f96b02f3b1cb8d4422e083',
      uId: '518b5a447e91c862b2adea1a',
      uNm: 'Israel Lindenbaum',
      text: 'Field Medic – light is gone 2',
      name: 'Field Medic - "you deserve attention" (Official Audio)',
      eId: '/yt/M_EeY9f-vqw',
      pl: { id: 3, name: 'swing/soul/blues/jazz/down beat/oldies/folk/funk' },
      img: 'https://i.ytimg.com/vi/M_EeY9f-vqw/default.jpg',
      repost: {
        pId: '64f8ac15f3b1cb8d4422e072',
        uId: '5edbd60cdadc93b520a93bfb',
        uNm: 'Phil72 Le Mans',
      },
      lov: [],
      nbR: 0,
      nbP: 0,
    },
    {
      // _id: '64f8ac15f3b1cb8d4422e072',
      uId: '5edbd60cdadc93b520a93bfb',
      uNm: 'Phil72 Le Mans',
      text: 'Field Medic – light is gone 2',
      name: 'Field Medic - "you deserve attention" (Official Audio)',
      eId: '/yt/M_EeY9f-vqw',
      ctx: 'bk',
      pl: { id: 150, name: 'Phil151 2023' },
      img: 'https://i.ytimg.com/vi/M_EeY9f-vqw/default.jpg',
      src: {
        id: 'https://www.youtube.com/watch?v=M_EeY9f-vqw&list=OLAK5uy_mi04TykEgMAT2bMAF_Hn9YVPbYTMKOTS8&index=3',
        name: 'Field Medic - &quot;you deserve attention&quot; (Official Audio) - YouTube',
      },
      nbP: 1,
      nbR: 1,
    },
    {
      // _id: '64f427e38e17e2c0a0aab2c9',
      uId: '518b5a447e91c862b2adea1a',
      uNm: 'Israel Lindenbaum',
      text: '',
      name: 'Field Medic - You Deserve Attention',
      eId: '/yt/M_EeY9f-vqw',
      pl: { id: 3, name: 'swing/soul/blues/jazz/down beat/oldies/folk/funk' },
      img: 'https://i.ytimg.com/vi/M_EeY9f-vqw/default.jpg',
      repost: {
        pId: '64f1f36ba083ed4627cc2b67',
        uId: '544c39c3e04b7b4fca803438',
        uNm: 'Stefanos',
      },
      lov: [],
      nbR: 0,
      nbP: 0,
    },
    {
      // _id: '64f1f36ba083ed4627cc2b67',
      uId: '544c39c3e04b7b4fca803438',
      uNm: 'Stefanos',
      text: '',
      name: 'Field Medic - You Deserve Attention',
      eId: '/yt/M_EeY9f-vqw',
      ctx: 'bk',
      img: 'https://i.ytimg.com/vi/M_EeY9f-vqw/default.jpg',
      nbP: 6,
      nbR: 1,
    },
    {
      // _id: '64fb0cbc9b3ceeca17571e51',
      uId: '518b5a447e91c862b2adea1a',
      uNm: 'Israel Lindenbaum',
      text: '',
      name: 'St. Evan - Keeping Score',
      eId: '/yt/qnUnxLNHFo4',
      pl: { id: 3, name: 'swing/soul/blues/jazz/down beat/oldies/folk/funk' },
      img: 'https://i.ytimg.com/vi/qnUnxLNHFo4/default.jpg',
      repost: {
        pId: '64fa5a109b3ceeca17571e33',
        uId: '5356db0471eaec19b56fe9ff',
        uNm: 'Muriel (µµ)',
      },
      lov: [],
      nbR: 0,
      nbP: 0,
    },
    {
      // _id: '64fa5a109b3ceeca17571e33',
      uId: '5356db0471eaec19b56fe9ff',
      uNm: 'Muriel (µµ)',
      text: '',
      name: 'St. Evan - Keeping Score',
      eId: '/yt/qnUnxLNHFo4',
      ctx: 'bk',
      pl: { id: 17, name: 'RnB' },
      img: 'https://i.ytimg.com/vi/qnUnxLNHFo4/default.jpg',
      src: {
        id: 'https://www.youtube.com/watch?v=qnUnxLNHFo4&list=RDEMfYl0NGk8mRm8Mo4RthhAMQ&index=1',
        name: 'Keeping Score - YouTube',
      },
      lov: ['5356db0471eaec19b56fe9ff'],
      nbP: 1,
      nbR: 1,
    },
  ];
  posts.forEach((post) => postTrack(post));
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
