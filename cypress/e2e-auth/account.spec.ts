context('Openwhyd auth', () => {
  it('redirects to a auth0 domain to sign up', function () {
    cy.visit('/');

    cy.get('#signup').click();

    cy.url().should('include', 'auth0.com/');
  });
});
