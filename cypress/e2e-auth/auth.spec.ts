context('Openwhyd with auth0', () => {
  it('redirects to a auth0 domain to sign up', function () {
    cy.visit('/');
    cy.get('#signup').click();
    cy.url().should('include', 'auth0.com/');
  });

  // TODO: fix and unskip
  it.skip('forbids legacy login', function () {
    cy.loginAsAdmin(); // passes credentials to the legacy login endpoint
    cy.get('#signup').should('be.visible');
  });
});
