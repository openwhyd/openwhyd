/**
 * redir controller
 * redirects to external resources, while tracking the page view
 */

var config = require('../models/config.js');

var GITHUB_URL = 'https://github.com/openwhyd/openwhyd';
var FAQ_PAGE = GITHUB_URL + '/blob/master/docs/FAQ.md';
var SUPPORT_PAGE =
  GITHUB_URL + '/blob/master/docs/FAQ.md#how-to-contact-openwhyds-team';
var DONATE_PAGE = 'https://opencollective.com/openwhyd';
var PRIVACY_PAGE = config.urlPrefix + '/privacy';

var REDIRECTIONS = {
  '/about': [
    'https://medium.com/@adrienjoly/music-amongst-other-topics-a4f41657d6d',
    "Openwhyd's story"
  ],
  '/api': [GITHUB_URL + '/blob/master/docs/API.md', 'API Documentation'],
  '/community': [GITHUB_URL, 'Community'],
  '/contact': [SUPPORT_PAGE, 'Contact'],
  '/contribute': [
    FAQ_PAGE + '#id-love-to-contribute-to-openwhyd-how-can-i-help',
    'Contribute'
  ],
  '/donate': [DONATE_PAGE, 'Donate'],
  '/faq': [FAQ_PAGE, 'Frequently Asked Questions'],
  '/help': [SUPPORT_PAGE, 'Help'],
  '/sponsor': [DONATE_PAGE, 'Sponsor'],
  '/support': [SUPPORT_PAGE, 'Support'],
  '/team': [SUPPORT_PAGE, 'Team'],
  '/tos': [PRIVACY_PAGE, 'Terms of Service']
};

exports.controller = function(request, reqParams, response) {
  var path = request.url.split('?')[0];
  var [redirUrl, redirTitle] = REDIRECTIONS[path] || [];
  if (redirUrl) {
    response.redirectWithTracking(redirUrl, redirTitle);
  } else {
    response.notFound();
  }
};
