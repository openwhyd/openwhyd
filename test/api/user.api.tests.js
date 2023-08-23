const fs = require('fs');
const assert = require('assert');
const util = require('util');

const { OpenwhydTestEnv } = require('../approval-tests-helpers.js');
const { DUMMY_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');

describe('user api', function () {
  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(cleanup.bind(this, { silent: true })); // to prevent side effects between tests

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  describe(`getting user data`, function () {
    it(`gets user profile data`, function (done) {
      const url =
        '/api/user?includeSubscr=true&isSubscr=true&countPosts=true&countLikes=true';
      api.loginAs(DUMMY_USER, function (error, { jar }) {
        api.get(jar, url, function (err, { body, ...res }) {
          assert.ifError(err);
          assert.equal(res.response.statusCode, 200);
          assert(!body.error);
          assert.equal(body.email, DUMMY_USER.email);
          done();
        });
      });
    });

    it("should provide user's avatar thru /uAvatarImg/{uid}", async () => {
      // given a user with a custom avatar / user image
      const { jar } = await util.promisify(api.loginAs)(DUMMY_USER);
      const tmpImage = await api.uploadImage(
        jar,
        fs.createReadStream('./public/press/images/adrien.png'),
      );
      const tmpImageData = await fs.promises.readFile(`./${tmpImage.path}`);
      await util.promisify(api.setUser)(jar, { img: tmpImage.path });

      // when they ask for their avatar URL
      const url = `/uAvatarImg/${DUMMY_USER.id}`;
      const { body } = await util.promisify(api.getRaw)(jar, url);

      // then they should be redirected to the final URL of that image
      assert.equal(body, tmpImageData.toString());
    });
  });

  describe(`setting user data`, function () {
    before(cleanup.bind(this, { silent: true })); // to prevent side effects between tests

    it(`updates the user's name`, function (done) {
      api.loginAs(DUMMY_USER, function (error, { body, jar }) {
        assert.ifError(body.error);
        assert(body.redirect);
        api.getUser(jar, {}, function (error, { body }) {
          assert.equal(body.name, DUMMY_USER.name);
          const newName = 'renamed user';
          api.setUser(jar, { name: newName }, function (error, { body }) {
            assert.equal(body.name, newName);
            done();
          });
        });
      });
    });
  });

  it('should allow just one value for the `after` parameter, when fetching subscribers', async () => {
    const url = '/dummy/subscribers?after=50&after=100';
    const { body, ...res } = await util.promisify(api.get)({}, url);
    assert.equal(res.response.statusCode, 400);
    assert.equal(body.error, 'invalid parameter value: after');
  });
});
