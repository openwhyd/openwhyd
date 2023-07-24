/**
 * getResourceMetadata controller
 * Extracts image(s) and textual content from a URL
 */
var userModel = require('../../models/user');

exports.handleRequest = function (request, reqParams, response) {
  request.logToConsole('getResourceMetadata.controller', reqParams);

  if (!reqParams || !reqParams.url) {
    console.log('contentType: no url provided => returning null');
    response.badRequest();
    return;
  }

  try {
    var url = reqParams.url;
    if (url)
      url = url
        .replace('http://openwhyd.org', '')
        .replace('https://openwhyd.org', '');

    if (url.startsWith('/u/')) {
      userModel.fetchByUid(url.substr(3), function (user) {
        response.legacyRender(
          !user
            ? { error: 'not found' }
            : {
                id: user._id,
                mid: user.mid,
                name: user.name,
                img: user.img,
                desc: user.bio,
                key: user.handle,
                url: url,
              },
        );
      });
    } else if (url.startsWith('/user/')) {
      userModel.fetchByHandle(url.substr(6), function (user) {
        response.legacyRender(
          !user
            ? { error: 'not found' }
            : {
                id: user._id,
                mid: user.mid,
                name: user.name,
                img: user.img,
                desc: user.bio,
                key: user.handle,
                url: url,
              },
        );
      });
    }
    // TODO: public post page, conversation page
  } catch (e) {
    console.log('getResourceMetadata error:', e);
    response.legacyRender(null);
  }
};

exports.controller = function (request, getParams, response) {
  request.logToConsole('getResourceMetadata.controller', request.method);

  // make sure a registered user is logged, or return an error page
  if (!request.checkLogin(response)) return;

  if (request.method.toLowerCase() === 'post')
    // sent by (new) register form
    exports.handleRequest(request, request.body /*postParams*/, response);
  else exports.handleRequest(request, getParams, response);
};
