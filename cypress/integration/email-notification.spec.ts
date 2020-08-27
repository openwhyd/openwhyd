context('reduce frequency of email notifications', () => {
  it('user has instant email notifications', () => {
    cy.loginAsAdmin();
    cy.request('api/user').should(response => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', 0);
    });
  });

  it('user activates daily email notifications then reduce it to weekly', () => {
    cy.loginAsAdmin();
    cy.visit('/settings');
    cy.get('a')
      .contains('Notifications')
      .click();
    cy.get('label')
      .contains('Daily')
      .click();
    cy.get('#tabNotif input[type="submit"]').click();
    cy.request('api/user').should(response => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', '1');
    });
    cy.visit(
      `/api/unsubscribe?uId=000000000000000000000001&type=emSub&action=reduce`
    );
    cy.get('body').contains('weekly');
    cy.request('api/user').should(response => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', 7);
    });
  });
<<<<<<< HEAD
  
context('unsubscribe from email notifications', () => {
=======
>>>>>>> d4bce029d56f9fc6a206a6ce4b0c55205a908565
  it('user has instant eamail notification', () => {
    cy.loginAsAdmin();
    cy.request('/api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', 0);
    });
  });
  it('user unsubscribes from email notification', () => {
    cy.loginAsAdmin();
    cy.visit('/api/unsubscribe?uId=000000000000000000000001&type=emSub');
    cy.get('body').contains('unsubscribed');
    cy.request('api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', -1);
    });
    cy.logout();
  });
});
<<<<<<< HEAD
});
=======
>>>>>>> d4bce029d56f9fc6a206a6ce4b0c55205a908565
