/**
 * mainTemplate templates
 * server-side functions that are commonly used to render openwhyd pages
 * @author adrienjoly, whyd
 **/

const fs = require('fs');
const util = require('util');
const snip = require('../snip.js');
const uiSnippets = snip;
const config = require('../models/config.js');
const render = { urlPrefix: '' };

const includeSuffix = '?' + config.version;

let playemFile;
let fbId;
const isProduction = config.urlPrefix.indexOf('openwhyd.org') > 0;
if (isProduction) {
  //console.log('- Production - ');
  fbId = '169250156435902';
  playemFile = 'min';
} else {
  //console.log('- Local - ');
  fbId = '1573219269412628';
  playemFile = 'all';
}

//console.log("[mainTemplate] today is week #", snip.getWeekNumber(new Date()));

const playerHtmlCode = fs.readFileSync('app/templates/whydPlayer.html', 'utf8');

exports.defaultPageMeta = {
  img: config.urlPrefix + '/images/logo-black-square-smaller.png',
  desc: 'Discover and collect music gems from Youtube, Soundcloud, Deezer and more',
};

function makeMetaHead(options = {}) {
  const appUrl =
    options.pageUrl &&
    'whyd://app?href=' +
      snip.addSlashes(
        options.pageUrl
          .replace('https:', 'http:')
          .replace(config.urlPrefix, ''),
      );
  const pageImg = uiSnippets.htmlEntities(
    options.pageImage || exports.defaultPageMeta.img,
  );
  const pageDesc = uiSnippets.htmlEntities(
    options.pageDesc || exports.defaultPageMeta.desc,
  );
  const meta = [
    '<meta name="google-site-verification" content="mmqzgEU1bjTfJ__nW6zioi7O9vuur1SyYfW44DH6ozg" />',
    '<meta name="apple-itunes-app" content="app-id=874380201' +
      (appUrl ? ', app-argument=' + appUrl : '') +
      '">',
    '<link rel="image_src" href="' + pageImg + '"/>',
    '<meta name="description" content="' + pageDesc + '" />',
    '<meta name="keywords" content="discover, music, curation, streaming, tracks, youtube, soundcloud, bandcamp, playlists, play, free" />',
    '<meta name="twitter:card" content="summary" />',
    '<meta name="twitter:site" content="@open_whyd" />',
    '<meta property="og:image" content="' + pageImg + '" />',
    '<meta property="og:description" content="' + pageDesc + '" />',
    '<meta property="fb:app_id" content="' + fbId + '" />',
    '<meta property="fb:admins" content="510739408" />',
    '<meta property="og:type" content="' +
      uiSnippets.htmlEntities(options.pageType || 'website') +
      '" />',
  ];
  if (options.pageTitle)
    meta.push(
      '<meta property="og:title" content="' +
        uiSnippets.htmlEntities(options.ogTitle || options.pageTitle) +
        '" />',
    );
  if (options.pageUrl)
    meta.push(
      '<meta property="og:url" content="' +
        uiSnippets.htmlEntities(options.pageUrl) +
        '" />',
    );
  return meta;
}

const htmlHeading = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# whydapp: http://ogp.me/ns/fb/whydapp#">', // music: http://ogp.me/ns/music# video: http://ogp.me/ns/video# website: http://ogp.me/ns/website#
  '    <meta charset="utf-8" />',
];

