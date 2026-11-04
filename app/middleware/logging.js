//@ts-check

const snip = require('../snip.js');

/**
 * Generates request log line components
 * @param {{ head: string, method: string, path: string[], params: string, suffix: string }} options
 * @returns {string[]}
 */
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

/**
 * Log request to console
 * @param {import('http').IncomingMessage} request
 * @param {string} [suffix]
 * @param {Record<string, unknown>} [params]
 */
function logToConsole(request, suffix, params) {
  console.log(
    ...genReqLogLine({
      head: '▶ ' + new Date().toISOString(),
      method: request.method || 'GET',
      path: (request.url || '').split('?'),
      params:
        typeof params === 'object'
          ? JSON.stringify(snip.formatPrivateFields(params))
          : '',
      suffix: suffix ? '(' + suffix + ')' : '',
    }),
  );
}

/**
 * Gets the http referer of a request
 * @param {import('http').IncomingMessage} request
 * @returns {string | undefined}
 */
function getReferer(request) {
  const referer = request.headers['referrer'] || request.headers['referer'];
  return Array.isArray(referer) ? referer[0] : referer;
}

/**
 * Transforms cookies found in the request into an object
 * @param {import('http').IncomingMessage} request
 * @returns {Record<string, string> | null}
 */
function getCookies(request) {
  if (!request.headers.cookie) return null;
  const cookiesArray = request.headers.cookie.split(';');
  /** @type {Record<string, string>} */
  const cookies = {};
  for (let i = 0; i < cookiesArray.length; i++) {
    cookiesArray[i] = cookiesArray[i].trim();
    const separ = cookiesArray[i].indexOf('=');
    if (separ > 0)
      cookies[cookiesArray[i].substring(0, separ)] = cookiesArray[i].substring(
        separ + 1,
      );
  }
  return cookies;
}

/**
 * Return facebook's "fbs_" cookie object from the request
 * @param {import('http').IncomingMessage} request
 * @returns {Record<string, unknown> | null}
 */
function getFacebookCookie(request) {
  const cookies = getCookies(request);
  if (!cookies) return null;

  for (const i in cookies) {
    if (i.startsWith('fbs_')) {
      /** @type {Record<string, unknown>} */
      const cookie = {};
      const cookieArray = cookies[i].split('&');
      for (const j in cookieArray) {
        const cookieItem = cookieArray[j].split('=');
        cookie[cookieItem[0]] = cookieItem[1];
      }
      console.log('found facebook cookie');
      return cookie;
    } else if (i.startsWith('fbsr_')) {
      // https://developers.facebook.com/docs/authentication/signed_request/
      try {
        let cookie = cookies[i].split('.')[1];
        cookie = Buffer.from(cookie, 'base64').toString('ascii');
        const parsedCookie = JSON.parse(cookie);
        console.log('found secure facebook cookie');
        return parsedCookie;
      } catch (e) {
        console.trace('secure facebook connect error: ', e);
      }
    }
  }
  return null;
}

/**
 * Middleware that adds logging methods to request object
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {() => void} next
 */
function loggingMiddleware(req, res, next) {
  // Add logging methods to request object
  req.logToConsole = (suffix, params) => logToConsole(req, suffix, params);
  req.getReferer = () => getReferer(req);
  req.getCookies = () => getCookies(req);
  req.getFacebookCookie = () => getFacebookCookie(req);

  next();
}

module.exports = {
  loggingMiddleware,
  logToConsole,
  getReferer,
  getCookies,
  getFacebookCookie,
};
