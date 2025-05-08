exports.buildController = function (params) {
  let logPrefix = params.controllerName + '.controller';
  if (process.appParams.color) logPrefix = logPrefix.yellow;
  return async function (request, reqParams = {}, response) {
    request.logToConsole(logPrefix, reqParams);

    // make sure an admin is logged, or return an error page
    reqParams.loggedUser = await request.getUser();
    if (params.adminOnly && !request.checkAdmin(response)) {
      console.log(logPrefix, 'must be logged as admin');
      return;
    }

    function render(res) {
      if (!res) {
        response.badRequest();
        console.log(logPrefix, '=> bad request');
      } else if (res.tsv) {
        response.legacyRender(res.tsv, null, { 'content-type': 'text/tsv' });
        console.log(logPrefix, '=> returned TSV');
      } else if (res.csv) {
        response.legacyRender(res.csv, null, { 'content-type': 'text/csv' });
        console.log(logPrefix, '=> returned CSV');
      } else if (res.html) {
        response.renderHTML(res.html);
        console.log(logPrefix, '=> returned HTML');
      } else if (res.json) {
        if (request.headers['user-agent']) {
          response.legacyRender(JSON.stringify(res.json, null, 2));
          console.log(logPrefix, '=> returned stringified JSON');
        } else {
          response.renderJSON(res.json);
          console.log(logPrefix, '=> returned JSON');
        }
      } else {
        response.legacyRender(res);
        console.log(logPrefix, '=> returned plain text');
      }
    }

    const processor = params.actions[reqParams.action];

    if (processor) {
      console.log(logPrefix, 'action: ' + reqParams.action + '...');
      processor(reqParams, render);
    } else
      render({
        html: [
          '<h1>invalid action</h1>',
          '<h2>available actions:</h2>',
          '<ul><li>',
          Object.keys(params.actions).join('</li><li>'),
          '</li></ul>',
        ].join('\n'),
      });
  };
};
