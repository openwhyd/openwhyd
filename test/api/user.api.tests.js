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

      // when they ask for their avatar
      const url = `/uAvatarImg/${DUMMY_USER.id}`;
      const { body } = await util.promisify(api.getRaw)(jar, url);

      // then they should receive the image data
      assert.equal(body, tmpImageData.toString());
    });

    it("should provide user's avatar thru /uAvatarImg/{path}", async () => {
      // given a user with a custom avatar / user image
      const { jar } = await util.promisify(api.loginAs)(DUMMY_USER);
      const tmpImage = await api.uploadImage(
        jar,
        fs.createReadStream('./public/press/images/adrien.png'),
      );
      const tmpImageData = await fs.promises.readFile(`./${tmpImage.path}`);
      const res = await util.promisify(api.setUser)(jar, {
        img: tmpImage.path,
      });
      const url = res.body.img;
      assert(url.startsWith('/uAvatarImg/'));

      // when they ask for their avatar
      const { body } = await util.promisify(api.getRaw)(jar, url);

      // then they should receive the image data
      assert.equal(body, tmpImageData.toString());
    });

    it("should provide a default avatar for users that don't exist", async () => {
      // when somebody asks for the avatar of a user that does not exist
      const url = `/uAvatarImg/ababababababab`;
      const { body } = await util.promisify(api.getRaw)(null, url);

      // then they should receive a default avatar
      const defaultAvatarData = await fs.promises.readFile(
        `./public/images/blank_user.gif`,
        'utf-8',
      );
      assert.equal(body, defaultAvatarData.toString());
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
