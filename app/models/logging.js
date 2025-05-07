const http = require('http');
const querystring = require('querystring');
const errorTemplate = require('../templates/error.js');
const snip = require('../snip.js');
const auth0 = require('../lib/auth0');

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
    }),
  );
};

const config = require('./config.js');
const mongodb = require('./mongodb.js');
const loggingTemplate = require('../templates/logging.js');
const renderUnauthorizedPage = loggingTemplate.renderUnauthorizedPage;

// ========= USER AGENT STUFF

/**
 * Gets the http referer of a request
 */
http.IncomingMessage.prototype.getReferer = function () {
  return this.headers['referrer'] || this.headers['referer'];
};

// ========= COOKIE STUFF

/**
 * Transforms cookies found in the request into an object
 */
http.IncomingMessage.prototype.getCookies = (function () {
  //var cookieReg = /([^=\s]+)="([^"]*)"/;
  return function () {
    //console.log("cookies raw:", this.headers.cookie);
    if (!this.headers.cookie) return null;
    const cookiesArray = this.headers.cookie.split(';');
    //console.log("cookies array:", cookiesArray);
    const cookies = {};
    for (let i = 0; i < cookiesArray.length; i++) {
      //var match = cookiesArray[i].trim().match(cookieReg);
      //if (match)
      cookiesArray[i] = cookiesArray[i].trim();
      const separ = cookiesArray[i].indexOf('=');
      if (separ > 0)
        cookies[cookiesArray[i].substr(0, separ)] = cookiesArray[i].substring(
          separ + 1,
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
  const cookies = this.getCookies();
  //console.log("cookies:", cookies);
  for (const i in cookies)
    if (i.startsWith('fbs_')) {
      const cookie = {},
        cookieArray = cookies[i].split('&');
      for (const j in cookieArray) {
        const cookieItem = cookieArray[j].split('=');
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
        console.trace('secure facebook connect error: ', e);
      }
    }
  return null;
};

// ========= USER ACCESSORS

/**
 * Returns the logged in user's facebook uid, from its cookie
 */
http.IncomingMessage.prototype.getFbUid = function () {
  const fbCookie = this.getFacebookCookie();
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

const { useAuth0AsIdentityProvider } = process.appParams;

/**
 * Returns the logged in user's uid
 */
http.IncomingMessage.prototype.getUid = useAuth0AsIdentityProvider
  ? function () {
      const userId = auth0.getAuthenticatedUserId(this);
      this.session = this.session || {};
      this.session.whydUid = userId;
      return userId;
    }
  : function () {
      return (this.session || {}).whydUid;
    };

/**
 * Returns the logged in user as an object {_id, id, fbId, name, img}
 * @deprecated because it relies on a database call, call fetchByUid() instead.
 */
http.IncomingMessage.prototype.getUser = async function () {
  const uid = this.getUid();
  if (!uid) return null;
  const userModel = require('./user.js');
  const user = await userModel.fetchAndProcessUserById(uid);
  if (!user) console.trace(`logged user ${uid} not found in database`);
  else user.id = '' + user._id;
  return user ?? null;
};

//http.IncomingMessage.prototype.getUserFromFbUid = mongodb.getUserFromFbUid;

/** @deprecated because it relies on a in-memory cache of users, call fetchByUid() instead. */
http.IncomingMessage.prototype.getUserFromId = mongodb.getUserFromId;

/** @deprecated because it relies on a in-memory cache of users, call fetchByUid() instead. */
http.IncomingMessage.prototype.getUserNameFromId = mongodb.getUserNameFromId;

// ========= LOGIN/SESSION/PRIVILEGES STUFF

/**
 * Checks that a registered user is logged in, and return that user, or show an error page
 */
http.IncomingMessage.prototype.checkLogin = function (response, format) {
  const user = this.getUser();
  //console.log("checkLogin, cached record for logged in user: ", user);
  if (!user /*|| !user.name*/) {
    if (response) {
      if (format && format.toLowerCase() == 'json')
        errorTemplate.renderErrorResponse(
          { errorCode: 'REQ_LOGIN' },
          response,
          'json',
        );
      else response.renderHTML(renderUnauthorizedPage());
    }
    return false;
  }
  return user;
};

http.IncomingMessage.prototype.isUserAdmin = exports.isUserAdmin = function (
  user,
) {
  return user.email && config.adminEmails[user.email];
};

http.IncomingMessage.prototype.isAdmin = function () {
  return this.isUserAdmin(this.getUser());
};

http.IncomingMessage.prototype.checkAdmin = function (response, format) {
  const user = this.checkLogin(response, format);
  if (!user) return false;
  else if (!exports.isUserAdmin(user)) {
    console.log(
      'access restricted, user is not an admin: ',
      user._id || user.id,
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
    statusCode,
  );
};

http.ServerResponse.prototype.renderJSON = function (json, statusCode) {
  return this.legacyRender(
    json,
    null,
    { 'content-type': 'application/json; charset=utf-8' },
    statusCode,
  );
};

http.ServerResponse.prototype.renderWrappedJSON = function (json, statusCode) {
  this.renderHTML(
    '<!DOCTYPE html><html><body><textarea>' +
      JSON.stringify(json) +
      '</textarea></body></html>',
    statusCode,
  );
};

http.ServerResponse.prototype.renderText = function (json, statusCode) {
  return this.legacyRender(
    json,
    null,
    { 'content-type': 'text/text; charset=utf-8' },
    statusCode,
  );
};

// TODO: this function is overrided by Express => delete it to prevent ambiguity
http.ServerResponse.prototype.redirect = function (url) {
  return this.renderHTML(loggingTemplate.htmlRedirect(url));
};

http.ServerResponse.prototype.safeRedirect = function (url) {
  const safeURL = snip.getSafeOpenwhydURL(url, config.urlPrefix);
  if (safeURL === false) return this.forbidden();
  this.redirect(url);
};

http.ServerResponse.prototype.redirectWithTracking = function (url, title) {
  return this.renderHTML(
    loggingTemplate.renderRedirectPageWithTracking(url, title),
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
  this.status(400).send(
    (typeof error === 'object' ? JSON.stringify(error) : error) ??
      'BAD REQUEST',
  );
};

http.ServerResponse.prototype.forbidden = function (error) {
  this.status(403).send(error ? '' + error : 'FORBIDDEN');
};

http.ServerResponse.prototype.notFound = function () {
  this.status(404).send();
};
