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

    // should suggest to install the extension after picking people
    cy.contains('Next').click();
    cy.url().should('include', '/pick/button');

    // should lead new user to the gdpr consent page, after installing extension
    cy.contains('Next').click();
    cy.url().should('include', '/consent');

    // should lead to the welcome page, after giving consent
    cy.get('input[type="checkbox"]')
      .first()
      .click();
    cy.get('form')
      .first()
      .submit();
    cy.url().should('include', '/welcome');

    // should display user name after skipping the welcome tutorial
    cy.contains(`Ok, Got it`);
    cy.fixture('users.js').then(({ testUser }) => {
      cy.get('#loginDiv .username').should('have.text', testUser.username);
    });

    cy.logout();
  });

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
