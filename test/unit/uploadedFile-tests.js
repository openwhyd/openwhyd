// $ npx mocha test/unit/uploadedFile-tests.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const USER_A = '000000000000000000000001';
const USER_B = '000000000000000000000002';

describe('uploadedFile.js', function () {
  let whydPath;
  let uploadedFile;

  before(function () {
    whydPath = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'openwhyd-uploadedFile-tests-')),
    );
    const paths = {
      whydPath,
      uploadDirName: 'upload_data',
      uAvatarImgDirName: 'uAvatarImg',
      uCoverImgDirName: 'uCoverImg',
      uPlaylistDirName: 'uPlaylistImg',
    };
    process.appParams = { ...process.appParams, paths };
    // config.js copies process.appParams when it's first loaded, which may have happened already
    require('../../app/models/config.js').paths = paths;
    uploadedFile = require('../../app/controllers/uploadedFile.js');
  });

  after(function () {
    fs.rmSync(whydPath, { recursive: true, force: true });
  });

  const waitForCleanup = () =>
    new Promise((resolve) => setTimeout(resolve, 50));

  const moveTo = (filename, toPath, uploaderId) =>
    new Promise((resolve) =>
      uploadedFile.moveTo(filename, toPath, uploaderId, (err, newFilename) =>
        resolve({ err, newFilename }),
      ),
    );

  const renameTo = (filename, toFilename, uploaderId) =>
    new Promise((resolve) =>
      uploadedFile.renameTo(
        filename,
        toFilename,
        uploaderId,
        (err, newFilename) => resolve({ err, newFilename }),
      ),
    );

  describe('isUploadedBy()', function () {
    it('should return true for a file uploaded by that user', function () {
      const name = uploadedFile.makeUploadedFileName(USER_A, 'abc');
      assert(uploadedFile.isUploadedBy(USER_A, `/upload_data/${name}_180x`));
    });

    it('should return false for a file uploaded by another user', function () {
      const name = uploadedFile.makeUploadedFileName(USER_B, 'abc');
      assert(!uploadedFile.isUploadedBy(USER_A, `/upload_data/${name}_180x`));
    });

    it('should return false for a file that is not in the upload directory', function () {
      assert(
        !uploadedFile.isUploadedBy(USER_A, `/uAvatarImg/${USER_A}_abc_180x`),
      );
      assert(
        !uploadedFile.isUploadedBy(
          USER_A,
          `/upload_data/../uAvatarImg/${USER_A}_abc_180x`,
        ),
      );
    });

    it('should return false for an invalid user id', function () {
      assert(!uploadedFile.isUploadedBy('', `/upload_data/_abc_180x`));
      assert(!uploadedFile.isUploadedBy(undefined, `/upload_data/_abc_180x`));
    });
  });

  describe('moveTo()', function () {
    it('should move a file uploaded by the user to the avatar directory', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/${USER_A}_img1_180x`, 'img1');
      const { err, newFilename } = await moveTo(
        `/upload_data/${USER_A}_img1_180x`,
        '/uAvatarImg',
        USER_A,
      );
      assert.ifError(err);
      assert.equal(newFilename, `/uAvatarImg/${USER_A}_img1_180x`);
      assert.equal(
        fs.readFileSync(`${whydPath}/uAvatarImg/${USER_A}_img1_180x`, 'utf8'),
        'img1',
      );
      await waitForCleanup();
      assert(!fs.existsSync(`${whydPath}/upload_data/${USER_A}_img1_180x`));
    });

    it('should not move (nor delete) a file uploaded by another user', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/${USER_B}_img2_180x`, 'img2');
      const { err } = await moveTo(
        `/upload_data/${USER_B}_img2_180x`,
        '/uAvatarImg',
        USER_A,
      );
      assert(err);
      await waitForCleanup();
      assert(!fs.existsSync(`${whydPath}/uAvatarImg/${USER_B}_img2_180x`));
      assert(fs.existsSync(`${whydPath}/upload_data/${USER_B}_img2_180x`));
    });

    it('should fail when the uploaded file does not exist, even if a file with the same name exists at destination', async function () {
      // e.g. user A tries to claim the avatar of user B, to delete it later
      fs.writeFileSync(`${whydPath}/uAvatarImg/${USER_A}_img3_180x`, 'img3');
      const { err } = await moveTo(
        `/upload_data/${USER_A}_img3_180x`,
        '/uAvatarImg',
        USER_A,
      );
      assert.equal(err?.code, 'ENOENT');
      assert(fs.existsSync(`${whydPath}/uAvatarImg/${USER_A}_img3_180x`));
    });

    it('should fail when no uploader id is provided', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/${USER_A}_img4_180x`, 'img4');
      const { err } = await moveTo(
        `/upload_data/${USER_A}_img4_180x`,
        '/uAvatarImg',
        undefined,
      );
      assert(err);
      assert(!fs.existsSync(`${whydPath}/uAvatarImg/${USER_A}_img4_180x`));
    });
  });

  describe('renameTo()', function () {
    it('should move a file uploaded by the user to the playlist directory', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/${USER_A}_img5_180x`, 'img5');
      const { err } = await renameTo(
        `/upload_data/${USER_A}_img5_180x`,
        `/uPlaylistImg/${USER_A}_1`,
        USER_A,
      );
      assert.ifError(err);
      assert.equal(
        fs.readFileSync(`${whydPath}/uPlaylistImg/${USER_A}_1`, 'utf8'),
        'img5',
      );
    });

    it('should not move a file uploaded by another user', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/${USER_B}_img6_180x`, 'img6');
      const { err } = await renameTo(
        `/upload_data/${USER_B}_img6_180x`,
        `/uPlaylistImg/${USER_A}_2`,
        USER_A,
      );
      assert(err);
      assert(!fs.existsSync(`${whydPath}/uPlaylistImg/${USER_A}_2`));
    });
  });
});
