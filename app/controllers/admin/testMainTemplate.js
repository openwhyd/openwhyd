/**
 * testMainTemplate
 * @author adrienjoly, whyd
 **/

const mainTemplate = require('../../templates/mainTemplate.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('mainTemplate.controller', reqParams);

  const loggedUser = await request.checkAdmin(response);
  if (false == loggedUser) return;

  const html = mainTemplate.renderWhydPage({
    title: 'your title here',
    loggedUser: loggedUser,
    content: '<p>your content here</p>',
  });

  response.renderHTML(html);
};
