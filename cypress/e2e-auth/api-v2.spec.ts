context('Openwhyd API v2, with auth0', () => {
  it('should respond with a 401 status code when trying to add a track without token', function () {
    cy.visit('/'); // open a random page (not needed for the assertion below)
    cy.request({
      method: 'POST',
      url: `/api/v2/postTrack`,
      body: {},
      failOnStatusCode: false,
    })
      .its('status')
      .should('equal', 401);
  });
});
