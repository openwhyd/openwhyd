// cf https://stackoverflow.com/a/73955233/592254
export function repeatRequest({ url, until }) {
  const maxAttempts = 10;
  const delay = 200;
  const action = () => cy.request(url).then(until);
  let chain = action();
  for (let i = 0; i < maxAttempts; i++) {
    chain = chain.then((foundMatch) => {
      if (!foundMatch) {
        cy.wait(delay);
        return action();
      }
    });
  }
  return chain.then((foundMatch) => assert.isTrue(foundMatch));
}

export function createPlaylist({
  userId,
  name,
  imagePath,
}: {
  userId: string;
  name: string;
  imagePath?: string;
}) {
  cy.visit(`/u/${userId}/playlists`); // user's playlists page
  cy.get('body').contains('+ New Playlist').click();
  cy.get('form[id="playlistForm"] input[name="name"]').type(name);
  if (imagePath) {
    cy.get('body').contains('Add/set playlist cover image').click();
    cy.get('input[type="file"]').attachFile(imagePath); // to upload the file}
  }
  cy.get('body').contains('Save').click();
  cy.get('body').should('not.contain.text', 'Save'); // wait for dialog to disappear
}

export function changePlaylistImage({ imagePath }) {
  cy.get('.btnEditPlaylist').contains('Edit').click();
  cy.get('body')
    .contains('Add/set playlist cover image')
    .should('be.visible') // to wait for upload scripts to load and init propertly on the page
    .click();
  cy.get('input[type="file"]').attachFile(imagePath); // to upload the file
  cy.get('body').contains('Save').click();
  cy.get('body').should('not.contain.text', 'Save'); // wait for dialog to disappear
}

export function goToPlaylist({ userId, playlistId }) {
  return cy.visit(`/u/${userId}/playlist/${playlistId}`);
}

export function deletePlaylist({ userId, playlistId }) {
  goToPlaylist({ userId, playlistId });
  cy.get('.btnEditPlaylist').contains('Edit').click();
  cy.get('body')
    .contains('Delete playlist')
    .should('be.visible') // to wait for upload scripts to load and init propertly on the page
    .click();
  cy.get('body').should('not.contain.text', 'Save'); // wait for dialog to disappear
}

export function playlistShouldExist({ userId, playlistName }) {
  cy.visit(`/u/${userId}/playlists`);
  return cy.get('body').contains(playlistName).should('be.visible');
}

export function playlistShouldNotExist({ userId, playlistName }) {
  cy.visit(`/u/${userId}/playlists`);
  return cy.get('body').should('not.contain', playlistName);
}

export function playlistShouldHaveCustomImage({ userId, playlistId }) {
  return cy
    .request({
      url: `/img/playlist/${userId}_${playlistId}?remoteOnly=1`,
      retryOnStatusCodeFailure: true,
    })
    .should('have.property', 'status', 200);
}

export function playlistShouldHaveNoImage({ userId, playlistId }) {
  return cy
    .request({
      url: `/img/playlist/${userId}_${playlistId}?remoteOnly=1`,
      failOnStatusCode: false,
    })
    .should('have.property', 'status', 404);
}
