/**
 * btn controller
 * generates embeddable buttons
 * @author adrienjoly, whyd
 */

var PROFILE_BUTTON_SIZES = {
  48: 32,
  32: 24,
  24: 18,
  16: 12,
};

function genButton(p) {
  var btnSize = PROFILE_BUTTON_SIZES[p.width];
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<style>',
    'body{margin:0;font-family:"Helvetica Neue",Helvetica,Arial,Sans-serif;font-size:12px;white-space:nowrap;}',
    'a{' +
      'display:block;border:1px solid #2F2E2D;border-radius:3px;text-decoration: none;' +
      (btnSize
        ? 'width:' +
          (p.width - 2) +
          'px;height:' +
          (p.width - 2) +
          'px;' +
          "background: #3B3A39 url('/images/whyd_w" +
          btnSize +
          ".png') no-repeat 50% 50%;"
        : "background: #3B3A39 url('/images/whyd_w12.png') no-repeat 5px 50%;") +
      '}',
    'a>div{position:relative;left:22px;border-left:1px solid #555;padding-left:4px;line-height:18px;color:#eee;}',
    '</style>',
    '</head>',
    '<body>',
    '<a href="/u/' +
      p.uId +
      '" target="_blank">' +
      (btnSize ? '' : '<div>Subscribe to me on Openwhyd</div>') +
      '</a>',
    '</body>',
    '</html>',
  ].join('\n');
}

var btnTypes = {
  profile: function (p, cb) {
    if (!p.uId) cb({ error: 'missing uId parameter' });
    else cb({ html: genButton(p) });
  },
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('btn', reqParams);

  if (!reqParams || !reqParams.type || !btnTypes[reqParams.type])
    return response.badRequest();

  function render(d) {
    if (d && d.html) response.renderHTML(d.html);
    else {
      console.log('invalid btn output:', d);
      response.legacyRender(d);
    }
  }

  btnTypes[reqParams.type](reqParams, render);
};
