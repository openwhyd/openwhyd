/**
 * "invite" controller
 * renders signup popin displayed when adding a track
 * @author adrienjoly, whyd
 */

var templateLoader = require('../templates/templateLoader.js');

/**
 * called when user follows an invite URL (/invite/xxx), e.g. provided in an email
 */
exports.renderRegisterPage = function (request, reqParams, response) {
  if (!reqParams) reqParams = {};
  if (reqParams.id) reqParams.inviteCode = reqParams.id; // for compatibility with previous versions of routes.conf

  request.logToConsole('invite.renderRegisterPage', {
    inviteCode: reqParams.inviteCode,
    email: reqParams.email,
    name: reqParams.name,
    error: reqParams.error,
    iBy: reqParams.iBy, // invited by user iBy
    iPo: reqParams.iPo, // from post iPo (legacy)
  });

  // signup pop-in
  if (reqParams.popin) {
    templateLoader.loadTemplate(
      'app/templates/popinSignup.html',
      function (template) {
        var page = template.render(reqParams);
        response.renderHTML(page);
      }
    );
  } else {
    //console.log("inviteCode parameter is required");
    response.redirect('/#signup');
    return false;
  }
};

exports.controller = function (request, reqParams, response, error) {
  request.logToConsole('invite.controller' /*, request.method*/);
  reqParams = reqParams || {};
  exports.renderRegisterPage(request, reqParams, response, error);
};
