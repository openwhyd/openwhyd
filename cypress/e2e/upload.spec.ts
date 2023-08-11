import {
  changePlaylistImage,
  createPlaylist,
  playlistShouldHaveCustomImage,
  playlistShouldHaveNoImage,
  repeatRequest,
} from '../support/helpers';

context('upload', () => {
  const SAMPLE_IMG_PATH = 'upload-resources/sample-avatar.jpg';
  const SAMPLE_IMG_PATH_2 = 'upload-resources/sample-avatar-2.png';
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

  it('should set the image of a new playlist', () => {
    // create a playlist with default image
    createPlaylist({ userId, name: 'playlist 1' });
    playlistShouldHaveNoImage({ userId, playlistId: 0 });

    // set the playlist's image
    changePlaylistImage({ imagePath: SAMPLE_IMG_PATH });

    // expect the playlist to have a custom image
    playlistShouldHaveCustomImage({ userId, playlistId: 0 });
  });

  it('should set the image of a playlist that already has a custom image', () => {
    // create a playlist with custom image
    const playlistId = 0;
    createPlaylist({ userId, name: 'my playlist', imagePath: SAMPLE_IMG_PATH });
    playlistShouldHaveCustomImage({ userId, playlistId });

    // remember the current playlist image
    let initialImage;
    cy.request({
      url: `/img/playlist/${userId}_${playlistId}`,
      retryOnStatusCodeFailure: true,
    }).then((response) => {
      initialImage = response.body;
    });

    // set the playlist's image
    changePlaylistImage({ imagePath: SAMPLE_IMG_PATH_2 });

    cy.visit(`/u/${userId}/playlists`); // user's playlists page

    // check that the playlist image was updated
    repeatRequest({
      url: `/img/playlist/${userId}_${playlistId}?_t=${
        new Date().getTime() + 1
      }`, // note: we increase the timestamp to prevent cache from returning the previous response
      until: (resp) => {
        return resp.body.length !== initialImage.length;
      },
    });
  });
});
