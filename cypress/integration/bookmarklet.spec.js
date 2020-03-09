/// <reference types="Cypress" />

context('Openwhyd', () => {
  before('login', () => {
    cy.visit('/');

    cy.get('#signin') // https://on.cypress.io/interacting-with-elements
      .click()
      .get('.btnCreateAccount')
      .should('be.visible');

    cy.fixture('users.js').then(({ admin }) => {
      cy.get('input[name=email]').type(admin.email); // https://on.cypress.io/type
      cy.get('input[name=password]').type(admin.password);
      cy.get('form').submit();
      cy.get('#loginDiv .username').should('have.text', admin.name); // https://youtu.be/5XQOK0v_YRE?t=1430
    });
    // ... or send the login request directly to the API, as in https://youtu.be/5XQOK0v_YRE?t=1430
  });

  it('can add a track from a youtube page', () => {
    const youtubeId = '-F9vo4Z5lO4';
    const youtubeURL = `https://www.youtube.com/watch?v=${youtubeId}`;
    const bkURL = `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;

    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.get(`[href="${youtubeURL}"]`).should('exist');

    cy.window().then(win => {
      // win.document.body.innerHTML += `<script src="${bkURL}"></script>`; // does not work
      win.document.body.appendChild(
        win.document.createElement('script')
      ).src = bkURL;
    });

    // check that bookmarklet is loaded
    cy.window().should('have.property', '_initWhydBk');

    // should list more than 1 track
    cy.get('.whydThumb').should('have.length.above', 1);

    /*
    // should list the main track of the page
    cy.get('.whydThumb', { timeout: 10000 }).should(function($thumbs) {
      cy.log('coucou', ($thumbs || []).length); // problem: always zero...
      for (const i = 0; i < ($thumbs || []).length; i++) {
        cy.log(i, $thumbs[i]);
        const style = Cypress.$($thumbs[i]).attr('style');
        expect(style).to.include(youtubeId);
      }
    });
    */
  });
});
