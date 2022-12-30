// This suite intends to navigate through all pages, to detect visual regressions.

context('Visual Snapshots', () => {
  it('visitor on home page', () => {
    cy.visit('/'); // Home page (full stream)
    cy.compareSnapshot('visitor on home page');

    cy.contains('Got it!').click(); // Remove cookie banner
    cy.compareSnapshot('visitor on home page (discarded cookie banner)');
  });

  it('visitor on hot tracks', () => {
    cy.visit('/hot');
    cy.contains('Got it!').click(); // Remove cookie banner

    // cy.get('#pageLoader').should('have.css', { opacity: 0.5 });
    cy.location('pathname').should('equal', '/hot');
    // cy.get('#pageLoader').should('have.css', { opacity: 0 });
    cy.contains('/ All'); // in the header of the list of tracks
    cy.compareSnapshot('visitor on hot tracks');
  });

  it('visitor signs up then logs in from hot tracks', () => {
    cy.visit('/hot');
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('Sign up').click();
    cy.contains('Create an account').should('be.visible'); // title of the modal dialog
    cy.compareSnapshot('visitor on signup');
    cy.get('body').type('{esc}'); // press "escape", to close the modal

    cy.contains('Login').click();
    cy.location('pathname').should('equal', '/login');
    cy.contains('No account yet?'); // below the sign in form
    cy.compareSnapshot('visitor on login');
  });

  it('visitor on a new user profile', () => {
    cy.visit('/dummy');
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('No tracks yet...');
    cy.compareSnapshot('visitor on dummy page (user profile)');
  });

  it('visitor on the button install page', () => {
    cy.visit('/button');
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('Openwhyd "add track" button');
    cy.compareSnapshot('visitor on button page (bookmarklet)');

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
