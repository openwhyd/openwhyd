import {
  changePlaylistImage,
  createPlaylist,
  deletePlaylist,
  goToPlaylist,
  playlistShouldExist,
  playlistShouldHaveCustomImage,
  playlistShouldHaveNoImage,
  playlistShouldNotExist,
  repeatRequest,
} from '../support/helpers';

context('playlists', () => {
  const SAMPLE_IMG_PATH = 'upload-resources/sample-avatar.jpg';
  const SAMPLE_IMG_PATH_2 = 'upload-resources/sample-avatar-2.png';
  let userId, userName;

  beforeEach('login', () => {
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
      userId = dummy.id;
      userName = dummy.name;
    });
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
      url: `/img/playlist/${userId}_${playlistId}`,
      until: (resp) => resp.body.length !== initialImage.length,
    });
  });

  // TODO: re-activate this test as soon as the playlist page can load faster
  it.skip('should delete a playlist, its image, and release associated posts', () => {
    // Given a playlist with a custom image and one post
    const playlist = { id: 0, name: 'my favorite playlist' };
    const track = {
      uId: userId,
      uNm: userName,
      name: 'my favorite track',
      pl: playlist,
    };
    createPlaylist({ userId, name: playlist.name, imagePath: SAMPLE_IMG_PATH });
    cy.postDummyTracks(1, track);
    playlistShouldExist({ userId, playlistName: playlist.name });
    playlistShouldHaveCustomImage({ userId, playlistId: playlist.id });
    goToPlaylist({ userId, playlistId: playlist.id })
      .get('body')
      .should('contain', track.name)
      .should('contain', playlist.name);

    // delete the playlist
    deletePlaylist({ userId, playlistId: playlist.id });
    cy.visit(`/u/${userId}/playlists`); // user's playlists page

    // check that the playlist image was updated
    playlistShouldNotExist({ userId, playlistName: playlist.name });
    playlistShouldHaveNoImage({ userId, playlistId: playlist.id });

    // check that the track is still on the user's profile, but not associated to the playlist
    cy.visit(`/u/${userId}`) // user's profile page
      .get('body')
      .should('contain', track.name)
      .should('not.contain', playlist.name);
  });
});
