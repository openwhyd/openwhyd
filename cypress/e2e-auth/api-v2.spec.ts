context('Openwhyd API v2, with auth0', () => {
  it('should respond with a 401 status code when trying to add a track without token', function () {
    cy.request('POST', `/api/v2/postTrack`, {}).its('status').should('be', 401);
  });
});
