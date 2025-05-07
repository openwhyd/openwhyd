/**
 * notifEmails model
 * send notification emails
 * @author adrienjoly, whyd
 **/

const mongodb = require('../models/mongodb.js');
const emailModel = require('../models/email.js');
const userModel = require('../models/user.js');
const notifTemplate = require('../templates/notif.js');

const SEND_USER_DELETION_EMAILS = false;

// helpers

async function getUserPrefs(uId) {
  const user = await userModel.fetchAndProcessUserById(uId);
  return (user || {}).pref || {};
}

async function sendEmail(toUid, emailObj, cb) {
  const to = await userModel.fetchAndProcessUserById(toUid);
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
  const temp = notifTemplate.generateAcceptedInvite(storedUser);
  emailModel.email(
    storedUser.email,
    temp.subject,
    temp.bodyText,
    temp.bodyHtml,
  );
};

// 3) when a user just finished registration => "Here are some tips to get started"
exports.sendRegWelcome = function (storedUser, inviteSender) {
  const temp = notifTemplate.generateRegWelcome(storedUser, inviteSender);
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
exports.sendInviteAccepted = async function (senderId, storedUser) {
  const prefs = await getUserPrefs(senderId);
  if (prefs['emAcc'] != -1)
    await sendEmail(senderId, notifTemplate.generateInviteAccepted(storedUser));
};

// 6) when wants to delete their account => notify team
exports.askAccountDeletion = function (uId, uNm) {
  const text =
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
    const text =
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
  const temp = notifTemplate.generatePasswordReset(
    { id: uid },
    { resetCode: resetCode, redirect: redirect },
  );
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// 2) when a user has just set a new password => "your openwhyd password was successfully updated"
exports.sendPasswordUpdated = function (uid, emailAddr) {
  const temp = notifTemplate.generatePasswordUpdated({
    id: uid,
    email: emailAddr,
  });
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// 3) when a user has just set a new email address => "your openwhyd email was successfully updated"
exports.sendEmailUpdated = function (uid, emailAddr) {
  const temp = notifTemplate.generateEmailUpdated({
    id: uid,
    email: emailAddr,
  });
  emailModel.notif(uid, temp.subject, temp.bodyText, temp.bodyHtml);
};

// USER-TO-USER ACTION NOTIFICATIONS

async function submitNotif(
  recipient,
  type,
  immediateNotifHandler,
  noNotifHandler,
) {
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
    await immediateNotifHandler();
}

// 1) when reposter reposts a post => "XXX has added one of your tracks on whyd"
exports.sendRepost = async function (reposter, post, postAuthor /*Email*/) {
  await submitNotif(postAuthor, 'emAdd', async function () {
    const temp = notifTemplate.generateRepost(reposter, post);
    emailModel.email(
      postAuthor.email /*Email*/,
      temp.subject,
      temp.bodyText,
      temp.bodyHtml,
    );
  });
};

// 2) when subscriber subscribes to selectedUser => "XXX has subscribed to you on Openwhyd!"
exports.sendSubscribedToUser = async function (subscriber, selectedUser, cb) {
  await submitNotif(
    selectedUser,
    'emSub',
    async function () {
      const temp = notifTemplate.generateSubscribedToUser(
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
exports.sendLike = async function (user, post, postAuthor) {
  await submitNotif(postAuthor, 'emLik', async function () {
    if (postAuthor.pref && postAuthor.pref['emLik'] == 0) {
      // user explicitely chose to receive immediate notifications
      const temp = notifTemplate.generateLike(user, post, postAuthor);
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
exports.sendPostedSameTrack = async function (postAuthor, cb) {
  await submitNotif(postAuthor, 'emSam', null, cb);
};

// 5) "XXX commented your track"
exports.sendComment = async function (post, comment, cb) {
  const prefs = await getUserPrefs(post.uId);
  if (prefs['emCom'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else
    await sendEmail(post.uId, notifTemplate.generateComment(post, comment), cb);
};

// 6) "XXX mentioned you"
exports.sendMention = async function (mentionedUid, post, comment, cb) {
  const prefs = await getUserPrefs(post.uId);
  if (prefs['emMen'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else
    await sendEmail(
      mentionedUid,
      notifTemplate.generateMention(mentionedUid, post, comment),
      cb,
    );
};

// 7) "XXX replied to your comment"
exports.sendCommentReply = async function (post, comment, repliedUid, cb) {
  const prefs = await getUserPrefs(post.uId);
  if (prefs['emRep'] == -1)
    cb && cb({ warn: 'no email notification will be sent (disabled by user)' });
  else
    await sendEmail(
      repliedUid,
      notifTemplate.generateCommentReply(post, comment, repliedUid),
      cb,
    );
};