exports.makeAnalyticsHeading = function (user) {
  const errorTracking = process.env.DISABLE_DATADOG
    ? ''
    : `
  <script>
  (function(h,o,u,n,d) {
    h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
    d=o.createElement(u);d.async=1;d.src=n
    n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
  })(window,document,'script','https://www.datadoghq-browser-agent.com/datadog-rum.js','DD_RUM')
  DD_RUM.onReady(function() {
    DD_RUM.init({
      clientToken: 'pub8eeb8858448e59bbb3db9e58371cc3d2',
      applicationId: '5897e862-9942-4dd4-98a7-87a51a93fb91',
      site: 'datadoghq.com',
      service: 'openwhyd.org',
      //  env: 'production',
      //  version: '1.0.0',
      sampleRate: 100,
      trackInteractions: true,
    })
  })
  </script>`;
  // only render opengraph preferences (in order to avoid rendering a date object for nextEmail/nextEN)
  const userPrefs = {};
  for (const i in (user || {}).pref)
    if (i.indexOf('og') == 0) userPrefs[i] = user.pref[i];
  return [
    ...errorTracking.split('\n'), // --> https://app.datadoghq.com/rum
    '<script>',
    '  window.user = ' +
      (!user
        ? '{}'
        : util.inspect({
            id: user.id,
            name: uiSnippets.htmlEntities(user.name),
            fbId: user.fbId,
            handle: uiSnippets.htmlEntities(user.handle),
            pref: userPrefs,
            lastFm: user.lastFm,
          })) +
      ';',
    '  window.playTrack = window.playTrack || function(){};', // prevent videos from playing in another tab, until whydPlayer is loaded
    '</script>',
    '<script src="/js/whydtr.js' + includeSuffix + '"></script>',
    '<link rel="stylesheet" type="text/css" href="/css/cookieconsent2-3.0.3.min.css" />',
    '<script src="/js/cookieconsent2-3.0.3.min.js"></script>',
    '<script>',
    '  /* generated from https://cookieconsent.insites.com/download/ */',
    '  window.addEventListener("load", function(){',
    '    window.cookieconsent.initialise({',
    '      palette: { popup: { background: "#000" }, button: { background: "#f1d600" } }',
    '    })',
    '  });',
    '</script>',
  ];
};

exports.analyticsHeading = exports.makeAnalyticsHeading().join('\n');

exports.renderHtmlFrame = function (body, head) {
  return (
    htmlHeading.join('') +
    (head || '') +
    "</head><body><div id='fb-root'></div>" +
    body +
    '</body></html>'
  );
};

