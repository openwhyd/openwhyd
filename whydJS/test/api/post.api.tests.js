var assert = require('assert');
var request = require('request');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
var api = require('../api-client.js');

describe(`post api`, function () {

  var pId;
  const post = {
    eId: '/yt/XdJVWSqb4Ck',
    name: 'Lullaby - Jack Johnson and Matt Costa',
  };

  it(`should allow adding a track`, function (done) {
    api.loginAs(TEST_USER, function (error, { response, body, jar }) {
      api.addPost(jar, post, function (error, { response, body }) {
        assert.ifError(error);
        assert.equal(body.eId, post.eId);
        assert.equal(body.name, post.name);
        assert(body._id);
        pId = body._id;
        done();
      });
    });
  });

  it(`should allow re-adding a track (aka "repost")`, function (done) {
    api.loginAs(TEST_USER, function (error, { response, body, jar }) {
      api.addPost(jar, { pId }, function (error, { response, body }) {
        console.log('REPOST =>', error || body);
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

  // TODO: update post
  // TODO: delete post

  it(`should return the comment data after adding it`, function (done) {
    api.loginAs(TEST_USER, function (error, { response, body, jar }) {
      const comment = {
        pId,
        text: 'hello world',
      };
      api.addComment(jar, comment, function (error, { response, body }) {
        assert.ifError(error);
        assert.equal(body.pId, comment.pId);
        assert.equal(body.text, comment.text);
        assert(body._id);
        done();
      });
    });
  });

});
