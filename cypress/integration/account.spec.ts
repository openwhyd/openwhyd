context('Openwhyd account', () => {
  it('can be deleted', function () {
    cy.loginAsAdmin();
    cy.visit('/settings');

    // user is logged in
    cy.fixture('users.js').then(({ admin }) => {
      cy.get('#loginDiv .username').should('have.text', admin.name);
    });

    cy.contains('Delete your account').click();
    cy.get('.dlg').should('be.visible');

    cy.contains('Delete my account').click();

    cy.loginAsAdmin();

    // user is NOT logged in
    cy.fixture('users.js').then(({ admin }) => {
      cy.get('#loginDiv .username').should('not.have.text', admin.name);
    });
  });
});
