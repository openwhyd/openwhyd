/**
 * emailTemplate => to test HTML templates (dev)
 * @author adrienjoly, whyd
 **/

const templateLoader = require('../../templates/templateLoader.js');

const notifTemplates = require('../../templates/notif.js');

exports.controller = async function (request, reqParams, response) {
  reqParams = reqParams || {};
  request.logToConsole('emailTemplate.controller', reqParams);

  const user = await request.checkAdmin(response);
  if (!user) return;

  const templateFile = reqParams.file;
  try {
    if (!templateFile)
      notifTemplates.generateRegWelcomeAsync(
        user,
        { name: 'coco', id: '7' },
        function (email) {
          response.renderHTML(email.bodyHtml);
        },
      );
    else
      templateLoader.loadTemplate(
        'app/emails/' + templateFile + '.html',
        function (templateHtml) {
          reqParams.urlPrefix = ''; //"http://proto.whyd.com";
          reqParams.userName = user.name;
          const html = templateHtml.render(reqParams);
          console.log('\n' + html /*.replace(/\n/g, " ")*/ + '\n');
          response.legacyRender(html, null, { 'content-type': 'text/html' });
        },
      );
  } catch (e) {
    response.legacyRender(e);
  }
};
