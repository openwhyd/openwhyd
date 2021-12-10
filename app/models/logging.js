var http = require('http');
var querystring = require('querystring');
var errorTemplate = require('../templates/error.js');
const snip = require('../snip.js');

const genReqLogLine = ({ head, method, path, params, suffix }) =>
  !process.appParams.color
    ? [
        head,
        method,
        path[0] + (path.length > 1 ? '?' + path.slice(1).join('?') : ''),
        suffix,
        params,
      ]
    : [
        head.grey,
        method.cyan,
        path[0].green +
          (path.length > 1 ? '?' + path.slice(1).join('?') : '').yellow,
        suffix.white,
        params.grey,
      ];

http.IncomingMessage.prototype.logToConsole = function (suffix, params) {
  console.log(
    ...genReqLogLine({
      head: '▶ ' + new Date().toISOString(),
      method: this.method,
      path: this.url.split('?'),
      params:
        typeof params === 'object'
          ? JSON.stringify(snip.formatPrivateFields(params))
          : '',
      suffix: suffix ? '(' + suffix + ')' : '',
    })
  );
};

var config = require('./config.js');
var mongodb = require('./mongodb.js');
var loggingTemplate = require('../templates/logging.js');
var renderUnauthorizedPage = loggingTemplate.renderUnauthorizedPage;

// ========= USER AGENT STUFF

/**
 * Gets the http referer of a request
 */
http.IncomingMessage.prototype.getReferer = function () {
  return this.headers['referrer'] || this.headers['referer'];
};

// ========= COOKIE STUFF

/**
 * Generates a user session cookie string
 * that can be supplied to a Set-Cookie HTTP header.
 */
/*
exports.makeCookie = function(user) {
	var date = new Date((new Date()).getTime() + 1000 * 60 * 60 * 24 * 365);
	return 'whydUid="'+(user.id || '')+'"; Expires=' + date.toGMTString();
};
*/

/**
 * Transforms cookies found in the request into an object
 */
http.IncomingMessage.prototype.getCookies = (function () {
  //var cookieReg = /([^=\s]+)="([^"]*)"/;
  return function () {
    //console.log("cookies raw:", this.headers.cookie);
    if (!this.headers.cookie) return null;
    var cookiesArray = this.headers.cookie.split(';');
    //console.log("cookies array:", cookiesArray);
    var cookies = {};
    for (let i = 0; i < cookiesArray.length; i++) {
      //var match = cookiesArray[i].trim().match(cookieReg);
      //if (match)
      cookiesArray[i] = cookiesArray[i].trim();
      var separ = cookiesArray[i].indexOf('=');
      if (separ > 0)
        cookies[cookiesArray[i].substr(0, separ)] = cookiesArray[i].substring(
          separ + 1
        );
    }
    //console.log("cookies object:", cookies);
    return cookies;
  };
})();

/**
 * Return facebook's "fbs_" cookie object from the request
 */
http.IncomingMessage.prototype.getFacebookCookie = function () {
  var cookies = this.getCookies();
  //console.log("cookies:", cookies);
  for (let i in cookies)
    if (i.startsWith('fbs_')) {
      const cookie = {},
        cookieArray = cookies[i].split('&');
      for (let j in cookieArray) {
        var cookieItem = cookieArray[j].split('=');
        cookie[cookieItem[0]] = cookieItem[1];
      }
      console.log('found facebook cookie'); //, cookie);
      return cookie;
    } else if (i.startsWith('fbsr_')) {
      // https://developers.facebook.com/docs/authentication/signed_request/
      try {
        let cookie = cookies[i].split('.')[1];
        cookie = Buffer.from(cookie /*|| ""*/, 'base64').toString('ascii');
        cookie = JSON.parse(cookie);
        console.log('found secure facebook cookie'); //, cookie);
        return cookie;
      } catch (e) {
        console.log('secure facebook connect error: ', e);
      }
    }
  return null;
};

// ========= USER ACCESSORS

/**
 * Returns the logged in user's facebook uid, from its cookie
 */
http.IncomingMessage.prototype.getFbUid = function () {
  var fbCookie = this.getFacebookCookie();
  if (fbCookie && fbCookie.uid)
    this.getFbUid = function () {
      return fbCookie.uid;
    };
  else if (fbCookie && fbCookie.user_id)
    this.getFbUid = function () {
      return fbCookie.user_id;
    };
  else return null;
  return this.getFbUid();
};

/**
 * Returns the logged in user's uid, from its openwhyd session cookie
 */