exports.renderWhydFrame = function (html, params) {
  params = params || {};
  params.css = params.css || [];
  params.js = params.js || [];

  if (!params.nocss) params.css.unshift('common.css');

  if (params.request && !params.pageUrl) params.pageUrl = params.request.url;

  if (params.pageUrl && params.pageUrl.indexOf('/') == 0)
    params.pageUrl = config.urlPrefix + params.pageUrl;

  params.head = params.head || makeMetaHead(params);

  // prevent search engines from indexing user profiles
  if (params.bodyClass?.includes('userProfileV2')) {
    params.head.push('<meta name="robots" content="noindex">');
  }

  let out = htmlHeading
    .concat(params.head || [])
    .concat([
      /* invalid html5 meta => replaced by Cache-Control HTTP header:
		'    <meta http-equiv="CACHE-CONTROL" content="NO-CACHE" />',
		'    <meta http-equiv="Pragma" content="no-cache" />',
		'    <meta http-equiv="expires" content="0" />',
		*/
      //	'    <meta name="ROBOTS" content="NONE" />',
      '    <link href="' +
        render.urlPrefix +
        '/favicon.ico" rel="shortcut icon" type="image/x-icon" />',
      '    <link href="' +
        render.urlPrefix +
        '/favicon.png" rel="icon" type="image/png" />',
      "    <link href='//fonts.googleapis.com/css?family=Varela+Round' rel='stylesheet' type='text/css'>",
      "    <link href='//fonts.googleapis.com/css?family=Varela' rel='stylesheet' type='text/css'>",
      '    <link rel="search" type="application/opensearchdescription+xml" title="Whyd" href="' +
        config.urlPrefix +
        '/html/opensearch.xml">', // http://www.gravitywell.co.uk/blog/post/allow-google-chrome-and-other-browsers-to-search-your-site-directly-from-the-address-bar
      '    <link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/foohaghobcolamikniehcnnijdjehfjk">', // https://developers.google.com/chrome/web-store/docs/inline_installation?hl=fr
    ])
    .concat(exports.makeAnalyticsHeading(params.loggedUser));

  if (params.title)
    out.push(
      '    <title>' + uiSnippets.htmlEntities(params.title) + '</title>',
    );

  for (const i in params.css)
    out.push(
      '    <link href="' +
        render.urlPrefix +
        '/css/' +
        params.css[i] +
        includeSuffix +
        '" rel="stylesheet" type="text/css" />',
    );

  out.push(
    '    <script src="/js/jquery-1.10.2.min.js"></script>',
    '    <script src="/js/jquery-migrate-1.2.1.js"></script>',
    '    <script src="/js/soundmanager2-nodebug-jsmin.js"></script>',
    '    <script>soundManager.setup({url: "/swf/", flashVersion: 9, onready: function() {soundManager.isReady=true;}});</script>',
  );

  const jsIncludes = [];
  for (const i in params.js) {
    const src =
      params.js[i].indexOf('//') > -1
        ? params.js[i]
        : render.urlPrefix + '/js/' + params.js[i] + includeSuffix;
    jsIncludes.push(
      '    <script src="' +
        src +
        '" type="text/javascript" charset="utf-8"></script>',
    );
  }

  if (!params.loggedUser || !params.loggedUser.id)
    params.bodyClass = (params.bodyClass || '') + ' visitor';

  const YOUTUBE_API_KEY = isProduction
    ? 'AIzaSyBAJTMmfL1dcLWil8l-rAQgpENVQ_bZ54Q' // associated to google project "openwhyd-2", see https://github.com/openwhyd/openwhyd/issues/262
    : 'AIzaSyBzqb519R--gKZ9cXgbqE5bMM85yNTXJfo'; // associated to google project "openwhyd-dev"

  out = out.concat([
    '  </head>',
    '  <body class="' + (params.bodyClass || '') + '">',
    '   <div id="fb-root"></div>',
    html,
    '<script>', // for all openwhyd pages, including playlist embed

    'var DEEZER_APP_ID = 190482;',
    'var DEEZER_CHANNEL_URL = window.location.href.substr(0, window.location.href.indexOf("/", 10)) + "/html/channel.html";',
    'var YOUTUBE_API_KEY = "' + YOUTUBE_API_KEY + '";',
    'var JAMENDO_CLIENT_ID = "2c9a11b9";',
    '</script>',
    // TODO: move credentials to makeAnalyticsHeading()
    jsIncludes.join('\n'),
    '  </body>',
    '</html>',
  ]);

  return out.join('\n');
};
exports.renderHeader = function (user, content, params) {
  const uid = user ? user.id : null;
  content =
    content ||
    [
      '  <div id="headCenter">',
      '   <a id="logo" title="Openwhyd" target="_top" class="homeLink" href="/">',
      // '     <img id="logo" src="'+render.urlPrefix+'/images/logo-s.png" />',
      '   </a>',
      uid ? '<div id="notifIcon">0</div><div id="notifPanel"></div>' : '',
      '  </div>',
      '  <div id="navbar">',
      '   <a target="_top" id="tabStream" href="/">Stream</a>',
      '   <a target="_top" id="tabHot" href="/hot">Hot Tracks</a>',
      //		'   <a target="_top" id="tabProfile" href="/u/'+user.id+'">Profile</a>',
      //	'   <a target="_top" id="tabDiscover" href="/discover/users">Discover</a>',
      '  </div>',
      '  <div id="searchBar">',
      '   <div class="searchForm" id="searchForm">', //<form id="searchForm" method="get" action="'+render.urlPrefix+'/search">',
      '    <input name="q" class="q search-input" id="q" type="text" value="' +
        uiSnippets.htmlEntities(params.q) +
        '" placeholder="Paste a YouTube / Soundcloud / Bandcamp / Deezer URL" autocomplete="off" />',
      //	'    <input type="button" id="searchClear" />',
      '   </div>', //</form>',
      '   <div class="searchResults" id="searchResults"></div>',
      '  </div>',
    ].concat(
      uid
        ? [
            '  <div id="navLinks">',

            '   <div id="loginDiv">',
            '    <a href="/u/' + user.id + '" >',
            '     <div class="image" style="background-image:url(' +
              (user.img || '/img/u/' + user.id) +
              ');"></div>',
            '			<strong class="username">' +
              uiSnippets.htmlEntities(user.name) +
              '</strong>',
            //	'      <img src="/img/u/'+user.id+'" />', // /images/icon-userconfig-menu.png
            '    </a>',
            '    <div class="puce">',
            '      <div class="submenu">',
            '        <a href="/u/' + user.id + '/playlists">Playlists</a>', //  class="no-ajaxy"
            '        <a href="/u/' + user.id + '/likes">Likes</a>',
            '      </div>',
            '    </div>',
            '   </div>',

            '   <div id="settingsDiv">',
            '	  <div class="btn"></div> ',
            '     <span class="puce"></span>',
            '	  <div class="submenu">',
            '      <a href="/invite">Invite friends</a>',
            '      <a href="/button">Install "Add Track" button</a>',
            '      <a href="/settings">Settings</a>',
            '      <a href="/logout" class="no-ajaxy">Logout</a>', //javascript:logout()
            '     </div>',
            '   </div>',
            '  </div>',
          ]
        : [
            '  <div id="homeHeader">',
            '   <h1>Openwhyd: The community of music lovers</h1>',
            '	  <p>Discover and collect music gems from Youtube, Soundcloud, Deezer and more</p>',
            '  </div>',
            '  <div id="logBox">',
            '   <a id="signin" href="/login">Login</a>',
            '   <a id="signup" onclick="login();">Sign up</a>',
            '  </div>',
          ],
    );
  return ['<div id="header"><div class="container">']
    .concat(content)
    .concat(['</div></div>'])
    .join('\n');
};

