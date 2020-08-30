/// <reference types="Cypress" />

context('Openwhyd bookmarklet', () => {
  beforeEach('login', () => {
    Cypress.on('uncaught:exception', () => {
      // We prevent the following uncaught exceptions from failing the test:
      // - YouTube failing to load "/cast/sdk/libs/sender/1.0/cast_framework.js"
      // - Deezer failing to find window.jQuery
      return false; // prevents Cypress from failing the test
    });

    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });
  });

  it('can be opened twice from the same youtube page', () => {
    const youtubeId = '-F9vo4Z5lO4';
    const youtubeName = 'YouTube Video 1';
    const youtubeURL = `https://www.youtube.com/watch?v=${youtubeId}`;
    const bkURL = () =>
      `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;

    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.get(`[href="${youtubeURL}"]`).should('exist');

    cy.window().then((win) => {
      win.document.body.appendChild(
        win.document.createElement('script')
      ).src = bkURL();
    });

    // check that bookmarklet is loaded
    cy.window().should('have.property', '_initWhydBk');

    // should list more than 1 track
    cy.get('.whydThumb', { timeout: 10000 }).should('have.length.above', 1);

    // close the bookmarklet
    cy.get('#whydHeader div').click();

    // there should be no thumbs displayed anymore
    cy.get('.whydThumb').should('have.length', 0);

    // re-inject the bookmarklet
    cy.window().then((win) => {
      win.document.body.appendChild(
        win.document.createElement('script')
      ).src = bkURL();
    });

    // should list more than 1 track
    cy.get('.whydThumb', { timeout: 10000 }).should('have.length.above', 1);
  });

  it('can pick a track from a youtube page', () => {
    const youtubeId = '-F9vo4Z5lO4';
    const youtubeName = 'YouTube Video 1';
    const youtubeURL = `https://www.youtube.com/watch?v=${youtubeId}`;
    const bkURL = `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;

    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.get(`[href="${youtubeURL}"]`).should('exist');

    cy.window().then((win) => {
      // win.document.body.innerHTML += `<script src="${bkURL}"></script>`; // does not work
      // to test in your own browser: window.document.body.appendChild(window.document.createElement('script')).src = 'http://localhost:8080/js/bookmarklet.js';
      win.document.body.appendChild(
        win.document.createElement('script')
      ).src = bkURL;
    });

    // check that bookmarklet is loaded
    cy.window().should('have.property', '_initWhydBk');

    // should list more than 1 track
    cy.get('.whydThumb', { timeout: 10000 }).should('have.length.above', 1);

    // should list the main track of the page

    cy.get('.whydThumb', { timeout: 10000 }).should(function ($thumbs) {
      cy.log('thumbs:', ($thumbs || []).length); // removing this log causes the test to occasionally hang...
      for (let i = 0; i < ($thumbs || []).length; i++) {
        expect($($thumbs[i]).html()).to.include(youtubeId);
        expect($($thumbs[i]).find('p')).to.include(youtubeName);
      }
    });

    // TODO
    // cy.get('.whydThumb').should('contain.html', youtubeId); // causing "Uncaught ReferenceError: YOUTUBE_API_KEY is not defined"
    // cy.get('.whydThumb').first().should('contain.text', youtubeName);
    // cy.get('.whydThumb').first().click();
  });

  it('can display the "add track" dialog from /post', () => {
    const postUrl =
      '/post?v=2&embed=1&eId=%2Fyt%2FGwL-COqlauA&title=Galaxy%20Buds%20Live%20review%3A%20good%20beans%2C%20no%20compromises&refUrl=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DGwL-COqlauA&refTtl=Galaxy%20Buds%20Live%20review%3A%20good%20beans%2C%20no%20compromises%20-%20YouTube&text=';

    cy.visit(Cypress.config().baseUrl + postUrl);
    // before #347, opening that page resulted in an error that caused the test to fail.
  });
});
