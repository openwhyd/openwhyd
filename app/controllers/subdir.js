//@ts-check

/**
 * subdir controller
 * maps to another controller, based on the path
 * @author adrienjoly, whyd
 */

exports.controller = function (request, reqParams, response, features) {
  var path = request.url.split('?')[0];
  var splitted = path.split('/');
  var subDir = splitted[1];
  var ctrName = splitted[2];

  try {
    const safeCtrPath = `./${subDir}/${ctrName}`.replace(/\.\./g, '');
    const { controller } = require(safeCtrPath);
    controller(request, reqParams, response, features);
  } catch (err) {
    response.notFound();
  }
};
