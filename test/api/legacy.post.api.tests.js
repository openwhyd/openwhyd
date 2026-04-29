const assert = require('assert');

const { DUMMY_USER, ADMIN_USER } = require('../fixtures.js');
const api = require('../api-client.js');
const util = require('util');
const { START_WITH_ENV_FILE } = process.env;
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');

const openwhyd = new OpenwhydTestEnv({
  startWithEnv: START_WITH_ENV_FILE,
});

describe(`post api - legacy`, function () {
  const post = {
    eId: '/yt/XdJVWSqb4Ck',
    name: 'Lullaby - Jack Johnson and Matt Costa',
  };

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  describe('without playlist', function () {
    let jar;
    let initialPost;
    let pId;

    beforeEach(async () => {
      await openwhyd.reset(); // prevent side effects between tests by resetting db state
      ({ jar } = await util.promisify(api.loginAs)(DUMMY_USER));
      const { body } = await api.addPost(jar, post);
      initialPost = body;
      pId = initialPost._id;
    });

    it(`should allow adding a track`, function () {
      assert.equal(initialPost.eId, post.eId);
      assert.equal(initialPost.name, post.name);
      assert(initialPost._id);
    });

    it(`should allow re-adding a track (aka "repost")`, function (done) {
      api.addPost(jar, { pId }).then(({ body }) => {
        assert(body._id);
        assert.notEqual(body._id, pId);
        assert.equal(body.repost.pId, pId);
        assert.equal(body.eId, post.eId);
        assert.equal(body.name, post.name);
        done();
      });
    });
  });

  describe('in a playlist', function () {
    const firstPlaylistIndex = 0;
    const playlist = {
      id: 'create',
      name: 'my first playlist',
    };
    let jar;
    let postInPlaylist;
    let pId, uId;
    let playlistFullId;

    beforeEach(async () => {
      await openwhyd.reset(); // prevent side effects between tests by resetting db state
      ({ jar } = await util.promisify(api.loginAs)(DUMMY_USER));
      const { body } = await api.addPost(jar, { ...post, pl: playlist });
      postInPlaylist = body;
      pId = postInPlaylist._id;
      uId = postInPlaylist.uId;
    });

    it(`should allow adding a track to a playlist`, function () {
      assert(postInPlaylist._id);
      assert.equal(postInPlaylist.eId, postInPlaylist.eId);
      assert.equal(postInPlaylist.name, postInPlaylist.name);
      assert.equal(postInPlaylist.pl.id, firstPlaylistIndex);
      assert.equal(postInPlaylist.pl.name, postInPlaylist.pl.name);
    });

    it(`make sure that the playlist was created`, function (done) {
      api.getUser(jar, {}, function (error, { body }) {
        assert.equal(body.pl.length, 1);
        assert.equal(body.pl[0].id, firstPlaylistIndex);
        assert.equal(body.pl[0].name, postInPlaylist.pl.name);
        assert.equal(body.pl[0].nbTracks, 1);
        playlistFullId = [body.id, firstPlaylistIndex].join('_');
        done();
      });
    });

    it(`should find 1 track in the playlist`, function (done) {
      api.getPlaylist(jar, playlistFullId, function (error, { body }) {
        assert.ifError(error);
        assert.equal(body.length, 1);
        assert.equal(body[0].id, playlistFullId);
        assert.equal(body[0].plId, firstPlaylistIndex);
        assert.equal(body[0].nbTracks, 1);
        done();
      });
    });

    it(`should return 1 track in the playlist`, function (done) {
      api.getPlaylistTracks(
        jar,
        `u/${uId}`,
        firstPlaylistIndex,
        function (error, { body }) {
          assert.equal(body.length, 1);
          assert.equal(body[0].pl.id, firstPlaylistIndex);
          assert.equal(body[0].pl.name, postInPlaylist.pl.name);
          done();
        },
      );
    });

    it(`should return 1 track in the playlist, with limit=1000`, function (done) {
      const url = `/u/${uId}/playlist/${firstPlaylistIndex}?format=json&limit=1000`;
      api.get(jar, url, function (error, { body }) {
        assert.equal(body.length, 1);
        assert.equal(body[0].pl.id, firstPlaylistIndex);
        assert.equal(body[0].pl.name, postInPlaylist.pl.name);
        done();
      });
    });

    it(`should return tracks if two limit parameters are provided`, function (done) {
      const url = `/u/${uId}/playlist/${firstPlaylistIndex}?format=json&limit=1000&limit=20`;
      // => the `limit` property will be parsed as ["1000","20"] => causing bug #89
      api.get(jar, url, function (error, { body }) {
        assert.notEqual(body.length, 0);
        done();
      });
    });

    it(`should return the comment data after adding it`, function (done) {
      const comment = {
        pId,
        text: 'hello world',
      };
      api.addComment(jar, comment, function (error, { body }) {
        assert.ifError(error);
        assert.equal(body.pId, comment.pId);
        assert.equal(body.text, comment.text);
        assert(body._id);
        done();
      });
    });
  });
});

describe(`post api - independent tests`, function () {
  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  it('should delete a post', async function () {
    const { jar } = await util.promisify(api.loginAs)(DUMMY_USER);
    await api.addPost(jar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(jar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    await api.deletePost(jar, postId);
    assert.equal((await util.promisify(api.getMyPosts)(jar)).posts.length, 0);
  });

  it('should not delete a post from another user', async function () {
    const ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await api.addPost(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    const otherJar = (await util.promisify(api.loginAs)(ADMIN_USER)).jar;
    await assert.rejects(() => api.deletePost(otherJar, postId));
    assert.equal(
      (await util.promisify(api.getMyPosts)(ownerJar)).posts.length,
      1,
    );
  });

  it('should update own post', async function () {
    const ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await api.addPost(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    const newName = 'Lullaby - Jack Johnson and Matt Costa - updated';
    await api.addPost(ownerJar, {
      _id: postId,
      name: newName,
    });
    const { posts: postsUpd } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(postsUpd.length, 1);
    assert.equal(postsUpd[0]?.name, newName);
  });

  it("should not allow update of another user's post", async function () {
    const ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await api.addPost(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    const otherJar = (await util.promisify(api.loginAs)(ADMIN_USER)).jar;
    let apiError;
    await api
      .addPost(otherJar, {
        _id: postId,
        name: 'Lullaby - Jack Johnson and Matt Costa - updated',
      })
      .catch((err) => (apiError = err)); // ignore assertion failure caused by non-200 status code
    assert.equal(
      (await util.promisify(api.getMyPosts)(ownerJar)).posts.length,
      1,
    );
    assert.equal(
      apiError.message,
      "updating another user's post is not allowed",
    );
  });
});
