import {
  createPlaylist,
  goToPlaylist,
  playlistShouldHaveCustomImage,
  playlistShouldHaveNoImage,
  repeatRequest,
} from '../support/helpers';

context('upload', () => {
  const SAMPLE_IMG_PATH = 'upload-resources/sample-avatar.jpg';
  const INVALID_IMG_PATH = 'upload-resources/not-an-image.png'; // text file with an image extension
  const IMAGE_PROCESSING_ERROR =
    'This image could not be processed. Please try another one.';
  let userId;

  beforeEach('login', () => {
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
      userId = dummy.id;
    });
  });

  it('should update user profile image', () => {
    // check that user has the default profile image
    let defaultImageBody;
    cy.request(`/images/blank_user.gif`).then((response) => {
      defaultImageBody = response.body;
      cy.request(`/img/u/${userId}?_t=${new Date().getTime()}`)
        .its('body.length')
        .should('equal', defaultImageBody.length);
    });

    // open the "edit profile" dialog
    cy.visit(`/u/${userId}`); // user's profile page
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here'); // to wait for upload scripts to load and init propertly on the page

    // upload a new profile image
    cy.get('input[type="file"]').attachFile(SAMPLE_IMG_PATH); // to upload the file
    cy.get('body').contains('Drop your image file here'); // to wait for the progress bar to disappear
    cy.get('body').contains('Save').click();

    // check that the user's profile image was updated
    repeatRequest({
      url: `/img/u/${userId}?_t=${new Date().getTime() + 1}`, // note: we increase the timestamp to prevent cache from returning the previous response
      until: (resp) => resp.body.length !== defaultImageBody.length,
    });
  });

  it('should create a new playlist with a custom image', () => {
    // create a playlist with default image
    createPlaylist({ userId, name: 'playlist 1' });
    playlistShouldHaveNoImage({ userId, playlistId: 1 });

    // create a playlist with custom image
    createPlaylist({ userId, name: 'playlist 2', imagePath: SAMPLE_IMG_PATH });
    playlistShouldHaveCustomImage({ userId, playlistId: 1 });

    cy.visit(`/u/${userId}/playlists`); // user's playlists page
  });

  it('should keep the user profile image when uploading an invalid image', () => {
    // given a user with a custom profile image
    cy.visit(`/u/${userId}`);
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here');
    cy.get('input[type="file"]').attachFile(SAMPLE_IMG_PATH);
    cy.get('body').contains('Drop your image file here');
    cy.get('body').contains('Save').click();
    cy.get('#dlgEditProfile').should('not.exist');
    let customImageLength;
    cy.request(`/images/blank_user.gif`).then(({ body: defaultImage }) =>
      repeatRequest({
        url: `/img/u/${userId}?_t=${new Date().getTime()}`,
        until: (resp) => {
          customImageLength = resp.body.length;
          return resp.body.length !== defaultImage.length;
        },
      }),
    );

    // when they upload an invalid image, then save their profile
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here');
    cy.get('input[type="file"]').attachFile(INVALID_IMG_PATH);
    cy.get('body').contains(IMAGE_PROCESSING_ERROR);
    cy.get('textarea[name=bio]').clear().type('my new bio');
    cy.get('body').contains('Save').click();
    cy.get('#dlgEditProfile').should('not.exist');

    // then their profile image should not have changed
    cy.request(`/img/u/${userId}?_t=${new Date().getTime() + 1}`)
      .its('body.length')
      .should((length) => expect(length).to.equal(customImageLength));
  });

  it('should keep the playlist image when uploading an invalid image', () => {
    // given a playlist with a custom image
    const playlistId = 0;
    createPlaylist({ userId, name: 'my playlist', imagePath: SAMPLE_IMG_PATH });
    playlistShouldHaveCustomImage({ userId, playlistId });
    let initialImageLength;
    cy.request({
      url: `/img/playlist/${userId}_${playlistId}`,
      retryOnStatusCodeFailure: true,
    }).then((response) => {
      initialImageLength = response.body.length;
    });

    // when they upload an invalid image, then save the playlist
    goToPlaylist({ userId, playlistId });
    cy.get('.btnEditPlaylist').contains('Edit').click();
    cy.get('body')
      .contains('Add/set playlist cover image')
      .should('be.visible')
      .click();
    cy.get('input[type="file"]').attachFile(INVALID_IMG_PATH);
    cy.get('body').contains(IMAGE_PROCESSING_ERROR);
    cy.get('body').contains('Save').click();
    cy.get('body').should('not.contain.text', 'Save'); // wait for dialog to disappear

    // then the playlist image should not have changed
    playlistShouldHaveCustomImage({ userId, playlistId });
    cy.request(`/img/playlist/${userId}_${playlistId}?_t=${Date.now()}`)
      .its('body.length')
      .should((length) => expect(length).to.equal(initialImageLength));
  });

  it('should use the previously uploaded profile image when a later upload fails', () => {
    // given a user with the default profile image
    let defaultImageLength;
    cy.request(`/images/blank_user.gif`).then(({ body }) => {
      defaultImageLength = body.length;
    });

    // when they upload a valid image, then an invalid one, then save their profile
    cy.visit(`/u/${userId}`);
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();
    cy.get('body').contains('Drop your image file here');
    cy.get('input[type="file"]').attachFile(SAMPLE_IMG_PATH);
    cy.get('#dlgEditProfile .dlgImgPane > img')
      .should('have.attr', 'src')
      .and('contain', '/upload_data/');
    cy.get('input[type="file"]').attachFile(INVALID_IMG_PATH);
    cy.get('body').contains(IMAGE_PROCESSING_ERROR);
    cy.get('body').contains('Save').click();
    cy.get('#dlgEditProfile').should('not.exist');

    // then their profile image should be the valid one
    repeatRequest({
      url: `/img/u/${userId}?_t=${new Date().getTime()}`,
      until: (resp) => resp.body.length !== defaultImageLength,
    });
  });

  it('should use the previously uploaded playlist image when a later upload fails', () => {
    // given a playlist without image
    const playlistId = 0;
    createPlaylist({ userId, name: 'my playlist' });
    playlistShouldHaveNoImage({ userId, playlistId });

    // when they upload a valid image, then an invalid one, then save the playlist
    goToPlaylist({ userId, playlistId });
    cy.get('.btnEditPlaylist').contains('Edit').click();
    cy.get('body')
      .contains('Add/set playlist cover image')
      .should('be.visible')
      .click();
    cy.get('input[type="file"]').attachFile(SAMPLE_IMG_PATH);
    cy.get('.dlgEditPlaylist .dlgImgPane > img')
      .should('have.attr', 'src')
      .and('contain', '/upload_data/');
    cy.get('input[type="file"]').attachFile(INVALID_IMG_PATH);
    cy.get('body').contains(IMAGE_PROCESSING_ERROR);
    cy.get('body').contains('Save').click();
    cy.get('body').should('not.contain.text', 'Save'); // wait for dialog to disappear

    // then the playlist should have the valid image
    playlistShouldHaveCustomImage({ userId, playlistId });
  });
});
