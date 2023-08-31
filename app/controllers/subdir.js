//@ts-check

/**
 * subdir controller
 * maps to another controller, based on the path
 * @author adrienjoly, whyd
 */

exports.controller = function (request, reqParams, response, features) {
  const path = request.url.split('?')[0];
  const splitted = path.split('/');
  const subDir = splitted[1];
  const ctrName = splitted[2];

  try {
    const safeCtrPath = `./${subDir}/${ctrName}`.replace(/\.\./g, '');
    const { controller } = require(safeCtrPath);
    controller(request, reqParams, response, features);
  } catch (err) {
    response.notFound();
  }
};
