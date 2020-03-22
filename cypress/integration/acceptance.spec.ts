/// <reference types="Cypress" />

// This end-to-end / functional test suite covers the happy path,
// as inspired by https://www.youtube.com/watch?v=aZT8VlTV1YY

context('Openwhyd', () => {
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

  it('should allow a user to add a track', function() {
    // should allow user to login
    cy.loginAsAdmin();

    // should recognize a track when pasting a Youtube URL in the search box
    cy.get('#q').type('https://www.youtube.com/watch?v=aZT8VlTV1YY');
    cy.get('#searchResults').contains('Demo');

    // should lead to a track page when clicking on the Youtube search result
    cy.get('#searchResults li a')
      .first()
      .click();
    cy.url().should('include', '/yt/aZT8VlTV1YY');

    // should display the name of the track
    cy.get('a.btnRepost[href*="Openwhyd Demo (formerly"]').should('exist');

    // should open a dialog after clicking on the "Add to" button
    cy.contains('Add to').click(); //$('a.btnRepost').click();
    cy.get('.dlgPostBox').should('be.visible');

    // should show a link to the post after adding the track
    cy.wait(500); // TODO: we should not have to wait for the "Add" link to be clickable
    cy.get('.dlgPostBox span')
      .contains('Add')
      .click();
    cy.contains('your tracks'); // notification bar with link to "your tracks"

    // should show the post on the user's profile after clicking the link
    cy.get('a')
      .contains('your tracks')
      .click();
    cy.url().should('include', '/u/');
    cy.get('.post a[data-eid="/yt/aZT8VlTV1YY"]').should('be.visible');

    // should open the playbar after the user clicks on the post
    cy.get('.post a[data-eid="/yt/aZT8VlTV1YY"]').click();
    cy.get('#btnPlay').should('be.visible');

    // should play the track
    cy.get('#btnPlay.playing').should('be.visible');

    // should pause the track when the user clicks on the play/pause button
    cy.get('#btnPlay').click();
    cy.get('#btnPlay').should('not.have.class', 'playing');
  });

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
});
