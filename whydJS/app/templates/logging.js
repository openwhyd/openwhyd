/**
 * user logging templates
 * (used by logging model)
 * @author adrienjoly, whyd
 */

var config = require('../models/config.js')
var users = require('../models/user.js')
var mainTemplate = require('../templates/mainTemplate.js')

var templateLoader = require('../templates/templateLoader.js')
var landingTemplate = null
var loginTemplate = null

exports.refreshTemplates = function (callback) {
  loginTemplate = templateLoader.loadTemplate('app/templates/loginPage.html', callback)
}

exports.refreshTemplates()

var NB_BACKGROUND_IMAGES = 4

exports.renderLandingPage = function (loggedUser, form, callback) {
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
  }

  var whydPageParams = {
    // request: request, // => pageUrl => meta og:url element (useless)
    loggedUser: loggedUser,
    // pageTitle: "OpenWhyd",
    js: [],
    css: [],
    endOfBody: [].join('\n'),
    bodyClass: 'home'
  }

  mainTemplate.renderAsyncWhydPageFromTemplateFile('public/html/landingOpen.html', templateParams, whydPageParams, callback, true)
}

exports.renderLoginPage = function (form) {
  var params = {
    urlPrefix: config.urlPrefix,
    title: 'openwhyd',
    email: '',
    password: '',
    //		landingStream: config.landingStream,
    pageThumb: mainTemplate.defaultPageMeta.img,
    pageDesc: mainTemplate.defaultPageMeta.desc,
    head: mainTemplate.analyticsHeading
  }

  if (form) {
    for (var i in form) // [error, email, password]
    { params[i] = form[i] }
    if (form.error) { params.message = [{text: form.error}] }
  }
  // console.log("login form params:", params);
  return loginTemplate.render(params)
}

exports.renderUnauthorizedPage = exports.renderLoginPage // config.landingStream ? exports.renderLoginPage : exports.renderLandingPage;

exports.htmlCloseWindow = function () {
  return ['<!DOCTYPE HTML>',
    '<html>',
    '<head><title>whyd is closing this page...</title></head>',
    '<body>You can close this page now :-)<script>window.close();</script></body>',
    '</html>'
  ].join('\n')
}

exports.htmlRedirect = function (url) {
  return url == 'closeWindow' ? exports.htmlCloseWindow() : [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">',
    '<html>',
    '<head>',
    '<title>whyd is redirecting...</title>',
    '<meta http-equiv="REFRESH" content="3;url=' + url + '"></HEAD>',
    '<BODY>',
    'You are being redirected to: <a href="' + url + '">' + url + '</a>...',
    '<script>window.location.href="' + url + '";</script>',
    '</BODY>',
    '</HTML>'
  ].join('\n')
}
