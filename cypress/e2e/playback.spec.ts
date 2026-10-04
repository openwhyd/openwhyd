// Tests to prevent regressions on playback of tracks.

/**
 * Forces the window to appear focused and visible, so that playback is not paused by Openwhyd's front-end.
 */
function forceFocus(win: Window) {
  cy.stub(win.document, 'hasFocus').returns(true);
  Object.defineProperty(win.document, 'visibilityState', {
    get: () => 'visible',
  });
  Object.defineProperty(win.document, 'hidden', { get: () => false });
}

context('Playback', () => {
  beforeEach(() => {
    cy.on('window:before:load', forceFocus);
  });

  it('should allow user to play a MP3 track', () => {
    const mp3URL =
      'https://github.com/openwhyd/openwhyd/raw/241a6f1025ba601a4f63d730d41690474db6a8c2/public/html/test-resources/sample-15s.mp3';
    cy.visit(`/fi/${encodeURIComponent(mp3URL)}`);

    // should open the playbar after the user clicks on the post
    cy.get(`.post a.thumb`).click();
    cy.get('#btnPlay').should('be.visible');

    // should play the track
    cy.get('#btnPlay.playing', { timeout: 10000 }).should('be.visible');

    cy.wait(1000); // TODO: get rid of this. cf https://github.com/openwhyd/openwhyd/pull/495/commits/7c0eddc9dc9e60fa163624d356837e1a111018d1

    // should pause the track when the user clicks on the play/pause button
    cy.get('#btnPlay').click();
    cy.get('#btnPlay').should('not.have.class', 'playing');
  });

  // TODO: find a way to re-enable this test, cf https://github.com/openwhyd/openwhyd/tasks/1f4fd90a-204d-4209-a8d4-7610bb47897f?session_id=b320967f-9916-47bf-8691-0215f99188c3
  it.skip('should allow user to play a Youtube track', () => {
    cy.visit('/yt/jI3YrVfOksE');

    // should open the playbar after the user clicks on the post
    cy.get(`.post a.thumb`).click();
    cy.get('#btnPlay').should('be.visible');

    // should play the track
    cy.get('#btnPlay.playing', { timeout: 10000 }).should('be.visible');

    cy.wait(1000); // TODO: get rid of this. cf https://github.com/openwhyd/openwhyd/pull/495/commits/7c0eddc9dc9e60fa163624d356837e1a111018d1

    // should pause the track when the user clicks on the play/pause button
    cy.get('#btnPlay').click();
    cy.get('#btnPlay').should('not.have.class', 'playing');
  });

  // TODO: fix bandcamp playback (cf issue #940) => re-enable this test
  it.skip('should allow user to play a Bandcamp track', () => {
    cy.visit('/bc/harissa/rooftop');

    // should open the playbar after the user clicks on the post
    cy.get(`.post a.thumb`).click();
    cy.get('#btnPlay').should('be.visible');

    // should play the track
    cy.get('#btnPlay.playing', { timeout: 10000 }).should('be.visible');

    cy.wait(1000); // TODO: get rid of this. cf https://github.com/openwhyd/openwhyd/pull/495/commits/7c0eddc9dc9e60fa163624d356837e1a111018d1

    // should pause the track when the user clicks on the play/pause button
    cy.get('#btnPlay').click();
    cy.get('#btnPlay').should('not.have.class', 'playing');
  });
});
