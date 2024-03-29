/**
 * redir controller
 * redirects to external resources, while tracking the page view
 */

const config = require('../models/config.js');

const GITHUB_URL = 'https://github.com/openwhyd/openwhyd';
const API_PAGE = 'https://openwhyd.github.io/openwhyd/API';
const FAQ_PAGE = 'https://openwhyd.github.io/openwhyd/FAQ';
const SUPPORT_PAGE = FAQ_PAGE + '#how-to-contact-openwhyds-team';
const DONATE_PAGE = 'https://opencollective.com/openwhyd';
const PRIVACY_PAGE = config.urlPrefix + '/privacy';
const LOGOUT_PAGE = config.urlPrefix + '/login?action=logout';

const REDIRECTIONS = {
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
  '/logout': [LOGOUT_PAGE, { title: 'Logout' }],
};

exports.controller = function (request, reqParams, response) {
  const path = request.url.split('?')[0];
  const [redirUrl, { title } = {}] = REDIRECTIONS[path] || [];
  if (redirUrl) {
    response.redirectWithTracking(redirUrl, title);
  } else {
    response.notFound();
  }
};
