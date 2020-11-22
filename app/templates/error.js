/**
 * template for error pages
 * @author adrienjoly, whyd
 **/

const fs = require('fs');
var snip = require('../snip.js');
var mainTemplate = require('../templates/mainTemplate.js');

const page404Html = fs.readFileSync('public/html/404.html', 'utf8');

const renderPage404 = (params) =>
  mainTemplate.renderWhydPage({
    ...params,
    content: page404Html,
  });

exports.ERRORCODE = {
  401: 'Unauthorized. Please login before accessing this page.',
  404: '404 / not found. There might have been some music here, in the past... Please make sure that this URL is correct.',
  REQ_LOGIN: 'Please login first',
  USER_NOT_FOUND: 'User not found...',
  POST_NOT_FOUND: "Sorry, we can't find this track... maybe was it deleted?",
};

exports.renderErrorMessage = function (errorMessage, loggedUser) {
  var params = {
    loggedUser: loggedUser,
    content:
      "<div class='container'>" +
      snip.htmlEntities(
        errorMessage || 'Unexpected error, please go back and try again later.'
      ) +
      '</div>',
  };
  return mainTemplate.renderWhydPage(params);
};

exports.renderErrorCode = function (errorCode, loggedUser) {
  var err = exports.ERRORCODE[errorCode];
  if (!err) {
    console.error('invalid error code:', errorCode);
  }
  return exports.renderErrorMessage(err, loggedUser);
};

exports.renderErrorResponse = function (
  errorObj,
  response,
  format = 'html',
  loggedUser
) {
  var statusCode =
    errorObj && typeof errorObj.errorCode === 'number' && errorObj.errorCode;
  //var format = (querystring.parse(url.parse(request.url).query) || {}).format || "";
  if (format.toLowerCase() == 'json') {
    errorObj.error = errorObj.error || exports.ERRORCODE[errorObj.errorCode];
    response.renderJSON(errorObj, statusCode);
  } else if (
    errorObj.errorCode == 404 ||
    errorObj.errorCode == 'USER_NOT_FOUND'
  ) {
    response.status(404);
    if (format === 'html') {
      //response.sendFile("public/html/404.html");
      response.renderHTML(
        renderPage404({
          pageTitle: 'Oops...',
          loggedUser: loggedUser,
        }),
        statusCode
      );
      // TODO: response.render('404', { url: req.url });
    } else if (format === 'json') {
      response.send({ error: 'Not found' });
    } else {
      response.type('txt').send('Not found');
    }
  } else if (errorObj.errorCode)
    response.renderHTML(
      exports.renderErrorCode(errorObj.errorCode, loggedUser),
      statusCode
    );
  else
    response.renderHTML(
      exports.renderErrorMessage(errorObj.error, loggedUser),
      statusCode
    );
};
