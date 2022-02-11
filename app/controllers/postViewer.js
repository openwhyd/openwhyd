/**
 * postViewer controller
 * a page that displays a post publicly
 * @author adrienjoly, whyd
 */

var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var errorTemplate = require('../templates/error.js');
var template = require('../templates/postViewer.js');

exports.controller = function (request, reqParams, response) {
  request.logToConsole('postViewer.controller', reqParams);

  reqParams = reqParams || {};

  function render(p) {
    if (p && p.errorCode) {
      console.log('postViewer error:', p.errorCode, 'on', request.url);
      errorTemplate.renderErrorResponse(
        p,
        response,
        reqParams.format,
        request.getUser()
      );
    } else if (p && p.html) {
      response.renderHTML(p.html);
    } else if (p && p.data) response.renderJSON(p);
    // TODO: or p.data?
    else response.legacyRender(p);
  }

  function renderPost(post, isDynamic) {
    if (!post && !isDynamic) render({ errorCode: 'POST_NOT_FOUND' });
    else
      template.renderPostPage(
        {
          isDynamic: isDynamic,
          post: post,
          format: reqParams.format,
          loggedUser: request.getUser(),
        },
        render
      );
  }

  if (reqParams.eId && reqParams.format != 'json')
    renderPost(
      {
        eId: decodeURIComponent(request.url),
        img: '/images/cover-track.png', // by default => changed by postViewerDynamic.js
      },
      true
    );
  else if (!mongodb.isObjectId(reqParams.id))
    errorTemplate.renderErrorResponse(
      { errorCode: 'POST_NOT_FOUND' },
      response,
      reqParams.format,
      request.getUser()
    );
  else postModel.fetchPostById(reqParams.id || reqParams.pId, renderPost);
};
