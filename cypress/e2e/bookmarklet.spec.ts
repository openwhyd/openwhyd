context('Openwhyd bookmarklet', () => {
  const VIDEO = {
    id: '-F9vo4Z5lO4',
    url: 'https://www.youtube.com/watch?v=-F9vo4Z5lO4',
    name: 'YouTube Video 1',
  };

  const injectBookmarklet = (win) => {
    win.document.body.appendChild(win.document.createElement('script')).src =
      `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;
  };

  beforeEach('login', () => {
    // We prevent the following uncaught exceptions from failing the test:
    const skippedErrors = [
      'cast_framework.js', // YouTube failing to load "/cast/sdk/libs/sender/1.0/cast_framework.js"
      'window.jQuery', // Deezer failing to find window.jQuery
      `Cannot read property 'style' of null`, // TODO: fix this error
      'YOUTUBE_API_KEY is not defined', // TODO: fix this error
      'The request cannot be completed because you have exceeded your <a href="/youtube/v3/getting-started#quota">quota', // Note: this error was witnessed in CI
    ];
    Cypress.on('uncaught:exception', (err) => {
      if (skippedErrors.some((errMsg) => err.message.includes(errMsg))) {
        return false; // prevents Cypress from failing the test
      } else {
        return true;
      }
    });

    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });
  });

  // disabled until we write an extactor that doesn't rely on Playem
  // cf https://github.com/openwhyd/openwhyd/pull/774
  it.skip('can detect a track from a soundcloud page', () => {
    cy.visit('/html/test-resources/soundcloud-tracks.html');

    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    // should list the main track of the page
    cy.get('#whydContent').should(
      'contain.html',
      'juanchov182/thievery-corporation-meu', // Note: id is found in the data-eid attribute of the thumb element
    );
    cy.get('.whydThumb')
      .first()
      .should(
        'contain.text',
        'thievery corporation - meu destino (my destiny)',
      );
    cy.get('.whydThumb').first().click();
  });

  // disabled until we write an extactor that doesn't rely on Playem
  // cf https://github.com/openwhyd/openwhyd/pull/774
  it.skip('can import the cover art of a Bandcamp track', () => {
    // original URL: https://harissa.bandcamp.com/track/rooftop
    cy.visit('/html/test-resources/bandcamp-track-page.html');

    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    // should list the main track of the page
    cy.get('.whydThumb').first().should('contain.text', 'Harissa - Rooftop');
    cy.get('#whydContent').should('contain.html', '1382233458'); // ar_id
    cy.get('.whydThumb').first().click();
  });

  // TODO: check that the cover art is still visible after posting
  // TODO: check that we don't end up with dozens of "Search Openwhyd" results, in the bookmarlet

  it('can be opened twice from the same youtube page', () => {
    cy.visit('/html/test-resources/youtube-videos.html');

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
    cy.visit('/html/test-resources/youtube-videos.html');

    cy.window().then(injectBookmarklet);

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    // should list the main track of the page
    cy.get('#whydContent').should('contain.html', VIDEO.id); // Note: id is found in the image URL, and also in data-eid
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
