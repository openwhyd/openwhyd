/**
 * searchHypeMachine controller
 * @author adrienjoly, whyd
 **/

//var mainTemplate = require("../../templates/mainTemplate");
//var render = require("../../templates/topicRendering");
//var uiSnippets = require("../../templates/uiSnippets");
const hypem = require('../../lib/hypem');

exports.controller = async function (request, reqParams, response) {
  // make sure a registered user is logged, or return an error page
  const loggedInUser = await request.checkLogin(/*response*/);
  if (!loggedInUser) return response.legacyRender({});

  request.logToConsole('searchHypeMachine.controller', reqParams);

  const q = (reqParams || {}).q;

  hypem.search(q, function (err, results) {
    let list = [];
    if (!err && results) {
      if (results.join) list = results;
      else if (typeof results == 'object')
        for (const i in results) list.push(results[i]);
    }
    const result = err ? { error: err } : { q: q, results: list };
    console.log('searchHypeMachine => ', err || list.length);
    response.legacyRender(result);
  });
};
