//@ts-check

/**
 * @typedef {import('../../app/domain/api/Features').CreatePlaylist} CreatePlaylist
 * @typedef {import('../../app/domain/spi/UserRepository').UserRepository} UserRepository
 */
const assert = require('assert');

const { features } = require('../../app/domain/OpenWhydFeatures');
const User = require('../../app/domain/user/User');

const { inMemoryUserRepository } = require('./stubs/InMemoryUserRepository');
const randomString = () => Math.random().toString(36).substring(2, 9);

describe('playlist', () => {
  let userNoPlaylist;

  const lastExistingPlaylistId = 42;
  let userWithPlaylist;

  /**
   * @type {CreatePlaylist}
   */
  let createPlaylist;

  /**
   * @type {UserRepository}
   */
  let userRepository;

  beforeEach(() => {
    userNoPlaylist = new User('userNoPlaylist', []);
    userWithPlaylist = new User('userWithPlaylist', [
      { id: lastExistingPlaylistId, name: 'existingPlaylist' },
    ]);

    userRepository = inMemoryUserRepository([userNoPlaylist, userWithPlaylist]);

    ({ createPlaylist } = features(userRepository));
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
      (pl) => pl.id == playlist.id
    );

    assert.equal(savedUser.playlists.length, previousPlaylistLength + 1);

    assert.equal(savedPlaylist.id, playlist.id);
    assert.equal(savedPlaylist.name, playlist.name);
  });
});
