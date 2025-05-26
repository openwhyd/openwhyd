/**
 * settings controller
 * @author adrienjoly, whyd
 */

const templateLoader = require('../templates/templateLoader.js');
const mainTemplate = require('../templates/mainTemplate.js');

const TEMPLATE_FILE = 'app/templates/settings.html';
let pageTemplate = null;

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

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('settings.controller', request.method);
  reqParams = reqParams || {};
  reqParams.loggedUser = await request.checkLogin(response);
  if (!reqParams.loggedUser) return;

  exports.renderSettingsForm(reqParams, function (res) {
    response.legacyRender(res.html, null, { 'content-type': 'text/html' });
  });
};
