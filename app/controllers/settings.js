/**
 * settings controller
 * @author adrienjoly, whyd
 */

var templateLoader = require('../templates/templateLoader.js');
var mainTemplate = require('../templates/mainTemplate.js');

var TEMPLATE_FILE = 'app/templates/settings.html';
var pageTemplate = null;

exports.refreshTemplates = function (callback) {
  pageTemplate = templateLoader.loadTemplate(TEMPLATE_FILE, callback);
};

exports.refreshTemplates();

exports.renderSettingsForm = function (p, cb) {
  /*exports.refreshTemplates(function(){*/
  p.user = p.loggedUser;
  p.content = pageTemplate.render(p);
  p.bodyClass = 'pgSettings';
  cb({ html: mainTemplate.renderWhydPage(p) });
  /*});*/
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('settings.controller', request.method);
  reqParams = reqParams || {};
  reqParams.loggedUser = request.checkLogin(response);
  if (!reqParams.loggedUser) return;

  exports.renderSettingsForm(reqParams, function (res) {
    response.legacyRender(res.html, null, { 'content-type': 'text/html' });
  });
};
