// A private controller for Cypress to be able to reset the database between tests

const path = require('path');
const { readdirSync, rmSync } = require('fs');

const mongodb = require('../../models/mongodb.js');

exports.controller = async function (request, getParams, response) {
  // Important: After calling this `/testing/reset` route, other pending HTTP requests may never return.
  request.logToConsole('reset.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (!process.appParams.isOnTestDatabase) {
    return response.forbidden(new Error('allowed on test database only'));
  }
  try {
    // reinitialize database state
    await mongodb.clearCollections();
    await mongodb.initCollections({ addTestData: true });

    // delete uploaded files
    const appDir = process.cwd();
    ['uAvatarImg', 'uCoverImg', 'uPlaylistImg', 'upload_data'].forEach(
      (subDir) => {
        const dir = path.join(appDir, subDir);
        readdirSync(dir).forEach((file) => {
          console.warn(`reset.controller deleting ${dir}/${file}`);
          rmSync(`${dir}/${file}`);
        });
      },
    );

    response.renderJSON({ ok: true });
  } catch (err) {
    response.renderJSON({ error: err.message });
  }
};
