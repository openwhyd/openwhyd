/**
 * notifEmails model
 * send notification emails
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var emailModel = require('../models/email.js');
var userModel = require('../models/user.js');
var notifTemplate = require('../templates/notif.js');

var SEND_USER_DELETION_EMAILS = false;

// helpers

function getUserPrefs(uId) {
  return (mongodb.usernames['' + uId] || {}).pref || {};
}

function sendEmail(toUid, emailObj, cb) {
  var to = mongodb.usernames['' + toUid];
  if (!to || !emailObj) cb && cb({ error: 'invalid call to sendEmail()' });
  else
    emailModel.email(
      to.email,
      emailObj.subject,
      emailObj.bodyText,
      emailObj.bodyHtml,
      to.name,
      cb,
    );
}

// REGISTRATION RELATED

// 2) when a openwhyd admin accepted a visitor to register => "The team is glad to invite you to join whyd"
exports.sendAcceptedInvite = function (storedUser) {
  var temp = notifTemplate.generateAcceptedInvite(storedUser);
  emailModel.email(
    storedUser.email,
    temp.subject,
    temp.bodyText,
    temp.bodyHtml,
  );
};

// 3) when a user just finished registration => "Here are some tips to get started"
exports.sendRegWelcome = function (storedUser, inviteSender) {
  var temp = notifTemplate.generateRegWelcome(storedUser, inviteSender);
  emailModel.email(
    storedUser.email,
    temp.subject,
    temp.bodyText,
    temp.bodyHtml,
  );
};

exports.sendRegWelcomeAsync = function (storedUser, inviteSender, cb) {
  notifTemplate.generateRegWelcomeAsync(
    storedUser,
    inviteSender,
    function (email) {
      emailModel.email(
        storedUser.email,
        email.subject,
        email.bodyText,
        email.bodyHtml,
        undefined,
        cb,
      );
    },
  );
};

// 5) when the friend registered => "Your friend just accepted your invitation to whyd"
exports.sendInviteAccepted = function (senderId, storedUser) {
  if (getUserPrefs(senderId)['emAcc'] != -1)
    sendEmail(senderId, notifTemplate.generateInviteAccepted(storedUser));
};

// 6) when wants to delete their account => notify team
exports.askAccountDeletion = function (uId, uNm) {
  var text =
    (uNm || 'A user') +
    ' requested deletion of their profile: ' +
    process.appParams.urlPrefix +
    '/u/' +
    uId;
  emailModel.email(
    process.appParams.feedbackEmail,
    '[' + process.appParams.urlPrefix + '] user account deletion request',
    text,
  );
};

// 7) when user chose to delete their account => notify team
exports.sendUserDeleted = function (uId, uNm) {
  if (SEND_USER_DELETION_EMAILS) {
    var text =
      (uNm || 'A user') +
      ' deleted their profile: ' +
      process.appParams.urlPrefix +
      '/u/' +
      uId;
    emailModel.email(
      process.appParams.feedbackEmail,
      '[' + process.appParams.urlPrefix + '] user account deleted',
      text,
    );
  }
};

// ACCOUNT RELATED

// 1) when a user forgets his password => "open this link to reset your password"
exports.sendPasswordReset = function (uid, resetCode, redirect) {
  var temp = notifTemplate.generatePasswordReset(
    { id: uid },
    { resetCode: resetCode, redirect: redirect },
  );
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// 2) when a user has just set a new password => "your openwhyd password was successfully updated"
exports.sendPasswordUpdated = function (uid, emailAddr) {
  var temp = notifTemplate.generatePasswordUpdated({
    id: uid,
    email: emailAddr,
  });
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// 3) when a user has just set a new email address => "your openwhyd email was successfully updated"
exports.sendEmailUpdated = function (uid, emailAddr) {
  var temp = notifTemplate.generateEmailUpdated({ id: uid, email: emailAddr });
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// USER-TO-USER ACTION NOTIFICATIONS

function submitNotif(recipient, type, immediateNotifHandler, noNotifHandler) {
  if (!recipient)
    return console.error(
      'NULL recipient in models/notifEmails.js/submitNotif()',
    );
  //console.log("notifEmails.submitNotif, type:", type, (recipient.pref || {})[type]);
  if (recipient.pref && recipient.pref[type] == -1) {
    // console.log('no email notification will be sent (disabled by user)');
    noNotifHandler && noNotifHandler();
  } else if (recipient.pref && recipient.pref[type] > 0) {
    userModel.incrementNotificationCounter(recipient._id, noNotifHandler);
  } else if (immediateNotifHandler)
    // recipient.pref[type] == 0 (call handler to send immediate email)
    immediateNotifHandler();
}

// 1) when reposter reposts a post => "XXX has added one of your tracks on whyd"
exports.sendRepost = function (reposter, post, postAuthor /*Email*/) {
  submitNotif(postAuthor, 'emAdd', function () {
    var temp = notifTemplate.generateRepost(reposter, post);
    emailModel.email(
      postAuthor.email /*Email*/,
      temp.subject,
      temp.bodyText,
      temp.bodyHtml,
    );
  });
};

// 2) when subscriber subscribes to selectedUser => "XXX has subscribed to you on Openwhyd!"
exports.sendSubscribedToUser = function (subscriber, selectedUser, cb) {
  submitNotif(
    selectedUser,
    'emSub',
    function () {
      var temp = notifTemplate.generateSubscribedToUser(
        subscriber,
        selectedUser._id,
      );
      emailModel.email(
        selectedUser.email,
        temp.subject,
        temp.bodyText,
        temp.bodyHtml,
        undefined,
        cb,
      );
    },
    cb,
  );
};

// 3) when user likes a post
exports.sendLike = function (user, post, postAuthor) {
  submitNotif(postAuthor, 'emLik', function () {
    if (postAuthor.pref && postAuthor.pref['emLik'] == 0) {
      // user explicitely chose to receive immediate notifications
      var temp = notifTemplate.generateLike(user, post, postAuthor);
      emailModel.email(
        postAuthor.email,
        temp.subject,
        temp.bodyText,
        temp.bodyHtml,
      );
    }
  });
};

// 4) "XXX has added the same track(s) as you"
exports.sendPostedSameTrack = function (postAuthor, cb) {
  submitNotif(postAuthor, 'emSam', null, cb);
};

// 5) "XXX commented your track"
exports.sendComment = function (post, comment, cb) {
  if (getUserPrefs(post.uId)['emCom'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else sendEmail(post.uId, notifTemplate.generateComment(post, comment), cb);
};

// 6) "XXX mentioned you"
exports.sendMention = function (mentionedUid, post, comment, cb) {
  if (getUserPrefs(post.uId)['emMen'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else
    sendEmail(
      mentionedUid,
      notifTemplate.generateMention(mentionedUid, post, comment),
      cb,
    );
};

// 7) "XXX replied to your comment"
exports.sendCommentReply = function (post, comment, repliedUid, cb) {
  if (getUserPrefs(post.uId)['emRep'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else
    sendEmail(
      repliedUid,
      notifTemplate.generateCommentReply(post, comment, repliedUid),
      cb,
    );
};
