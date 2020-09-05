context('upload', () => {
  const SAMPLE_IMG_PATH = '../../test/specs/upload-resources/sample-avatar.jpg';
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
    cy.request(
      `/img/u/${userId}?_t=${new Date().getTime()}`
    ).should((response) =>
      expect(response.body.length).to.equal(defaultImageBody.length)
    );

    // upload a new profile image
    cy.visit(`/u/${userId}`); // user's profile page
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here');
    cy.fixture(SAMPLE_IMG_PATH, 'binary').then((fileContent) => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        filePath: SAMPLE_IMG_PATH,
        encoding: 'utf-8',
        mimeType: 'image/jpeg',
      });
    });

    // wait for the progress bar to disappear
    cy.get('body').contains('Drop your image file here');
    cy.wait(1000); // wait for upload scripts to load and init propertly on the page
    //cy.get('#avatarForm').submit();
    //cy.get('input[type="submit"]').scrollIntoView().click();
    cy.get('body').contains('Save').scrollIntoView().click({ force: true });

    // cy.wait(3000); // wait for the dialog to close and page to refresh
    // cy.request(
    //   `/img/u/${userId}?_t=${new Date().getTime()}`
    // ).should((response) =>
    //   expect(response.body.length).not.to.equal(defaultImageBody.length)
    // );
  });
});
