exports.buildController = function (params = {}) {
  return async function (request, reqParams, response) {
    request.logToConsole(params.controllerName + '.controller', reqParams);

    // make sure an admin is logged, or return an error page
    reqParams.loggedUser = await request.getUser();
    if (params.adminOnly && !(await request.checkAdmin(response))) return;

    function render(res) {
      if (!res) response.badRequest();
      else if (res.tsv)
        response.legacyRender(res.tsv, null, { 'content-type': 'text/tsv' });
      else if (res.csv)
        response.legacyRender(res.csv, null, { 'content-type': 'text/csv' });
      else if (res.html) response.renderHTML(res.html);
      else response.legacyRender(res);
    }

    const processor = params.fileGenerators[reqParams.action];

    if (processor) {
      console.log('generating ' + reqParams.action + '...');
      processor(reqParams, render);
    } else
      render({
        html: [
          '<h1>invalid action</h1>',
          '<h2>available filenames:</h2>',
          '<ul><li>',
          Object.keys(params.fileGenerators).join('</li><li>'),
          '</li></ul>',
        ].join('\n'),
      });
  };
};
