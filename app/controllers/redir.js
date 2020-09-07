/**
 * redir controller
 * redirects to external resources, while tracking the page view
 */

var config = require('../models/config.js');

var GITHUB_URL = 'https://github.com/openwhyd/openwhyd';
var API_PAGE = 'https://openwhyd.github.io/openwhyd/API';
var FAQ_PAGE = 'https://openwhyd.github.io/openwhyd/FAQ';
var SUPPORT_PAGE = FAQ_PAGE + '#how-to-contact-openwhyds-team';
var DONATE_PAGE = 'https://opencollective.com/openwhyd';
var PRIVACY_PAGE = config.urlPrefix + '/privacy';

var REDIRECTIONS = {
  '/about': [
    'https://medium.com/@adrienjoly/music-amongst-other-topics-a4f41657d6d',
    { title: "Openwhyd's story" },
  ],
  '/api': [API_PAGE, { title: 'API Documentation' }],
  '/community': [GITHUB_URL, { title: 'Community' }],
  '/contact': [SUPPORT_PAGE, { title: 'Contact' }],
  '/contribute': [
    FAQ_PAGE + '#id-love-to-contribute-to-openwhyd-how-can-i-help',
    { title: 'Contribute' },
  ],
  '/donate': [DONATE_PAGE, { title: 'Donate' }],
  '/faq': [FAQ_PAGE, { title: 'Frequently Asked Questions' }],
  '/help': [SUPPORT_PAGE, { title: 'Help' }],
  '/sponsor': [DONATE_PAGE, { title: 'Sponsor' }],
  '/support': [SUPPORT_PAGE, { title: 'Support' }],
  '/team': [SUPPORT_PAGE, { title: 'Team' }],
  '/tos': [PRIVACY_PAGE, { title: 'Terms of Service' }],
};

exports.controller = function (request, reqParams, response) {
  var path = request.url.split('?')[0];
  var [redirUrl, { title } = {}] = REDIRECTIONS[path] || [];
  if (redirUrl) {
    response.redirectWithTracking(redirUrl, title);
  } else {
    response.notFound();
  }
};
