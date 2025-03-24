context('Openwhyd with auth0', () => {
  it('redirects to a auth0 domain to sign up', function () {
    cy.visit('/');
    cy.intercept('GET', /auth0\.com/, { statusCode: 200, body: 'OK' }); // workaround timeout issue when navigating to auth0.com
    cy.get('#signup').click();
    cy.url().should('include', 'auth0.com/');
  });

  // TODO: fix and unskip
  it.skip('forbids legacy login', function () {
    cy.loginAsAdmin(); // passes credentials to the legacy login endpoint
    cy.get('#signup').should('be.visible');
  });
});
