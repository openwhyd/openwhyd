/**
 * testMainTemplate
 * @author adrienjoly, whyd
 **/

var mainTemplate = require('../../templates/mainTemplate.js');

exports.controller = function (request, reqParams, response) {
  request.logToConsole('mainTemplate.controller', reqParams);

  var loggedUser = request.checkAdmin(response);
  if (false == loggedUser) return;

  var html = mainTemplate.renderWhydPage({
    title: 'your title here',
    loggedUser: loggedUser,
    content: '<p>your content here</p>',
  });

  response.renderHTML(html);
};
