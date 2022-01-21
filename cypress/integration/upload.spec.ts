context('upload', () => {
  const SAMPLE_IMG_PATH = 'upload-resources/sample-avatar.jpg';
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
      (response) =>
        expect(response.body.length).to.equal(defaultImageBody.length)
    );

    // open the "edit profile" dialog
    cy.visit(`/u/${userId}`); // user's profile page
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here'); // to wait for upload scripts to load and init propertly on the page

    // upload a new profile image
    cy.get('input[type="file"]').attachFile(SAMPLE_IMG_PATH); // to upload the file
    cy.get('body').contains('Drop your image file here'); // to wait for the progress bar to disappear
    cy.wait(1000); // to wait for the form to be ready to save
    cy.get('body').contains('Save').scrollIntoView().click({ force: true });
    cy.wait(1000); // to wait for the dialog to close and page to refresh

    // check that the user's profile image was updated
    cy.request(`/img/u/${userId}?_t=${new Date().getTime() + 1}`).should(
      // note: above, we increase the timestamp to prevent cache from returning the previous response
      (response) =>
        expect(response.body.length).not.to.equal(defaultImageBody.length)
    );
  });
});
