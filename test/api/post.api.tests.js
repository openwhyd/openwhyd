const assert = require('assert');
const util = require('util');
const request = require('request');
const {
  OpenwhydTestEnv,
  ObjectId,
  dumpMongoCollection,
} = require('../approval-tests-helpers.js');

const {
  ADMIN_USER,
  cleanup,
  URL_PREFIX,
  DUMMY_USER,
  FAKE_ID,
} = require('../fixtures.js');
const api = require('../api-client.js');
const randomString = () => Math.random().toString(36).substring(2, 9);

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

describe(`post api`, function () {
  const loggedUser = ADMIN_USER;
  const otherUser = DUMMY_USER;
  let post;
  let jar;
  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  beforeEach(cleanup.bind(this, { silent: true })); // to prevent side effects between tests

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    post = {
      eId: `/yt/${randomString()}`,
      name: `Lullaby - Jack Johnson and Matt Costa`,
    };

    ({ jar } = await util.promisify(api.loginAs)(loggedUser));
    /* FIXME: We are forced to use the ADMIN_USER, since DUMMY_USER is mutated by user.api.tests.js and the db cleanup seems to not work for the users collection.
     * May be initdb_testing.js is not up to date with the current schema?
     */
  });

  it("should return a 404 for post that doesn't exist", async () => {
    const { response } = await util.promisify(api.getRaw)(
      null,
      `/c/${FAKE_ID}`,
    );
    assert.equal(response.statusCode, 404);
  });

  it("should edit a track's name", async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const newName = 'coucou';
    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: newName,
            _id: pId,
            pl: { id: null, name: 'full stream' },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, newName);
    assert.equal(postedTrack.eId, post.eId);
  });

  it('should add a track', async function () {
    const name = randomString();
    const ctx = 'bk';

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            ctx: ctx,
            pl: { id: null, name: 'full stream' },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const postedTrack = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.isNew, true);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.ok(postedTrack._id);
    assert.equal(postedTrack.pl, undefined);
  });

  it('should add a track to an existing playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const ctx = 'bk';
    const playlist = body.pl;
    const description = 'this is a description';

    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            _id: pId,
            ctx: ctx,
            pl: { id: playlist.id, name: playlist.name },
            text: description,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.pl.id, playlist.id);
    assert.equal(postedTrack.pl.name, playlist.name);
    assert.equal(postedTrack.text, description);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
  });

  it('should add a track to a new playlist', async function () {
    const name = randomString();
    const ctx = 'bk';
    const newPlayListName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            ctx: ctx,
            pl: { id: 'create', name: newPlayListName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const postedTrack = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.isNew, true);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.ok(postedTrack._id);
    assert.equal(typeof postedTrack.pl.id, 'number');
    assert.equal(postedTrack.pl.name, newPlayListName);
  });

  it('should re-add a track into a new playlist', async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const name = body.name;
    const ctx = 'bk';
    const newPlayListName = randomString();
    const description = 'this is a description';

    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            _id: pId,
            ctx: ctx,
            pl: { id: 'create', name: newPlayListName },
            text: description,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.pl.name, newPlayListName);
    assert.equal(postedTrack.text, description);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
  });

  it('should re-add a track to a new playlist from the stream or from the Tracks in the user profile', async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const name = body.name;
    const newPlayListName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: 'create', name: newPlayListName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.notEqual(postedTrack.pl.id, undefined);
    assert.equal(postedTrack.pl.name, newPlayListName);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });

  it('should re-add a track into an existing playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const playlist = body.pl;

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: playlist.id, name: playlist.name },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.notEqual(postedTrack.pl.id, undefined);
    assert.equal(postedTrack.pl.id, playlist.id);
    assert.equal(postedTrack.pl.name, playlist.name);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });

  it('should allow re-adding a track into another playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const newPlaylistName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: 'create', name: newPlaylistName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.ok(postedTrack.pl.id);
    assert.equal(postedTrack.pl.name, newPlaylistName);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });

  it('should fail to delete a comment that does not exist', async function () {
    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'deleteComment',
            pId: '000000000000000000000009',
            _id: '000000000000000000000009',
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );

    const resBody = JSON.parse(res.body);

    assert.deepEqual(resBody, { error: 'comment not found' });
  });

  it('should fail to delete a comment on a post that does not exist', async function () {
    const postId = '000000000000000000000009';
    const commentId = '000000000000000000000010';
    await openwhyd.insertTestData({
      comment: [{ _id: ObjectId(commentId), pId: postId }],
    });

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'deleteComment',
            pId: postId,
            _id: commentId,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const resBody = JSON.parse(res.body);
    assert.deepEqual(resBody, { error: 'post not found' });
  });

  it("should fail to delete someone else's comment", async function () {
    const postId = '000000000000000000000009';
    const commentId = '000000000000000000000010';
    await openwhyd.insertTestData({
      post: [{ _id: ObjectId(postId) }],
      comment: [{ _id: ObjectId(commentId), pId: postId, uId: otherUser._id }],
    });

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'deleteComment',
            pId: postId,
            _id: commentId,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const resBody = JSON.parse(res.body);
    assert.deepEqual(resBody, {
      error: 'you are not allowed to delete this comment',
    });
  });

  it("should delete one's own comments", async function () {
    const postId = '000000000000000000000009';
    const commentId = '000000000000000000000010';
    await openwhyd.insertTestData({
      post: [{ _id: ObjectId(postId) }],
      comment: [{ _id: ObjectId(commentId), pId: postId, uId: loggedUser.id }],
    });

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'deleteComment',
            pId: postId,
            _id: commentId,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const resBody = JSON.parse(res.body);
    assert.deepEqual(resBody, { acknowledged: true, deletedCount: 1 });
  });

  it("should allow post's author to delete anyone's comment on that post", async function () {
    const postId = '000000000000000000000009';
    const commentId = '000000000000000000000010';
    await openwhyd.insertTestData({
      post: [{ _id: ObjectId(postId), uId: loggedUser.id }],
      comment: [{ _id: ObjectId(commentId), pId: postId, uId: otherUser.id }],
    });

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'deleteComment',
            pId: postId,
            _id: commentId,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const resBody = JSON.parse(res.body);
    assert.deepEqual(resBody, { acknowledged: true, deletedCount: 1 });
  });

  it("should post a comment on anyone's post", async function () {
    const postId = '000000000000000000000009';
    const commentText = '"hello world"';
    await openwhyd.insertTestData({
      post: [{ _id: ObjectId(postId) }],
    });

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'addComment',
            pId: postId,
            text: commentText,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body }),
      ),
    );
    const resBody = JSON.parse(res.body);
    assert(resBody?._id, '_id should be provided in response');
    assert.equal(typeof resBody._id, 'string');
    assert.notEqual(resBody._id, '', '_id should not be empty');
  });

  describe('`incrPlayCounter` action', () => {
    const insertPost = (postId, props) =>
      openwhyd.insertTestData({
        post: [{ _id: ObjectId(postId), ...props }],
      });

    const callPostApi = (form) =>
      new Promise((resolve, reject) =>
        request.post(
          {
            jar,
            form,
            url: `${URL_PREFIX}/api/post`,
          },
          (error, response, body) =>
            error ? reject(error) : resolve({ response, body }),
        ),
      );

    it('should increase the number of plays of the post', async () => {
      // Given a post with 0 plays
      const postId = '000000000000000000000009';
      await insertPost(postId, { nbP: 0 });

      // When requesting to increase the play counter for that post
      await callPostApi({ action: 'incrPlayCounter', pId: postId });

      // Then the number of plays of that post is 1
      const [postAfter] = await dumpMongoCollection(MONGODB_URL, 'post');
      assert.equal(postAfter.nbP, 1);
    });

    it('should increase the total number of plays of that track', async () => {
      // Given a post with 0 plays
      const postId = '000000000000000000000009';
      await insertPost(postId, { nbP: 0, eId: '/yt/fake_video_id' });

      // When requesting to increase the play counter for that post
      await callPostApi({ action: 'incrPlayCounter', pId: postId });

      // Then the post _id is returned
      const [trackAfter] = await dumpMongoCollection(MONGODB_URL, 'track');
      assert.equal(trackAfter.nbP, 1);
    });
  });
});
