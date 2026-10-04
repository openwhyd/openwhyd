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

  it('should allow user to play a Youtube track', () => {
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