http.IncomingMessage.prototype.getUid = function () {
  /*
	var uid = (this.getCookies() || {})["whydUid"];
	if (uid) uid = uid.replace(/\"/g, "");
	//if (uid) console.log("found openwhyd session cookie", uid);
	return uid;
	*/
  return (this.session || {}).whydUid;
};

/**
 * Returns the logged in user as an object {_id, id, fbId, name, img}
 */
http.IncomingMessage.prototype.getUser = function () {
  var uid = this.getUid();
  if (uid) {
    var user = mongodb.usernames[uid];
    if (user) user.id = '' + user._id;
    return user;
  } else return null;
};

//http.IncomingMessage.prototype.getUserFromFbUid = mongodb.getUserFromFbUid;

http.IncomingMessage.prototype.getUserFromId = mongodb.getUserFromId;

http.IncomingMessage.prototype.getUserNameFromId = mongodb.getUserNameFromId;

// ========= LOGIN/SESSION/PRIVILEGES STUFF

/**
 * Checks that a registered user is logged in, and return that user, or show an error page
 */
http.IncomingMessage.prototype.checkLogin = function (response, format) {
  var user = this.getUser();
  //console.log("checkLogin, cached record for logged in user: ", user);
  if (!user /*|| !user.name*/) {
    if (response) {
      if (format && format.toLowerCase() == 'json')
        errorTemplate.renderErrorResponse(
          { errorCode: 'REQ_LOGIN' },
          response,
          'json'
        );
      else response.renderHTML(renderUnauthorizedPage());
    }
    return false;
  }
  return user;
};

http.IncomingMessage.prototype.isUserAdmin = exports.isUserAdmin = function (
  user
) {
  return user.email && config.adminEmails[user.email];
};

http.IncomingMessage.prototype.isAdmin = function () {
  return this.isUserAdmin(this.getUser());
};

http.IncomingMessage.prototype.checkAdmin = function (response, format) {
  var user = this.checkLogin(response, format);
  if (!user) return false;
  else if (!exports.isUserAdmin(user)) {
    console.log(
      'access restricted, user is not an admin: ',
      user._id || user.id
    );
    response && response.legacyRender('nice try! ;-)');
    return false;
  }
  return user;
};

// ========= HTTP RESPONSE SNIPPETS

http.ServerResponse.prototype.renderHTML = function (html, statusCode) {
  return this.legacyRender(
    html,
    null,
    { 'content-type': 'text/html; charset=utf-8' },
    statusCode
  );
};

http.ServerResponse.prototype.renderJSON = function (json, statusCode) {
  return this.legacyRender(
    json,
    null,
    { 'content-type': 'application/json; charset=utf-8' },
    statusCode
  );
};

http.ServerResponse.prototype.renderWrappedJSON = function (json, statusCode) {
  this.renderHTML(
    '<!DOCTYPE html><html><body><textarea>' +
      JSON.stringify(json) +
      '</textarea></body></html>',
    statusCode
  );
};

http.ServerResponse.prototype.renderText = function (json, statusCode) {
  return this.legacyRender(
    json,
    null,
    { 'content-type': 'text/text; charset=utf-8' },
    statusCode
  );
};

// TODO: this function is overrided by Express => delete it to prevent ambiguity
http.ServerResponse.prototype.redirect = function (url) {
  return this.renderHTML(loggingTemplate.htmlRedirect(url));
};

http.ServerResponse.prototype.safeRedirect = function (url) {
  const fullURL = new URL(url, config.urlPrefix);
  if (`${fullURL.protocol}//${fullURL.host}` !== config.urlPrefix)
    return this.forbidden();
  this.redirect(url);
};

http.ServerResponse.prototype.redirectWithTracking = function (url, title) {
  return this.renderHTML(
    loggingTemplate.renderRedirectPageWithTracking(url, title)
  );
};

http.ServerResponse.prototype.renderIframe = function (url, metaOverrides) {
  return this.renderHTML(loggingTemplate.renderIframe(url, metaOverrides));
};

http.ServerResponse.prototype.temporaryRedirect = function (_url, _reqParams) {
  let url = '' + _url;
  if (_reqParams /*request.method.toLowerCase() == "get"*/) {
    const reqParams = querystring.stringify(_reqParams);
    if (reqParams.length) url += '?' + reqParams;
  }
  this.redirect(307, url); // see https://expressjs.com/fr/4x/api.html#res.redirect
};

http.ServerResponse.prototype.badRequest = function (error) {
  this.status(400).send(error ? '' + error : 'BAD REQUEST');
};

http.ServerResponse.prototype.forbidden = function (error) {
  this.status(403).send(error ? '' + error : 'FORBIDDEN');
};

http.ServerResponse.prototype.notFound = function () {
  this.status(404).send();
};
