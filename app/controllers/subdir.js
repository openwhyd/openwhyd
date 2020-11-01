/**
 * subdir controller
 * maps to another controller, based on the path
 * @author adrienjoly, whyd
 */

exports.controller = function (request, reqParams, response) {
  //request.logToConsole("[subdir]", reqParams);

  var path = request.url.split('?')[0];
  //console.log("branching to " + path);
  var splitted = path.split('/');
  var subDir = splitted[1];
  var ctrName = splitted[2];
  //console.log("=> branching to /" + subDir + "/" + ctrName);

  try {
    const safeCtrPath = `./${subDir}/${ctrName}`.replace(/\.\./g, '');
    const { controller } = require(safeCtrPath);
    controller(request, reqParams, response);
  } catch (err) {
    console.error('[subdir] error while contacting ' + request.url, err);
    response.notFound();
  }
};
