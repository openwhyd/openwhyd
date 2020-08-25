context('reduce frequency of email notifications',() =>{
  
  it('user has instant email notifications',()=>{
    cy.loginAsAdmin();
    cy.request('api/user')
      .should((response)=>{
        expect(response.body).to.have.property('pref').to.have.property('emSub',0);
      });
  });
  
  it('user activates daily email notifications',()=>{
    cy.loginAsAdmin();
    cy.visit('/settings');
    cy.get('a')
      .contains('Notifications')
      .click();
    cy.get('label')
      .contains('Daily')
      .click();
    cy.get('#tabNotif input[type="submit"]').click();
    cy.request('api/user')
      .should((response) => {
        expect(response.body).to.have.property('pref').to.have.property('emSub','1');
      });
  })
});