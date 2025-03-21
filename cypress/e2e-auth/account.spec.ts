context('Openwhyd with auth0', () => {
  it('redirects to a auth0 domain to sign up', function () {
    cy.visit('/');
    cy.get('#signup').click();
    cy.url().should('include', 'auth0.com/');
  });

  it('forbids legacy login', function () {
    cy.loginAsAdmin();
    cy.get('#signup').should('be.visible');
  });
});
