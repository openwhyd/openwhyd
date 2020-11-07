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

  it('should allow a user to add a track', function () {
    // should allow user to login
    cy.loginAsAdmin();
    cy.visit('/');

    // should recognize a track when pasting the URL of a MP3 file in the search box
    const track = ((url) => ({
      url,
      name: url.split('/').pop(),
      eId: '/fi/' + encodeURIComponent(url),
    }))(
      'https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3'
    );
    cy.get('#q').type(track.url);
    cy.get('#searchResults').contains(track.name);

    // should lead to a track page when clicking on the search result
    cy.get('#searchResults li a').first().click();
    cy.url().should('include', track.eId);

    // should display the name of the track
    cy.get(`a.btnRepost[href*="${track.name}"]`).should('exist');

    // should open a dialog after clicking on the "Add to" button
    cy.contains('Add to').click(); //$('a.btnRepost').click();
    cy.get('.dlgPostBox').should('be.visible');

    // should show a link to the post after adding the track
    cy.wait(500); // TODO: we should not have to wait for the "Add" link to be clickable
    cy.get('.dlgPostBox span').contains('Add').click();
    cy.contains('your tracks'); // notification bar with link to "your tracks"

    // should show the post on the user's profile after clicking the link
    cy.get('a').contains('your tracks').click();
    cy.url().should('include', '/u/');
    cy.get(`.post a.thumb[href^="${track.url}"]`).should('be.visible');

    // should open the playbar after the user clicks on the post
    cy.get(`.post a.thumb[href^="${track.url}"]`).click();
    cy.get('#btnPlay').should('be.visible');

    // should play the track
    cy.get('#btnPlay.playing', { timeout: 10000 }).should('be.visible');

    // should pause the track when the user clicks on the play/pause button
    cy.get('#btnPlay').click();
    cy.get('#btnPlay').should('not.have.class', 'playing');
  });

  it('should allow a visitor to sign up and follow the onboarding process', function () {
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
    cy.get('input[type="checkbox"]').first().click();
    cy.get('form').first().submit();
    cy.url().should('include', '/welcome');

    // should display user name after skipping the welcome tutorial
    cy.contains(`Ok, Got it`);
    cy.fixture('users.js').then(({ testUser }) => {
      cy.get('#loginDiv .username').should('have.text', testUser.username);
    });

    cy.logout();
  });

  it('should allow user to re-add a track into a playlist', function () {
    // requirement: one track should be accessible from the user's stream
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });
    cy.postDummyTracks(1);
    cy.visit('/');

    // should display a pop-in dialog when clicking the "Add to" button of that track
    cy.scrollTo('bottom');
    cy.get('.post')
      .last() // because Cypress is scrolling down for some reason, making the first one unreachable. see https://github.com/cypress-io/cypress/issues/2353
      .contains('Add to')
      .click();
    cy.get('.dlgPostBox').should('be.visible');

    // should allow to create a new playlist
    cy.get('#selPlaylist').should('be.visible');
    cy.wait(1000); // leave some time for onclick handler to be setup => TODO: get rid of this!
    cy.get('#selPlaylist').click();
    cy.get('#newPlaylistName').type('test playlist');
    cy.get('input[value="Create"]').click();
    cy.get('#selPlaylist').contains('test playlist');

    // should show a link to the post after re-adding the track
    cy.get('.dlgPostBox span').contains('Add').click();
    cy.get('.dlgPostBox').should('not.be.visible');
    cy.contains('test playlist'); // notification bar with link

    // should show the post on the user's new playlist after clicking the link
    cy.get('a').contains('test playlist').click();
    cy.url().should('include', '/u/');
    cy.get('.post').should('have.length', 1);
    cy.get('.post a[data-eid]').should('be.visible');
  });

  it('should allow user to manipulate comments', function () {
    // requirement: at least one track should be accessible from the user's stream
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
    });
    cy.postDummyTracks(1);

    // comments should be visible from the user's stream
    cy.visit('/stream');
    cy.contains('Comment').click();
    cy.contains('You can mention people');

    // comment should appear after being added
    cy.get('textarea').type('hello world\n');
    cy.fixture('users.js').then(({ dummy }) => {
      cy.get('.comments').contains(dummy.name);
    });
    cy.get('.comments').contains('hello world');

    // TODO: it(`should change after being updated`, function() {

    // TODO: it(`should disappear after being deleted`, function() {
  });

  it('should allow users to search external tracks', function () {
    cy.visit('/');
    cy.get('#q')
      .click()
      .type('https://soundcloud.com/harissaquartet/no-service');
    const searchResult = `a[onclick="window.goToPage('/sc/harissaquartet/no-service');return false;"]`;
    cy.get(searchResult)
      .should('be.visible')
      .should('have.text', 'Harissa - No Service');
  });
});
