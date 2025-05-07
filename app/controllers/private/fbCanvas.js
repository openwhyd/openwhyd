/**
 * fbCanvas
 * controller called by facebook (e.g. when a fb user follows an invite request)
 * @author adrienjoly, whyd
 **/

const mongodb = require('../../models/mongodb');
const userModel = require('../../models/user');
const invitePage = require('../../templates/invitePage.js');

function inviteByRequestId(reqIds, response) {
  let remaining = reqIds.length;

  const checkInvite = async function (reqId) {
    try {
      const invite = await new Promise((resolve, reject) => {
        userModel.fetchInviteByFbRequestId(reqId, (invite) => resolve(invite));
      });
      console.log('found invite:', invite);
      if (invite && invite.fbRequestIds) {
        //return response.redirect("/invite/" + invite._id);
        //return response.redirect("/fbinvite/" + invite.fbRequestIds);
        //var sender = request.getUserFromId(invite.iBy); // TODO: test case when there is no sender
        const sender = await userModel.fetchAndProcessUserById(invite.iBy); // TODO: test case when there is no sender
        const registrationPage = invitePage.renderInvitePage(
          sender,
          null /*request.getUser()*/,
          invite._id,
          null,
          '',
          reqIds,
        );
        response.legacyRender(registrationPage, null, {
          'content-type': 'text/html',
        });
      } else console.log('request id not found: ', reqId);
      if (--remaining == 0) {
        console.log('invitation token not found => redirect to /');
        response.redirect('/');
      }
    } catch (error) {
      console.error('Error in checkInvite:', error);
      if (--remaining == 0) {
        console.log('invitation token not found => redirect to /');
        response.redirect('/');
      }
    }
  };

  for (const i in reqIds) checkInvite(reqIds[i]);
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('fbCanvas.controller', reqParams);

  reqParams = reqParams || { request: '' };

  if (reqParams.request_ids && reqParams.request_ids.length > 0) {
    inviteByRequestId(reqParams.request_ids.split(','), response);
  } else if (reqParams.redirect) {
    /* // NEW REQUESTS 2.0 "EFFICIENT"
	else if (reqParams.request == "request_id" && reqParams.to && reqParams.to.length > 0) {
		inviteByRequestId(reqParams.to, response);
	}
	*/
    console.log('redirect to ' + reqParams.redirect);
    response.redirect(reqParams.redirect);
  } else {
    console.log('invalid request => redirect to /');
    response.redirect('/');
  }
};
