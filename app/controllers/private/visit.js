/**
 * visit controller
 * logs external visits to openwhyd pages, e.g. to wrap links in email digest
 * @author adrienjoly, whyd
 */

var analytics = require('../../models/analytics');
var querystring = require('querystring');

exports.wrapLink = function (tId, uId, orig, urlPrefix) {
  var params = { tId: tId, uId: uId.replace('/u/', '') };
  if (orig) params.orig = orig;
  return (urlPrefix || '') + '/visit' + '?' + querystring.stringify(params);
};

exports.handleRequest = function (request, params, response) {
  if (params) analytics.addVisit(params.uId, params.tId, params.orig);
  else console.log('warning: missing visit parameters');

  response.redirect('' + params.tId);
};

exports.controller = function (request, getParams, response) {
  request.logToConsole('visit.controller', request.method);

  if (request.method.toLowerCase() === 'post') {
    //var form = new formidable.IncomingForm();
    //form.parse(request, function(err, postParams) {
    exports.handleRequest(request, request.body /*postParams*/, response);
    //});
  } else exports.handleRequest(request, getParams, response);
};
