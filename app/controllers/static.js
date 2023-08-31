/**
 * static controller
 * redirects to static files
 * @author adrienjoly, whyd
 */

const config = require('../models/config.js');
const runsLocally = config.urlPrefix.indexOf('localhost') != -1;

const STATIC_FILES = {
  '/favicon.ico': '/images/favicon' + (runsLocally ? '_orange' : '') + '.ico',
  '/favicon.png': '/images/favicon' + (runsLocally ? '_orange' : '') + '.png',
};

exports.controller = function (request, reqParams, response) {
  const path = request.url.split('?')[0];

  for (const i in STATIC_FILES)
    if (i == path) return response.temporaryRedirect(STATIC_FILES[i]);

  response.temporaryRedirect(path + '/'); // /index.html
};
