// This suite intends to navigate through all pages, to detect visual regressions.
// It requires the APPLITOOLS_API_KEY env var to be set.

context('Visual Snapshots', () => {
  if (Cypress.env('SKIP_APPLITOOLS_TESTS')) {
    it.skip(`⚠ CYPRESS_SKIP_APPLITOOLS_TESTS env var is set => skipping`, () => {});
    return;
  }

  before(() => {
    cy.eyesOpen({
      testName: 'Visual Snapshots',
    });
  });

  after(() => {
    cy.eyesClose();
  });

  it('visitor on home page', () => {
    cy.visit('/'); // Home page (full stream)
    cy.eyesCheckWindow({ name: 'visitor on /', lazyLoad: true });

    cy.contains('Got it!').click(); // Remove cookie banner
    cy.eyesCheckWindow('visitor on / (discarded cookie banner)');
  });

  it('visitor on hot tracks', () => {
    // insert a few tracks, to also check regressions on the rendering of those tracks
    cy.loginAsAdmin();
    cy.postRealTracks();
    cy.logout();

    cy.visit('/hot');
    cy.contains('Got it!').click(); // Remove cookie banner

    // cy.get('#pageLoader').should('have.css', { opacity: 0.5 });
    cy.location('pathname').should('equal', '/hot');
    // cy.get('#pageLoader').should('have.css', { opacity: 0 });
    cy.contains('/ All'); // in the header of the list of tracks
    cy.eyesCheckWindow({ name: 'visitor on /hot', lazyLoad: true });
  });

  it('visitor signs up then logs in from hot tracks', () => {
    cy.visit('/hot');
    cy.wait(1000); // wait for images to load, especially on CI
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('Sign up').click();
    cy.contains('Create an account').should('be.visible'); // title of the modal dialog
    cy.eyesCheckWindow({ name: 'visitor on /#signup', lazyLoad: true });
    cy.get('body').type('{esc}'); // press "escape", to close the modal

    cy.contains('Login').click();
    cy.location('pathname').should('equal', '/login');
    cy.contains('No account yet?'); // below the sign in form
    cy.eyesCheckWindow('visitor on /login');
  });

  it('visitor on a new user profile', () => {
    cy.visit('/dummy');
    cy.wait(1000); // wait for images to load, especially on CI
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('No tracks yet...');
    cy.eyesCheckWindow({
      name: 'visitor on /dummy (user profile)',
      lazyLoad: true,
    });
  });

  it('visitor on the button install page', () => {
    cy.visit('/button');
    cy.wait(1000); // wait for images to load, especially on CI
    cy.contains('Got it!').click(); // Remove cookie banner

    cy.contains('Openwhyd "add track" button');
    cy.eyesCheckWindow({
      name: 'visitor on /button (bookmarklet)',
      lazyLoad: true,
    });

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
