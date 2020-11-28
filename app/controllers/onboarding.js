/**
 * onboarding controller
 * explains how to install the bookmarklet or chrome extension
 */

var analytics = require('../models/analytics.js');
var TEMPLATE_FILE = 'app/templates/onboarding.html';
var mainTemplate = require('../templates/mainTemplate.js');
var templateLoader = require('../templates/templateLoader.js');

exports.controller = function (request, getParams, response) {
  request.logToConsole('onboarding.controller', getParams);
  var loggedUser = request.getUser() || {};
  templateLoader.loadTemplate(TEMPLATE_FILE, function (template) {
    const p = {
      pageUrl: request.url,
      loggedUser: loggedUser,
      css: ['onboarding.css'],
      bodyClass: 'pgOnboarding',
      content: template.render(),
    };
    response.renderHTML(mainTemplate.renderWhydPage(p));
    analytics.addVisit(loggedUser, request.url);
  });
};
