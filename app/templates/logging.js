/**
 * user logging templates
 * (used by logging model)
 * @author adrienjoly, whyd
 */

var config = require('../models/config.js');
var users = require('../models/user.js');
var mainTemplate = require('../templates/mainTemplate.js');

var templateLoader = require('../templates/templateLoader.js');
var landingTemplate = null;
var loginTemplate = null;

exports.refreshTemplates = function(callback) {
  loginTemplate = templateLoader.loadTemplate(
    'app/templates/loginPage.html',
    callback
  );
};

exports.refreshTemplates();

var NB_BACKGROUND_IMAGES = 4;

exports.renderLandingPage = function(loggedUser, form, callback) {
  // var params = {
  // 	// pageThumb: mainTemplate.defaultPageMeta.img,
  // 	// pageDesc: mainTemplate.defaultPageMeta.desc,
  // 	// head: mainTemplate.analyticsHeading,
  //
  // 	// for new landing page
  // 	// bgImg: "/images/landingPhoto-"+Math.floor(Math.random()*NB_BACKGROUND_IMAGES)+".jpg",
  //
  // 	// for old landing pages
  // 	email:"",
  // 	password:""
  // };
  // if (form) {
  // 	for (var i in form) // [error, email, password]
  // 		params[i] = form[i];
  // 	if (form.error)
  // 		params.message = [{text:form.error}];
  // }
  // return landingTemplate.render(params);

  var templateParams = {
    urlPrefix: config.urlPrefix,
    loggedUser: loggedUser
  };

  var whydPageParams = {
    //request: request, // => pageUrl => meta og:url element (useless)
    loggedUser: loggedUser,
    //pageTitle: "Openwhyd",
    js: [],
    css: [],
    endOfBody: [].join('\n'),
    bodyClass: 'home'
  };

  mainTemplate.renderAsyncWhydPageFromTemplateFile(
    'public/html/landingOpen.html',
    templateParams,
    whydPageParams,
    callback,
    true
  );
};

exports.renderLoginPage = function(form) {
  var params = {
    urlPrefix: config.urlPrefix,
    title: 'openwhyd',
    email: '',
    password: '',
    //		landingStream: config.landingStream,
    pageThumb: mainTemplate.defaultPageMeta.img,
    pageDesc: mainTemplate.defaultPageMeta.desc,
    head: mainTemplate.analyticsHeading
  };

  if (form) {
    for (var i in form) // [error, email, password]
      params[i] = form[i];
    if (form.error) params.message = [{ text: form.error }];
  }
  //console.log("login form params:", params);
  return loginTemplate.render(params);
};

exports.renderUnauthorizedPage = exports.renderLoginPage; //config.landingStream ? exports.renderLoginPage : exports.renderLandingPage;

exports.htmlCloseWindow = function() {
  return [
    '<!DOCTYPE HTML>',
    '<html>',
    '<head><title>whyd is closing this page...</title></head>',
    '<body>You can close this page now :-)<script>window.close();</script></body>',
    '</html>'
  ].join('\n');
};

exports.htmlRedirect = function(url) {
  return url == 'closeWindow'
    ? exports.htmlCloseWindow()
    : [
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">',
        '<html>',
        '<head>',
        '<title>Openwhyd is redirecting...</title>',
        '<meta http-equiv="REFRESH" content="3;url=' + url + '"></HEAD>',
        '<BODY>',
        'You are being redirected to: <a href="' + url + '">' + url + '</a>...',
        '<script>window.location.href="' + url + '";</script>',
        '</BODY>',
        '</HTML>'
      ].join('\n');
};

exports.renderRedirectPageWithTracking = function(url, title) {
  return `<!DOCTYPE html>
  <html>
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# whydapp: http://ogp.me/ns/fb/whydapp#">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
    <meta property="og:image" content="${mainTemplate.defaultPageMeta.img}">
    <meta property="og:description" content="${
      mainTemplate.defaultPageMeta.desc
    }">
    <meta property="fb:app_id" content="169250156435902">
    <meta property="fb:admins" content="510739408">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${config.urlPrefix}">
    <meta http-equiv="REFRESH" content="3;url=${url}">
    <title>${title || 'Openwhyd'} - redirecting...</title>
    <link href="/favicon.ico" rel="shortcut icon" type="image/x-icon">
    <link href="/favicon.png" rel="icon" type="image/png">
    <link rel="image_src" href="${mainTemplate.defaultPageMeta.img}">
    <script src="/js/whydtr.js"></script>
  </head>
  <body class="pgRedirect">
    <p>Redirecting to <a href="${url}">${title || url}</a>...</p>
    <script>
    setTimeout(function(){ window.location.href = "${url}"; }, 2000);
    </script>
  </body>
  </html>
  `;
};
