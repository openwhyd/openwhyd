/// <reference types="Cypress" />

// This end-to-end / functional test suite covers the happy path,
// as inspired by https://www.youtube.com/watch?v=aZT8VlTV1YY

context('Openwhyd', () => {
  it('should allow a visitor to sign up and follow the onboarding process', function() {
    // should not let visitors access admin endpoints
    cy.visit('/admin/config/config.json');
    cy.get('pre').should('not.exist');

    // should have Openwhyd in its title
    cy.visit('/');
    cy.title().should('include', 'Openwhyd');

    // should lead new user to genre selection page
    cy.visit('/');
    cy.get('#signup').click();
    cy.fixture('users.js').then(({ testUser }) => {
      cy.get('input[name="name"]').type(testUser.username);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.pwd);
    });
    cy.get('input[type="submit"]').click();
    cy.url().should('include', '/pick/genres');

    // should suggest people to follow after picking genres
    cy.get('#genreGallery li').as('genres');
    cy.contains('Indie').click();
    cy.contains('Rock').click();
    cy.contains('Punk').click();
    cy.contains('Next').click();
    cy.url().should('include', '/pick/people');
  });
  /*
    it('should suggest to install the extension after picking people', function() {
      // TODO: takeSnapshot();
      browser.clickOnLinkWithText('Next');
      browser.waitUntil(
        () => /.*\/pick\/button/.test(browser.getUrl()),
        WAIT_DURATION,
        'expected to be on /pick/button after 5s'
      );
    });
  
    it('should lead new user to the gdpr consent page, after installing extension', function() {
      // TODO: takeSnapshot();
      browser.clickOnLinkWithText('Next');
      browser.waitUntil(
        () => /.*\/consent/.test(browser.getUrl()),
        WAIT_DURATION,
        'expected to be on /consent after 5s'
      );
    });
  
    it('should lead to the welcome page, after giving consent', function() {
      // TODO: takeSnapshot();
      browser.waitForContent(/consent to let Openwhyd collect/); // text of the consent checkbox
      cy.get('input[type="checkbox"]').scrollIntoView();
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="submit"]').click();
      browser.waitUntil(
        () => /.*\/welcome/.test(browser.getUrl()),
        WAIT_DURATION,
        'expected to be on /welcome after 5s'
      );
    });
  
    it('should display user name after skipping the welcome tutorial', function() {
      // TODO: takeSnapshot();
      browser.waitForContent(/Ok\, Got it/);
      var loggedInUsername = cy.get('#loginDiv .username').getText();
      assert.equal(loggedInUsername, TEST_USER.username);
    });
  
    webUI.logout();
  });

  */

  it('should allow user to login', () => {
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
  });
});
