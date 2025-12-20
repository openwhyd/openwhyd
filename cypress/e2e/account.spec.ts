context('Openwhyd account', () => {
  it('can be deleted', function () {
    cy.loginAsAdmin();
    cy.visit('/settings');

    // user is logged in
    cy.get('body').should('not.have.text', 'Sign up');

    cy.contains('Got it!').click(); // click on the cookie banner, so it does not hide the "Delete your account" link

    cy.contains('Delete your account').click({ force: true });
    cy.get('.dlg').should('be.visible');

    cy.contains('Delete my account').click();
    cy.contains('Delete my data now!').click();

    // user is NOT logged in
    cy.visit('/');
    cy.contains('Sign up');
  });
});
