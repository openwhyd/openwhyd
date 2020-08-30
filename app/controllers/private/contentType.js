/**
 * contentType controller
 * Extracts the content-type of a http resource
 */
var get = require('../../lib/get');

exports.controller = function (request, reqParams, response) {
  request.logToConsole('contentType.controller', reqParams);

  if (!reqParams) {
    console.log('contentType: no url provided => returning null');
    response.legacyRender(null);
    return;
  }

  function handleError(err) {
    console.log('contentType error:', err);
    response.legacyRender({ error: err });
  }

  function renderResult(contentType, title, images) {
    var result = {
      statusCode: 200,
      contentType: contentType,
      title: title,
      images: images,
    };
    console.log('contentType result:', result);
    response.legacyRender(result);
  }

  var url = reqParams.url;

  if (url.indexOf('openwhyd.org') > -1 || url.indexOf('localhost:') > -1) {
    if (
      url.includes('/upload_data/') ||
      url.includes('/uPostedImg/') ||
      url.includes('/uAvatarImg/') ||
      url.includes('/ugTopicImg/')
    )
      return renderResult('image/unknown');
  }

  try {
    get.ContentType(url, function (err, contentType) {
      if (contentType === 'text/html')
        get(url, function (err, page) {
          if (page && !err)
            renderResult(contentType, page.getTitle(), page.getImages());
          else handleError(err);
        });
      else if (contentType && contentType != 'noContentType')
        renderResult(contentType);
      else handleError(err);
    });
  } catch (err) {
    handleError(err);
  }
};
