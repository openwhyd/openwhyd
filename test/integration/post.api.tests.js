var assert = require('assert');

var { DUMMY_USER, ADMIN_USER, cleanup } = require('../fixtures.js');
var api = require('../api-client.js');
const util = require('util');

describe(`post api`, function () {
  before(cleanup); // to prevent side effects between tests

  var pId, uId;
  const post = {
    eId: '/yt/XdJVWSqb4Ck',
    name: 'Lullaby - Jack Johnson and Matt Costa',
  };

  it(`should allow adding a track`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.addPost(jar, post, function (error, { body }) {
        assert.ifError(error);
        assert.equal(body.eId, post.eId);
        assert.equal(body.name, post.name);
        assert(body._id);
        pId = body._id;
        uId = body.uId;
        done();
      });
    });
  });

  it(`should allow re-adding a track (aka "repost")`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.addPost(jar, { pId }, function (error, { body }) {
        assert.ifError(error);
        assert(body._id);
        assert.notEqual(body._id, pId);
        assert.equal(body.repost.pId, pId);
        assert.equal(body.eId, post.eId);
        assert.equal(body.name, post.name);
        done();
      });
    });
  });

  var playlistFullId;
  const firstPlaylistIndex = 0;
  const postInPlaylist = Object.assign({}, post, {
    pl: {
      id: 'create',
      name: 'my first playlist',
    },
  });

  it(`should allow adding a track to a playlist`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.addPost(jar, postInPlaylist, function (error, { body }) {
        assert.ifError(error);
        assert(body._id);
        assert.equal(body.eId, postInPlaylist.eId);
        assert.equal(body.name, postInPlaylist.name);
        assert.equal(body.pl.id, firstPlaylistIndex);
        assert.equal(body.pl.name, postInPlaylist.pl.name);
        done();
      });
    });
  });

  it(`make sure that the playlist was created`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.getUser(jar, {}, function (error, { body }) {
        assert.equal(body.pl.length, 1);
        assert.equal(body.pl[0].id, firstPlaylistIndex);
        assert.equal(body.pl[0].name, postInPlaylist.pl.name);
        assert.equal(body.pl[0].nbTracks, 1);
        playlistFullId = [body.id, firstPlaylistIndex].join('_');
        done();
      });
    });
  });

  it(`should find 1 track in the playlist`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.getPlaylist(jar, playlistFullId, function (error, { body }) {
        assert.ifError(error);
        assert.equal(body.length, 1);
        assert.equal(body[0].id, playlistFullId);
        assert.equal(body[0].plId, firstPlaylistIndex);
        assert.equal(body[0].nbTracks, 1);
        done();
      });
    });
  });

  it(`should return 1 track in the playlist`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      api.getPlaylistTracks(
        jar,
        `u/${uId}`,
        firstPlaylistIndex,
        function (error, { body }) {
          assert.equal(body.length, 1);
          assert.equal(body[0].pl.id, firstPlaylistIndex);
          assert.equal(body[0].pl.name, postInPlaylist.pl.name);
          done();
        }
      );
    });
  });

  it(`should return 1 track in the playlist, with limit=1000`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      const url = `/u/${uId}/playlist/${firstPlaylistIndex}?format=json&limit=1000`;
      api.get(jar, url, function (error, { body }) {
        assert.equal(body.length, 1);
        assert.equal(body[0].pl.id, firstPlaylistIndex);
        assert.equal(body[0].pl.name, postInPlaylist.pl.name);
        done();
      });
    });
  });

  it(`should return tracks if two limit parameters are provided`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
      const url = `/u/${uId}/playlist/${firstPlaylistIndex}?format=json&limit=1000&limit=20`;
      // => the `limit` property will be parsed as ["1000","20"] => causing bug #89
      api.get(jar, url, function (error, { body }) {
        assert.notEqual(body.length, 0);
        done();
      });
    });
  });

  it(`should return the comment data after adding it`, function (done) {
    api.loginAs(DUMMY_USER, function (error, { jar }) {
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
  beforeEach(cleanup); // to prevent side effects between tests

  it('should delete a post', async function () {
    const { jar } = await util.promisify(api.loginAs)(DUMMY_USER);
    await util.promisify(api.addPost)(jar, {
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
    let ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await util.promisify(api.addPost)(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    let otherJar = (await util.promisify(api.loginAs)(ADMIN_USER)).jar;
    await assert.rejects(() => api.deletePost(otherJar, postId));
    assert.equal(
      (await util.promisify(api.getMyPosts)(ownerJar)).posts.length,
      1
    );
  });

  it('should update own post', async function () {
    let ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await util.promisify(api.addPost)(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    const newName = 'Lullaby - Jack Johnson and Matt Costa - updated';
    await util.promisify(api.addPost)(ownerJar, {
      _id: postId,
      name: newName,
    });
    const { posts: postsUpd } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(postsUpd.length, 1);
    assert.equal(postsUpd[0]?.name, newName);
  });

  it("should not allow update of another user's post", async function () {
    let ownerJar = (await util.promisify(api.loginAs)(DUMMY_USER)).jar;
    await util.promisify(api.addPost)(ownerJar, {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    });
    const { posts } = await util.promisify(api.getMyPosts)(ownerJar);
    assert.equal(posts.length, 1);
    const postId = posts[0]._id;
    let otherJar = (await util.promisify(api.loginAs)(ADMIN_USER)).jar;
    await util.promisify(api.addPost)(otherJar, {
      _id: postId,
      name: 'Lullaby - Jack Johnson and Matt Costa - updated',
    });
    assert.equal(
      (await util.promisify(api.getMyPosts)(ownerJar)).posts.length,
      1
    );
  });
});
