/**
 * page template to invite people from facebook / email
 * @author adrienjoly, whyd
 **/

const snip = require('../snip.js');
const mainTemplate = require('../templates/mainTemplate.js');
const notifTemplate = require('../templates/notif.js');
const templateLoader = require('../templates/templateLoader.js');
let template = null;

exports.refreshTemplates = function (callback) {
  template = templateLoader.loadTemplate(
    'app/templates/inviteForm.html',
    callback,
  );
};

exports.refreshTemplates();

const MSG_HTML = '<span>[[ your personal message here ]]</span>';
const MSG_TOKEN = '[[MSG]]';

exports.renderInviteForm = function (params = {}) {
  params.fields = [{ n: 1 }, { n: 2 }]; //var NB_INVITES = 3;
  params.pageTitle = 'Invite your friends!';
  params.inviteCode = 'XXXXXXXXXXXXXX';
  params.emailTemplate = notifTemplate.generateInviteBy(
    params.loggedUser.name,
    params.inviteCode,
    MSG_TOKEN,
  );
  params.emailSubject = params.emailTemplate
    ? params.emailTemplate.subject
    : '(none)';
  params.emailTemplate = (params.emailTemplate || {}).bodyText || '';
  params.emailTemplate = snip
    .htmlEntities(params.emailTemplate)
    .replace(/\n\n/g, '<p>')
    .replace(MSG_TOKEN, MSG_HTML);
  return template.render(params);
};

exports.renderInviteFormPage = function (params) {
  params.content = exports.renderInviteForm(params);
  return mainTemplate.renderWhydPage(params);
};
