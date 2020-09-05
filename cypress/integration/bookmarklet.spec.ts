context('Openwhyd bookmarklet', () => {
  const VIDEO = {
    id: '-F9vo4Z5lO4',
    url: 'https://www.youtube.com/watch?v=-F9vo4Z5lO4',
    name: 'YouTube Video 1',
  };

  const injectBookmarklet = (win) => {
    win.document.body.appendChild(
      win.document.createElement('script')
    ).src = `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;
  };

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
    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    // close the bookmarklet
    cy.get('#whydHeader div').click();

    // there should be no thumbs displayed anymore
    cy.get('.whydThumb').should('have.length', 0);

    // re-inject the bookmarklet
    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);
  });

  it('can pick a track from a youtube page', () => {
    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    // should list the main track of the page
    cy.get('#whydContent').should('contain.html', VIDEO.id);
    cy.get('.whydThumb').first().should('contain.text', VIDEO.name);
    cy.get('.whydThumb').first().click();
  });

  it('can display the "add track" dialog from /post', () => {
    const postUrl =
      '/post?v=2&embed=1&eId=%2Fyt%2FGwL-COqlauA&title=Galaxy%20Buds%20Live%20review%3A%20good%20beans%2C%20no%20compromises&refUrl=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DGwL-COqlauA&refTtl=Galaxy%20Buds%20Live%20review%3A%20good%20beans%2C%20no%20compromises%20-%20YouTube&text=';

    cy.visit(Cypress.config().baseUrl + postUrl);
    // before #347, opening that page resulted in an error that caused the test to fail.
  });
});