exports.renderWhydPage = function (params = {}) {
  params.title =
    (params.pageTitle ? params.pageTitle + ' - ' : '') +
    'Openwhyd' +
    (params.pageTitle
      ? ''
      : ' – Discover and collect the best music tracks from the web');

  params.js = [
    'jquery.avgrund.js',
    'jquery.tipsy.js', // replaces tooltip.js
    'quickSearch.js',
    //	"md5.js",
    'jquery.iframe-post-form.min.js',
    'jquery.placeholder.min.js',
    'underscore-min.js', // for jquery.mentionsInput.js
    'jquery.elastic.js', // for jquery.mentionsInput.js
    'jquery.mentionsInput.js',
    'ui.js',
    'whyd.js', // topicBrowser.js
    'playem-' + playemFile + '.js',
    'playem-youtube-iframe-patch.js',
    'whydPlayer.js',
    'dndUpload.js',
    'WhydImgUpload.js',
    'facebook.js',
  ].concat(params.js || []);

  params.css = [
    'browse.css',
    'tipsy.css',
    'userProfileV2.css',
    'userPlaylistV2.css',
    'dlgEditProfileCover.css',
  ].concat(params.css || []);

  const user = params.loggedUser || {};
  // console.log('connected user:', user.name, user.id);

  // other recognized params: bodyClass, head, content, sidebar

  const out = [
    //'<div class="topWarning">🚧 We\'re moving! => Openwhyd will be unavailable on Sunday 21th of May.</div>',
    '<!--[if lt IE 8]>',
    '<div class="topWarning">Warning: your web browser is not supported by Openwhyd. Please upgrade to a modern browser.</div>',
    '<![endif]-->',
    //	'<a id="feedbackLink" href="mailto:contact@openwhyd.org?subject=[proto-support]&body=Please%20enter%20your%20feedback%20here">Send feedback</a>',
    exports.renderHeader(user, params.whydHeaderContent, params),
    '<div id="contentPane">',
    '  <div id="mainPanel">',
    params.content || '',
    '  </div>',
    '</div>',
    playerHtmlCode,
    params.footer || exports.footer,
    exports.olark,
    params.endOfBody || '',
  ];

  return this.renderWhydFrame(out.join('\n'), params);
};

// SUPPORTED PARAMETERS
/*
var params = {
	request: request, // => pageUrl => meta og:url element
	loggedUser: loggedUser,
	pageUrl:
	pageType:
	pageDesc:
	pageImage: "<url>", // => og:image meta property
	ogTitle: (og: only)
	whydHeaderContent: ['<div id="headCenter">...</div>'], // contents of #header
	pageTitle: "",
	js: [],
	css: [],
	content: "coucou",
	footer: "",
};
*/

// MINIMAL EXAMPLE OF USE: /admin/testMainTemplate.js
