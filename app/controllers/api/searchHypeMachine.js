/**
 * searchHypeMachine controller
 * @author adrienjoly, whyd
 **/

//var mainTemplate = require("../../templates/mainTemplate");
//var render = require("../../templates/topicRendering");
//var uiSnippets = require("../../templates/uiSnippets");
var hypem = require('../../lib/hypem');

exports.controller = function (request, reqParams, response) {
  // make sure a registered user is logged, or return an error page
  var loggedInUser = request.checkLogin(/*response*/);
  if (!loggedInUser) return response.legacyRender({});

  request.logToConsole('searchHypeMachine.controller', reqParams);

  var q = (reqParams || {}).q;

  hypem.search(q, function (err, results) {
    var list = [];
    if (!err && results) {
      if (results.join) list = results;
      else if (typeof results == 'object')
        for (let i in results) list.push(results[i]);
    }
    var result = err ? { error: err } : { q: q, results: list };
    console.log('searchHypeMachine => ', err || list.length);
    response.legacyRender(result);
  });
};
