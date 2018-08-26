/**
 * emailTemplate => to test HTML templates (dev)
 * @author adrienjoly, whyd
 **/

//var mongodb = require('../../models/mongodb');
//var ObjectID = mongodb.ObjectID.createFromHexString;
//var emailModel = require('../../../email');
var templateLoader = require('../../templates/templateLoader.js');

var notifTemplates = require('../../templates/notif.js');

exports.controller = function(request, reqParams, response) {
  request.logToConsole('emailTemplate.controller', reqParams);

  var user = request.checkAdmin(response);
  if (false == user) return;

  var reqParams = reqParams || {};
  var templateFile = reqParams.file;
  try {
    if (!templateFile)
      notifTemplates.generateRegWelcomeAsync(
        user,
        { name: 'coco', id: '7' },
        function(email) {
          response.renderHTML(email.bodyHtml);
        }
      );
    else
      templateLoader.loadTemplate(
        'app/emails/' + templateFile + '.html',
        function(templateHtml) {
          reqParams.urlPrefix = ''; //"http://proto.whyd.com";
          reqParams.userName = user.name;
          var html = templateHtml.render(reqParams);
          console.log('\n' + html /*.replace(/\n/g, " ")*/ + '\n');
          response.render(html, null, { 'content-type': 'text/html' });
        }
      );
  } catch (e) {
    response.render(e);
  }
};
