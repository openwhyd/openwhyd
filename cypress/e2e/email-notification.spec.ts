context('reduce frequency of email notifications', () => {
  it('user has email notifications disabled by default', () => {
    cy.loginAsAdmin();
    cy.request('api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', -1);
    });
  });

  it('user activates instant email notifications then reduce it to daily then weekly', () => {
    cy.loginAsAdmin();
    cy.visit('/settings');
    cy.get('a').contains('Notifications').click();
    cy.get('label').contains('Instant').click();
    cy.get('#tabNotif input[type="submit"]').click();
    cy.request('api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', '0');
    });
    cy.visit(
      `/api/unsubscribe?uId=000000000000000000000001&type=emSub&action=reduce`,
    );
    cy.get('body').contains('daily');
    cy.request('api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', 1);
    });
    cy.visit(
      `/api/unsubscribe?uId=000000000000000000000001&type=emSub&action=reduce`,
    );
    cy.get('body').contains('weekly');
    cy.request('api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', 7);
    });
  });
});
context('unsubscribe from email notifications', () => {
  it('user activates instant email notification first', () => {
    cy.loginAsAdmin();
    cy.visit('/settings');
    cy.get('a').contains('Notifications').click();
    cy.get('label').contains('Instant').click();
    cy.get('#tabNotif input[type="submit"]').click();
    cy.request('/api/user').should((response) => {
      expect(response.body)
        .to.have.property('pref')
        .to.have.property('emSub', '0');
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
