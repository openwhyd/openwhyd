// $ npx mocha test/unit/uploadedFile-tests.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

  const moveTo = (filename, toPath) =>
    new Promise((resolve) =>
      uploadedFile.moveTo(filename, toPath, (err, newFilename) =>
        resolve({ err, newFilename }),
      ),
    );

  const renameTo = (filename, toFilename) =>
    new Promise((resolve) =>
      uploadedFile.renameTo(filename, toFilename, (err, newFilename) =>
        resolve({ err, newFilename }),
      ),
    );

  describe('moveTo()', function () {
    it('should move an uploaded file to the avatar directory', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/img1_180x`, 'img1');
      const { err, newFilename } = await moveTo(
        '/upload_data/img1_180x',
        '/uAvatarImg',
      );
      assert.ifError(err);
      assert.equal(newFilename, '/uAvatarImg/img1_180x');
      assert.equal(
        fs.readFileSync(`${whydPath}/uAvatarImg/img1_180x`, 'utf8'),
        'img1',
      );
      await new Promise((resolve) => setTimeout(resolve, 50)); // let the source file be deleted
      assert(!fs.existsSync(`${whydPath}/upload_data/img1_180x`));
    });

    it('should succeed when the same file is moved twice (e.g. double-click on "save")', async function () {
      fs.writeFileSync(`${whydPath}/upload_data/img2_180x`, 'img2');
      const results = await Promise.all([
        moveTo('/upload_data/img2_180x', '/uAvatarImg'),
        moveTo('/upload_data/img2_180x', '/uAvatarImg'),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 50)); // let the source file be deleted
      const again = await moveTo('/upload_data/img2_180x', '/uAvatarImg');
      for (const { err, newFilename } of [...results, again]) {
        assert.ifError(err);
        assert.equal(newFilename, '/uAvatarImg/img2_180x');
      }
      assert.equal(
        fs.readFileSync(`${whydPath}/uAvatarImg/img2_180x`, 'utf8'),
        'img2',
      );
    });

    it('should fail when the uploaded file never existed', async function () {
      const { err } = await moveTo('/upload_data/missing_180x', '/uAvatarImg');
      assert.equal(err?.code, 'ENOENT');
    });
  });

  describe('renameTo()', function () {
    it('should fail when the source is missing, even if a destination with another name exists', async function () {
      // e.g. playlist images are stored at a fixed path => an existing file
      // there does not mean that the uploaded file was moved there
      fs.writeFileSync(`${whydPath}/uPlaylistImg/u1_1`, 'previous image');
      const { err } = await renameTo(
        '/upload_data/missing_180x',
        '/uPlaylistImg/u1_1',
      );
      assert.equal(err?.code, 'ENOENT');
      assert.equal(
        fs.readFileSync(`${whydPath}/uPlaylistImg/u1_1`, 'utf8'),
        'previous image',
      );
    });
  });
});
