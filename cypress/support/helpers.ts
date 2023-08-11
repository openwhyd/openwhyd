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
