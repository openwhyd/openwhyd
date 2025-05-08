// test upload

function renderTemplate() {
  return [
    '<html>',
    '<head>',
    '<script type="text/javascript" src="/js/jquery-1.10.2.min.js"></script>',
    '<script type="text/javascript" src="/js/jquery.iframe-post-form.min.js"></script>',
    '<script type="text/javascript"><!--',
    '$(function ()',
    "{ console.log('script');",
    "    $('form').iframePostForm",
    '    ({',
    '        post : function ()',
    '        {',
    "            var msg = !$('input[type=file]').val().length ? 'Submitting form...' : 'Uploading file...';",
    '            console.log(msg);',
    '        },',
    '        complete : function (res)',
    '        {',
    "            var data = res.substring(res.indexOf('{'), res.lastIndexOf('}')+1);",
    "            console.log('received', data);",
    "            console.log('received', JSON.parse(data));",
    '        }',
    '    });',
    '});',
    '//--></script>',
    '</head>',
    '<body>',
    '<form action="/upload" method="post" enctype="multipart/form-data">',
    '<input type="file" name="one" id="one" />',
    //'<input type="file" name="two" id="two" />',
    '<li><input type="submit" value="Submit" /></li>',
    '</form>',
    '</body></html>',
  ].join('\n');
}

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('testUpload.controller', reqParams);
  const user = await request.checkLogin(response);
  if (!user) return;
  response.legacyRender(renderTemplate(), null, {
    'content-type': 'text/html',
  });
};
