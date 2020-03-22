/// <reference types="Cypress" />

context('Openwhyd stream', () => {
  // TODO: can load next page of the global stream
  it('can load next page of profile when user not logged in', () => {
    cy.visit('/u/000000000000000000000002'); // will show profile page of user 'dummy' defined in initdb_testing.js

    cy.get('.post h2')
      .should('have.length', 20)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #1')
      .should('not.include.text', 'Fake track #0');

    cy.get('.btnLoadMore').click();

    cy.get('.post h2')
      .should('have.length', 21)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #0');

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

  it('can load next page of profile when user is logged in', () => {
    cy.loginAsAdmin();

    cy.visit('/u/000000000000000000000002'); // will show profile page of user 'dummy' defined in initdb_testing.js

    cy.get('.post h2')
      .should('have.length', 20)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #1')
      .should('not.include.text', 'Fake track #0');

    cy.get('.btnLoadMore').click();

    cy.get('.post h2')
      .should('have.length', 21)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #0');
  });

  it('can load next page of stream when user is logged in', () => {
    // this is non-regression test for https://github.com/openwhyd/openwhyd/pull/296

    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });

    cy.visit('/'); // will show the home/stream of the user 'dummy' defined in initdb_testing.js

    cy.get('.post h2')
      .should('have.length', 20)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #1')
      .should('not.include.text', 'Fake track #0');

    cy.get('.btnLoadMore').click();

    cy.get('.post h2')
      .should('have.length', 21)
      .should('include.text', 'Fake track #20')
      .should('include.text', 'Fake track #0');
  });
});
