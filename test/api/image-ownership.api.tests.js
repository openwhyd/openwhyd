const fs = require('fs');
const path = require('path');
const assert = require('assert');
const util = require('util');

const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { ADMIN_USER, DUMMY_USER } = require('../fixtures.js');
const api = require('../api-client.js');

const SAMPLE_IMAGE = './public/press/images/adrien.png';

// strings that should never appear in error messages returned by the API
const TECHNICAL_DETAILS =
  /ENOENT|errno|syscall|upload_data|uAvatarImg|uCoverImg|uPlaylistImg|\/usr\/|copyfile|Error:/;

const assertNoTechnicalDetails = (body) =>
  assert(
    !TECHNICAL_DETAILS.test(JSON.stringify(body)),
    `response should not contain technical details: ${JSON.stringify(body)}`,
  );

const fileExists = (filePath) => fs.existsSync(`./${filePath}`);

describe('image ownership and error messages', function () {
  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  const login = async (user) => (await util.promisify(api.loginAs)(user)).jar;
  const upload = (jar) =>
    api.uploadImage(jar, fs.createReadStream(SAMPLE_IMAGE));
  const setUser = async (jar, body) =>
    (await util.promisify(api.setUser)(jar, body)).body;
  const updatePlaylistImage = async (jar, img) =>
    (
      await util.promisify(api.postRaw)(jar, '/api/playlist', {
        action: 'update',
        id: '1',
        img,
      })
    ).body;

  it('uploaded files are named after their uploader', async () => {
    const jar = await login(DUMMY_USER);
    const uploaded = await upload(jar);
    assert(
      path.basename(uploaded.path).startsWith(`${DUMMY_USER.id}_`),
      uploaded.path,
    );
  });

  it('a user can set their avatar twice with the same uploaded image (e.g. double-click on "save")', async () => {
    const jar = await login(DUMMY_USER);
    const uploaded = await upload(jar);
    const res1 = await setUser(jar, { img: uploaded.path });
    const res2 = await setUser(jar, { img: uploaded.path });
    assert(!res1.error, res1.error);
    assert(!res2.error, res2.error);
    assert.equal(res2.img, res1.img);
    assert(fileExists(res1.img));
  });

  it("a user can't use an image uploaded by another user as their avatar", async () => {
    const uploaded = await upload(await login(ADMIN_USER));
    const res = await setUser(await login(DUMMY_USER), { img: uploaded.path });
    assert(res.error);
    assertNoTechnicalDetails(res);
    assert(fileExists(uploaded.path)); // the other user can still use it
  });

  it("a user can't use an image uploaded by another user as their cover image", async () => {
    const uploaded = await upload(await login(ADMIN_USER));
    const res = await setUser(await login(DUMMY_USER), {
      cvrImg: uploaded.path,
    });
    assert(res.error);
    assertNoTechnicalDetails(res);
    assert(fileExists(uploaded.path));
  });

  it("a user can't use an image uploaded by another user as a playlist image", async () => {
    const uploaded = await upload(await login(ADMIN_USER));
    const res = await updatePlaylistImage(
      await login(DUMMY_USER),
      uploaded.path,
    );
    assert(res.error);
    assertNoTechnicalDetails(res);
    assert(fileExists(uploaded.path));
  });

  it("a user can't claim (and then delete) the avatar of another user", async () => {
    // given another user with a custom avatar
    const adminJar = await login(ADMIN_USER);
    const { img: victimAvatar } = await setUser(adminJar, {
      img: (await upload(adminJar)).path,
    });
    assert(fileExists(victimAvatar));

    // when a user tries to claim that avatar, then change their avatar
    const jar = await login(DUMMY_USER);
    const res = await setUser(jar, {
      img: `/upload_data/${path.basename(victimAvatar)}`,
    });
    await setUser(jar, { img: (await upload(jar)).path });

    // then the claim should fail, and the avatar of the other user should not be deleted
    assert(res.error);
    assertNoTechnicalDetails(res);
    assert(fileExists(victimAvatar));
  });

  it("a user can't delete the avatar of another user thru /upload", async () => {
    const adminJar = await login(ADMIN_USER);
    const { img: victimAvatar } = await setUser(adminJar, {
      img: (await upload(adminJar)).path,
    });
    const jar = await login(DUMMY_USER);
    const { body } = await api.deleteUploadedFile(
      jar,
      `../uAvatarImg/${path.basename(victimAvatar)}`,
    );
    assertNoTechnicalDetails(body);
    assert(fileExists(victimAvatar));
  });

  it("a user can't delete an image uploaded by another user", async () => {
    const uploaded = await upload(await login(ADMIN_USER));
    const { body } = await api.deleteUploadedFile(
      await login(DUMMY_USER),
      path.basename(uploaded.path),
    );
    assert(body.error);
    assertNoTechnicalDetails(body);
    assert(fileExists(uploaded.path));
  });

  it('a user can delete an image that they uploaded', async () => {
    const jar = await login(DUMMY_USER);
    const uploaded = await upload(jar);
    const { body } = await api.deleteUploadedFile(
      jar,
      path.basename(uploaded.path),
    );
    assert(!body.error, body.error);
    assert(!fileExists(uploaded.path));
  });

  it('setting a missing image as avatar returns an error without technical details', async () => {
    const res = await setUser(await login(DUMMY_USER), {
      img: `/upload_data/${DUMMY_USER.id}_missing_180x`,
    });
    assert(res.error);
    assertNoTechnicalDetails(res);
  });

  it('uploading an image that cannot be processed returns an error without technical details', async () => {
    // given a text file disguised as an image
    const fakeImagePath = path.join(
      fs.mkdtempSync(path.join(require('os').tmpdir(), 'openwhyd-')),
      'fake.png',
    );
    fs.writeFileSync(fakeImagePath, 'this is not an image');
    const jar = await login(DUMMY_USER);
    const uploaded = await api.uploadImage(
      jar,
      fs.createReadStream(fakeImagePath),
    );
    assert.equal(
      uploaded.error,
      'This image could not be processed. Please try another one.',
    );
    assertNoTechnicalDetails(uploaded);
  });
});
