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

    // TODO:
    /*
    // should list the main track of the page
    cy.get('.whydThumb', { timeout: 10000 }).should(function($thumbs) {
      //expect($thumbs).to.have.length.above(1);
      //if (!$thumbs) return; //throw new Error('we expect thumbs');
      // cy.log($thumbs);
      // cy.log($thumbs.length);
      if ($thumbs.length < 1) {
        throw new Error('we expect at least one thumb');
      }
      for (const i = 0; i < $thumbs.length; i++) {
        if ($thumbs[i].style.includes(youtubeId)) return;
      }
      throw new Error('we expect one thumb to match the video');
      // const className = $div[0].className;

      // if (!className.match(/heading-/)) {
      //   throw new Error(`No class "heading-" in ${className}`);
      // }
      // //.should('contain', youtubeId)
      // cy.log(typeof $thumbs, $thumbs, $thumbs.toString());
      // const styles = $thumbs.map((i, el) => {
      //   cy.log({ i, style: Cypress.$(el).attr('style') });
      //   //return Cypress.$(el).attr('style');
      // });
      // //return styles.find(style => style.includes(youtubeId));
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
