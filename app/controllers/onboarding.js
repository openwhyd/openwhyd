/**
 * onboarding controller
 * handles the onboarding process (for new users)
 * @author adrienjoly, whyd
 */

var analytics = require('../models/analytics.js');
var TEMPLATE_FILE = 'app/templates/onboarding.html';
var mainTemplate = require('../templates/mainTemplate.js');
var templateLoader = require('../templates/templateLoader.js');

exports.controller = function (request, getParams, response) {
  request.logToConsole('onboarding.controller', getParams);
  templateLoader.loadTemplate(TEMPLATE_FILE, function (template) {
    const p = {
      pageUrl: request.url,
      css: ['onboarding.css'],
      bodyClass: 'pgOnboarding stepButton minimalHeader',
      stepButton: true,
    };
    p.content = template.render(p);
    response.renderHTML(mainTemplate.renderWhydPage(p)); // p.content
    analytics.addVisit(p.loggedUser, p.pageUrl);
  });
};
