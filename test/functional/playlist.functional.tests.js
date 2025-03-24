//@ts-check

/**
 * @typedef {import('../../app/domain/api/Features').CreatePlaylist} CreatePlaylist
 * @typedef {import('../../app/domain/spi/UserRepository').UserRepository} UserRepository
 * @typedef {import('../../app/domain/spi/ImageRepository').ImageRepository} ImageRepository
 */
const assert = require('assert');

const { makeFeatures: features } = require('../../app/domain/OpenWhydFeatures');
const User = require('../../app/domain/user/User');

const { inMemoryUserRepository } = require('./stubs/InMemoryUserRepository');
const {
  inMemoryImageRepository,
} = require('./stubs/InMemoryImageRepository.js');
const randomString = () => Math.random().toString(36).substring(2, 9);

describe('playlist', () => {
  // test data
  const lastExistingPlaylistId = 42;
  const userNoPlaylist = new User('userNoPlaylist', 'userNoPlaylist', []);
  const userWithPlaylist = new User('userWithPlaylist', 'userWithPlaylist', [
    { id: lastExistingPlaylistId, name: 'existingPlaylist' },
  ]);

  /**
   * @type {CreatePlaylist}
   */
  let createPlaylist, deletePlaylist;

  /** @type {UserRepository} */
  let userRepository;

  /** @type {ImageRepository} */
  let imageRepository;

  beforeEach(() => {
    userRepository = inMemoryUserRepository([userNoPlaylist, userWithPlaylist]);
    imageRepository = inMemoryImageRepository();
    const releasePlaylistPosts = async () => {
      /* no implementation needed yet */
    };
    ({ createPlaylist, deletePlaylist } = features({
      userRepository,
      imageRepository,
      releasePlaylistPosts,
    }));
  });

  it('should be created for a user with no playlist', async () => {
    const playlistName = randomString();

    const playlist = await createPlaylist(userNoPlaylist.id, playlistName);

    assert.equal(playlist.id, 0);
    assert.equal(playlist.name, playlistName);

    const savedUser = await userRepository.getByUserId(userNoPlaylist.id);
    assert.equal(savedUser.playlists.length, 1);
    assert.equal(savedUser.playlists[0].id, playlist.id);
    assert.equal(savedUser.playlists[0].name, playlist.name);
  });

  it('should be created for a user having already a playlist', async () => {
    const playlistName = randomString();
    const previousPlaylistLength = userWithPlaylist.playlists.length;

    const playlist = await createPlaylist(userWithPlaylist.id, playlistName);
    assert.equal(playlist.id, lastExistingPlaylistId + 1);
    assert.equal(playlist.name, playlistName);

    const savedUser = await userRepository.getByUserId(userWithPlaylist.id);
    const savedPlaylist = savedUser.playlists.find(
      (pl) => pl.id == playlist.id,
    );

    assert.equal(savedUser.playlists.length, previousPlaylistLength + 1);

    assert.equal(savedPlaylist.id, playlist.id);
    assert.equal(savedPlaylist.name, playlist.name);
  });

  it('should be deleted', async () => {
    const initialPlaylistsCount = userWithPlaylist.playlists.length;
    const userBefore = await userRepository.getByUserId(userWithPlaylist.id);
    assert.equal(userBefore.playlists.length, initialPlaylistsCount);

    await deletePlaylist(userWithPlaylist.id, userWithPlaylist.playlists[0].id);

    const userAfter = await userRepository.getByUserId(userWithPlaylist.id);
    assert.equal(userAfter.playlists.length, initialPlaylistsCount - 1);
  });

  it('should delete the associated image', async () => {
    const userId = userWithPlaylist.id;
    const playlistId = userWithPlaylist.playlists[0].id;
    const imageUrlBefore = await imageRepository.getImageUrlForPlaylist(
      userId,
      playlistId,
    );
    assert.equal(typeof imageUrlBefore, 'string');

    await deletePlaylist(userWithPlaylist.id, userWithPlaylist.playlists[0].id);

    const imageUrlAfter = await imageRepository.getImageUrlForPlaylist(
      userId,
      playlistId,
    );
    assert.equal(imageUrlAfter, null);
  });
});
