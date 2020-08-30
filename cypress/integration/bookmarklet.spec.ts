/// <reference types="Cypress" />

context('Openwhyd bookmarklet', () => {
  beforeEach('login', () => {
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });
  });

  it('can add a track from a youtube page', () => {
    const youtubeId = '-F9vo4Z5lO4';
    const youtubeName = 'YouTube Video 1';
    const youtubeURL = `https://www.youtube.com/watch?v=${youtubeId}`;
    const bkURL = `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;

    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.get(`[href="${youtubeURL}"]`).should('exist');

    cy.window().then((win) => {
      // win.document.body.innerHTML += `<script src="${bkURL}"></script>`; // does not work
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

    cy.get('.whydThumb').should('contain.html', youtubeId); // causing "Uncaught ReferenceError: YOUTUBE_API_KEY is not defined"
    cy.get('.whydThumb').first().should('contain.text', youtubeName);
    cy.get('.whydThumb').first().click();
  });
});
