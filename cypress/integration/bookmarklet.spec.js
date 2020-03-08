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
    const youtubeURL = 'https://www.youtube.com/watch?v=-F9vo4Z5lO4';
    const bkURL = `${Cypress.config().baseUrl}/js/bookmarklet.js?${Date.now()}`;

    cy.visit('http://localhost:8080/html/test-resources/youtube-videos.html');

    cy.get(`[href="${youtubeURL}"]`).should('exist');

    cy.window().then(win => {
      // win.document.body.innerHTML += `<script src="${bkURL}"></script>`; // does not work
      win.document.body.appendChild(
        win.document.createElement('script')
      ).src = bkURL;
    });

    // TODO:

    /*
    it(`should have the bookmarklet loaded`, function() {
      function getBookmarklet() {
        return window._initWhydBk;
      }
      return !!browser.execute(getBookmarklet);
      // TODO: create a re-usable waitForSymbol() wdio command
    });
  
    it(`should find the page's track in the list`, function() {
      $('.whydThumb').waitForExist();
    });
  
    it(`should list more than 1 track`, function() {
      browser.waitUntil(() => {
        const nbThumbs = $$('.whydThumb').length;
        console.log('number of .whydThumb elements', nbThumbs);
        // Note: nbThumbs is sometimes stuck to 1, when running Chrome with --headless
        return nbThumbs > 1;
      }, 10000);
    });
  
    it(`should list no more than 10 tracks`, function() {
      const timeoutMs = 10 * 1000;
      const tStart = Date.now();
      return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          const nbThumbs = (await $$('.whydThumb')).length;
          console.log('number of .whydThumb elements', nbThumbs);
          if (nbThumbs > 10) {
            clearInterval(interval);
            reject(new Error('expected 10 tracks or less. got ' + nbThumbs));
          } else if (Date.now() - tStart >= timeoutMs) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
      */
  });
});
