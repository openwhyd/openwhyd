// This suite intends to navigate through all pages, to detect visual regressions.

context('Visual Snapshots', () => {
  before(() => {
    cy.eyesOpen({
      appName: 'Openwhyd',
      testName: 'Visual Snapshots',
      browser: { width: 1000, height: 660 }, // cf https://docs.cypress.io/api/commands/viewport.html#Defaults
    });
    // TODO: insert a few tracks, to also check regressions on the rendering of those tracks
  });

  after(() => {
    cy.eyesClose();
  });

  it('visitor', () => {
    cy.visit('/'); // Home page (full stream)
    cy.eyesCheckWindow('visitor on /');

    cy.contains('Got it!').click(); // Remove cookie banner
    cy.eyesCheckWindow('visitor on / (discarded cookie banner)');

    cy.contains('Hot Tracks').click();
    // cy.get('#pageLoader').should('have.css', { opacity: 0.5 });
    cy.location('pathname').should('equal', '/hot');
    // cy.get('#pageLoader').should('have.css', { opacity: 0 });
    cy.contains('/ All'); // in the header of the list of tracks
    cy.eyesCheckWindow('visitor on /hot');

    cy.contains('Login').click();
    cy.location('pathname').should('equal', '/login');
    cy.contains('No account yet?'); // below the sign in form
    cy.eyesCheckWindow('visitor on /login');
  });
});
