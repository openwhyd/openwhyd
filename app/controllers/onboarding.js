/**
 * onboarding controller
 * explains how to install the bookmarklet or chrome extension
 */

const TEMPLATE_FILE = 'app/templates/onboarding.html';
const mainTemplate = require('../templates/mainTemplate.js');
const templateLoader = require('../templates/templateLoader.js');

exports.controller = async function (request, getParams, response) {
  request.logToConsole('onboarding.controller', getParams);
  const loggedUser = (await request.getUser()) || {};
  templateLoader.loadTemplate(TEMPLATE_FILE, function (template) {
    const p = {
      pageUrl: request.url,
      loggedUser: loggedUser,
      css: ['onboarding.css'],
      bodyClass: 'pgOnboarding',
      content: template.render(),
    };
    response.renderHTML(mainTemplate.renderWhydPage(p));
  });
};
