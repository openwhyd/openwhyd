/**
 * static controller
 * redirects to static files
 * @author adrienjoly, whyd
 */

var config = require('../models/config.js');
var runsLocally = config.urlPrefix.indexOf('localhost') != -1;

var STATIC_FILES = {
  '/favicon.ico': '/images/favicon' + (runsLocally ? '_orange' : '') + '.ico',
  '/favicon.png': '/images/favicon' + (runsLocally ? '_orange' : '') + '.png',
};

exports.controller = function (request, reqParams, response) {
  var path = request.url.split('?')[0];

  for (let i in STATIC_FILES)
    if (i == path) return response.temporaryRedirect(STATIC_FILES[i]);

  response.temporaryRedirect(path + '/'); // /index.html
};
