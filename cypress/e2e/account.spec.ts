context('Openwhyd account', () => {
  // TODO: fix user deletion so this test can pass
  it.skip('can be deleted', function () {
    cy.loginAsAdmin();
    cy.visit('/settings');

    // user is logged in
    cy.fixture('users.js').then(({ admin }) => {
      cy.get('#loginDiv .username').should('have.text', admin.name);
    });

    cy.contains('Got it!').click(); // click on the cookie banner, so it does not hide the "Delete your account" link

    cy.scrollTo('bottom');
    cy.contains('Delete your account').click();
    cy.get('.dlg').should('be.visible');

    cy.contains('Delete my account').click();
    cy.contains('Delete my data now!').click();

    cy.loginAsAdmin();

    // user is NOT logged in
    cy.fixture('users.js').then(({ admin }) => {
      cy.get('#loginDiv .username').should('not.have.text', admin.name);
    });
  });
});
