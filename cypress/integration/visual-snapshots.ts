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

    cy.contains('Sign up').click();
    cy.contains('Create an account').should('be.visible'); // title of the modal dialog
    cy.eyesCheckWindow('visitor on /#signup');
    cy.get('body').type('{esc}'); // press "escape", to close the modal

    cy.contains('Login').click();
    cy.location('pathname').should('equal', '/login');
    cy.contains('No account yet?'); // below the sign in form
    cy.eyesCheckWindow('visitor on /login');

    cy.visit('/dummy');
    cy.contains('No tracks yet...');
    cy.eyesCheckWindow('visitor on /dummy (user profile)');

    cy.visit('/button');
    cy.contains('Openwhyd "add track" button');
    cy.eyesCheckWindow('visitor on /button (bookmarklet)');

    // TODO: make the following test work: navigate back to home page, from the login page
    // cy.go('back'); // does not work, for some reason...
    // cy.window().then((window) => window.history.back()); // does not work either...
    // cy.get('#logo').click(); // even worse: this displays a "Whoops, there is no test to run" error page from Cypress!
    // TODO: try cy.window().invoke("history").invoke("back")
    // cy.location('pathname').should('equal', '/');
    // cy.contains('Recent tracks from all users'); // in the header of the list of tracks
    // cy.eyesCheckWindow('visitor on / (back navigation)');
  });
});
