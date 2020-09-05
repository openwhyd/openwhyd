context('upload', () => {
  let userId;

  beforeEach('login', () => {
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
      userId = dummy.id;
    });
  });

  it('user profile images', () => {
    // check that user has the default profile image
    let defaultImageBody;
    cy.request(`/images/blank_user.gif`).then((response) => {
      defaultImageBody = response.body;
    });
    cy.request(`/img/u/${userId}?_t=${new Date().getTime()}`).should(
      (response) => {
        expect(response.body).to.equal(defaultImageBody);
      }
    );

    // upload a new profile image
    cy.visit(`/u/${userId}`); // user's profile page
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
  });
});
