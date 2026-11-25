//@ts-check

const querystring = require('querystring');
const snip = require('../snip.js');
const loggingTemplate = require('../templates/logging.js');

/**
 * Render HTML content
 * @param {import('http').ServerResponse} response
 * @param {string} html
 * @param {number} [statusCode]
 */
function renderHTML(response, html, statusCode) {
  return response.legacyRender(
    html,
    null,
    { 'content-type': 'text/html; charset=utf-8' },
    statusCode,
  );
}

/**
 * Render JSON content
 * @param {import('http').ServerResponse} response
 * @param {unknown} json
 * @param {number} [statusCode]
 */
function renderJSON(response, json, statusCode) {
  return response.legacyRender(
    json,
    null,
    { 'content-type': 'application/json; charset=utf-8' },
    statusCode,
  );
}

/**
 * Render wrapped JSON content
 * @param {import('http').ServerResponse} response
 * @param {unknown} json
 * @param {number} [statusCode]
 */
function renderWrappedJSON(response, json, statusCode) {
  renderHTML(
    response,
    '<!DOCTYPE html><html><body><textarea>' +
      JSON.stringify(json) +
      '</textarea></body></html>',
    statusCode,
  );
}

/**
 * Render text content
 * @param {import('http').ServerResponse} response
 * @param {string} text
 * @param {number} [statusCode]
 */
function renderText(response, text, statusCode) {
  return response.legacyRender(
    text,
    null,
    { 'content-type': 'text/text; charset=utf-8' },
    statusCode,
  );
}

/**
 * Redirect to URL
 * @param {import('http').ServerResponse} response
 * @param {string} url
 */
function redirect(response, url) {
  // Send proper HTTP redirect instead of HTML with JavaScript
  response.writeHead(302, { Location: url });
  response.end();
}

/**
 * Safe redirect (validates URL)
 * @param {import('http').ServerResponse} response
 * @param {string} url
 */
function safeRedirect(response, url) {
  const safeURL = snip.getSafeOpenwhydURL(url, process.appParams.urlPrefix);
  if (safeURL === false) return forbidden(response);

  // If the original URL was relative and safe, keep it relative
  // Otherwise use the full validated URL
  const redirectUrl =
    url.startsWith('/') && safeURL.pathname === url ? url : safeURL.toString();
  redirect(response, redirectUrl);
}

/**
 * Redirect with tracking
 * @param {import('http').ServerResponse} response
 * @param {string} url
 * @param {string} [title]
 */
function redirectWithTracking(response, url, title) {
  return renderHTML(
    response,
    loggingTemplate.renderRedirectPageWithTracking(url, title),
  );
}

/**
 * Render iframe
 * @param {import('http').ServerResponse} response
 * @param {string} url
 * @param {Record<string, unknown>} [metaOverrides]
 */
function renderIframe(response, url, metaOverrides) {
  return renderHTML(response, loggingTemplate.renderIframe(url, metaOverrides));
}

/**
 * Temporary redirect
 * @param {import('http').ServerResponse} response
 * @param {string} _url
 * @param {Record<string, unknown>} [_reqParams]
 */
function temporaryRedirect(response, _url, _reqParams) {
  let url = '' + _url;
  if (_reqParams) {
    // Cast to appropriate type for querystring.stringify
    const reqParams = querystring.stringify(
      /** @type {NodeJS.Dict<string | number | boolean | ReadonlyArray<string> | ReadonlyArray<number> | ReadonlyArray<boolean> | null>} */
      (_reqParams),
    );
    if (reqParams.length) url += '?' + reqParams;
  }
  // Use legacyRender for redirect instead of Express redirect
  response.writeHead(307, { Location: url });
  response.end();
}

/**
 * Bad request response
 * @param {import('http').ServerResponse} response
 * @param {unknown} [error]
 */
function badRequest(response, error) {
  response.writeHead(400, { 'Content-Type': 'text/plain' });
  response.end(
    (typeof error === 'object' ? JSON.stringify(error) : error) ??
      'BAD REQUEST',
  );
}

/**
 * Forbidden response
 * @param {import('http').ServerResponse} response
 * @param {unknown} [error]
 */
function forbidden(response, error) {
  response.writeHead(403, { 'Content-Type': 'text/plain' });
  response.end(error ? '' + error : 'FORBIDDEN');
}

/**
 * Not found response
 * @param {import('http').ServerResponse} response
 */
function notFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.end();
}

/**
 * Middleware that adds response methods to response object
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {() => void} next
 */
function responseMiddleware(req, res, next) {
  // Add response methods to response object
  res.renderHTML = (html, statusCode) => renderHTML(res, html, statusCode);
  res.renderJSON = (json, statusCode) => renderJSON(res, json, statusCode);
  res.renderWrappedJSON = (json, statusCode) =>
    renderWrappedJSON(res, json, statusCode);
  res.renderText = (text, statusCode) => renderText(res, text, statusCode);
  res.redirect = (url) => redirect(res, url);
  res.safeRedirect = (url) => safeRedirect(res, url);
  res.redirectWithTracking = (url, title) =>
    redirectWithTracking(res, url, title);
  res.renderIframe = (url, metaOverrides) =>
    renderIframe(res, url, metaOverrides);
  res.temporaryRedirect = (url, reqParams) =>
    temporaryRedirect(res, url, reqParams);
  res.badRequest = (error) => badRequest(res, error);
  res.forbidden = (error) => forbidden(res, error);
  res.notFound = () => notFound(res);

  next();
}

module.exports = {
  responseMiddleware,
  renderHTML,
  renderJSON,
  renderWrappedJSON,
  renderText,
  redirect,
  safeRedirect,
  redirectWithTracking,
  renderIframe,
  temporaryRedirect,
  badRequest,
  forbidden,
  notFound,
};
