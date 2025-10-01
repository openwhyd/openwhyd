/**
 * user logging templates
 * (used by logging model)
 * @author adrienjoly, whyd
 */

const snip = require('../snip.js');
const config = require('../models/config.js');
const mainTemplate = require('../templates/mainTemplate.js');

const templateLoader = require('../templates/templateLoader.js');
let redirectTemplate = null;

exports.refreshTemplates = function (callback) {
  const path = 'app/templates';
  redirectTemplate = templateLoader.loadTemplate(`${path}/redirectPage.html`);
  if (callback) callback();
};

exports.refreshTemplates();

exports.renderLoginPage = function () {
  console.log(`${process.env.WHYD_URL_PREFIX}/login`);
  return exports.htmlRedirect(`${process.env.WHYD_URL_PREFIX}/login`);
};

exports.renderUnauthorizedPage = exports.renderLoginPage;

exports.htmlCloseWindow = function () {
  return [
    '<!DOCTYPE HTML>',
    '<html>',
    '<head><title>whyd is closing this page...</title></head>',
    '<body>You can close this page now :-)<script>window.close();</script></body>',
    '</html>',
  ].join('\n');
};

exports.htmlRedirect = function (url) {
  if (url == 'closeWindow') return exports.htmlCloseWindow();
  const safeUrl = snip.getSafeOpenwhydURL(url, config.urlPrefix);
  if (safeUrl === false)
    return `⚠ Unsafe redirect URL: ${snip.htmlEntities(url)}`;
  return redirectTemplate.render({ url: safeUrl });
};

exports.renderRedirectPageWithTracking = function (url, title) {
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

exports.renderIframe = function (url, metaOverrides) {
  const meta = {
    ...mainTemplate.defaultPageMeta,
    ...metaOverrides,
  };
  return `<!DOCTYPE html>
  <html style="margin:0;height:100%;">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# whydapp: http://ogp.me/ns/fb/whydapp#">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
    <meta property="og:image" content="${meta.img}">
    <meta property="og:description" content="${meta.desc}">
    <meta property="fb:app_id" content="169250156435902">
    <meta property="fb:admins" content="510739408">
    <meta property="og:type" content="website">
    <title>${meta.title || 'Openwhyd'}</title>
    <link href="/favicon.ico" rel="shortcut icon" type="image/x-icon">
    <link href="/favicon.png" rel="icon" type="image/png">
    <link rel="image_src" href="${meta.img}">
    <script src="/js/whydtr.js"></script>
  </head>
  <body style="margin:0;height:100%;">
    <base target="_blank" />
    <iframe src="${url}" width="100%" height="100%" frameBorder="0">
      <!-- and, if browser does not support iframes: -->
      <p>Your browser does not support iframes. Please click on that link:
        <a href="${url}">${meta.title || url}</a>
      </p>
    </iframe>
  </body>
  </html>
  `;
};
