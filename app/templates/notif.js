/**
 * notif template
 * renders notification emails
 * @author adrienjoly, whyd
 **/

const config = require('../models/config.js');
const mongodb = require('../models/mongodb.js'); // for getting user data
const trackModel = require('../models/track.js');
const templateLoader = require('../templates/templateLoader.js');
const NotifDigest = require('../templates/notifDigest.js').NotifDigest;
const { getSuggestedUsers } = require('../models/featuredUsers.js');

// CONSTANTS

const urlPrefix = config.urlPrefix;
const FEEDBACK_EMAIL = config.feedbackEmail;
const FEEDBACK_FOOTER =
  "P.S  : We'd love your feedback! We're all ears at " +
  FEEDBACK_EMAIL +
  ', and you can follow @open_whyd on twitter.';

const MAX_HOT_TRACKS = 3,
  MAX_RECOM_USERS = 4,
  MAX_BIO_LENGTH = 72; //  for RegWelcomeAsync

const TEMPLATE_PATH = 'app/emails/';
const TEMPLATES = {
  welcome: { file: 'welcome.html' }, // previously: welcome_old.html
  comment: { file: 'notifComment.html' },
  mention: { file: 'notifMention.html' },
  commentReply: { file: 'notifCommentReply.html' },
};
const TEMPLATE_DEFAULTS = {
  urlPrefix: config.urlPrefix,
};

// rendering functions

const renderTemplateFile = (function () {
  for (const i in TEMPLATES)
    TEMPLATES[i].template = templateLoader.loadTemplate(
      TEMPLATE_PATH + TEMPLATES[i].file,
    );
  return function (templateName, p = {}) {
    for (const i in TEMPLATE_DEFAULTS)
      if (p[i] == undefined) p[i] = TEMPLATE_DEFAULTS[i];
    const template = (TEMPLATES[templateName] || {}).template;
    if (template) return template.render(p);
  };
})();

function renderLink(text, href) {
  if (href && href[0] == '/') href = urlPrefix + href;
  return '<a href="' + href + '">' + text + '</a>';
}

function renderHtml(parags, title) {
  return [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
    '<title>' + title + '</title>',
    '</head>',
    '<body>',
  ]
    .concat(['<p>' + parags.join('</p><p>') + '</p>'])
    .concat(['</body>', '</html>'])
    .join('\n');
}

function renderText(parags) {
  return parags
    .join('\r\n\r\n')
    .replace(/<a href=['"]([^'"]+)['"][^>]*>([^<]*)<\/a>/gi, '$2 ($1)') // translate links (syntax <a href=""></a>)
    .replace(/<([^\s>]+)[^>]*>([^<]*)<\/([^>]+)>/gi, '$2'); // remove other html elements
}

function renderEmailTemplate(title, body) {
  return {
    subject: title,
    bodyText: renderText(body),
    bodyHtml: renderHtml(body, title),
  };
}

exports.generateAcceptedInvite = function (user) {
  // called from controllers/admin/invites.js
  const inviteUrl = urlPrefix + '/invite/' + user._id;
  //var body = acceptedInviteText.replace("{{inviteUrl}}", inviteUrl).replace("{{whydUrl}}", urlPrefix);
  return renderEmailTemplate('Your invitation to Openwhyd', [
    'Hey,',
    "Welcome to Openwhyd! We're excited to invite you into our community of music lovers in the one place to keep, play and share all the internet's music.",
    'To create your page on Openwhyd, click the link below:',
    renderLink(inviteUrl, inviteUrl),
    'Never stop jamming!',
    'the Openwhyd team',
    //FEEDBACK_FOOTER
    "PS: We'd love your feedback! In fact we need it to continue to develop Openwhyd to be the simplest and most enjoyable way for music lovers to access the wealth of music available online. We're all ears (or, eyes, actually) at " +
      FEEDBACK_EMAIL,
  ]);
};

// RELATED TO USER REGISTRATION / SIGN-UP

exports.generateRegWelcome = function (user, inviteSender) {
  return renderEmailTemplate('Welcome to Openwhyd, ' + user.name + '!', [
    'Hi, ' + user.name,
    "My name is Tony, Openwhyd's Chief BBQ Officer, and I'd like to personally welcome you to our community" +
      ' of music lovers. Now that you’re in, we can’t wait to hear the music that makes you rock!',
    'Here are some tips to get started:',
    '- Add, collect and share great tracks to your profile by clicking on the green [+ Add track] button on the top right of the screen;',
    '- Install the ' +
      renderLink('bookmarklet/extension', '/button') +
      ' so you can add great music directly to your profile from anywhere on the web;',
    '- Make your profile beautiful by customizing your cover photo and playlist covers, you can even make a special URL like ' +
      renderLink('openwhyd.org/tony', '/tony') +
      ", that way it's easier for people to remember. Plus, anyone can listen to your profile, they don't even have to be Openwhyd members!",
    '- ' +
      renderLink('Invite your friends', '/invite') +
      " and people you would like to share music with, after all it's a social network for music lovers! People you invite are automatically connected to you.",
    inviteSender
      ? 'By the way, take a look at the stream of your friend ' +
        renderLink(
          inviteSender.name,
          '/u/' + (inviteSender._id || inviteSender.id),
        )
      : '',
    'Never stop jamming!',
    ' - Tony',
    //FEEDBACK_FOOTER
    "PS: I'd love to hear all of your feedback, and I'm here to answer any questions, just email me! " +
      renderLink('tony@openwhyd.org', 'mailto:tony@openwhyd.org'),
    'Follow us ' +
      renderLink('@open_whyd on Twitter', 'http://twitter.com/open_whyd') +
      ' and definitely Like ' +
      renderLink('our Facebook page!', 'http://facebook.com/openwhyd'),
  ]);
};

exports.generateRegWelcomeAsync = function (user, inviteSender, cb) {
  getSuggestedUsers().then((suggestedUsers) => {
    trackModel.getHotTracksFromDb({ limit: MAX_HOT_TRACKS }, (hotPosts) => {
      const hotUsers = suggestedUsers
        .slice(0, MAX_RECOM_USERS)
        .map((user = {}) => ({
          ...user,
          bio:
            (user.bio || '').length > MAX_BIO_LENGTH
              ? user.bio.substr(0, MAX_BIO_LENGTH) + '...'
              : user.bio,
        }));
      const p = {
        hotTracks: hotPosts,
        hotUsers1: hotUsers.splice(0, 2),
        hotUsers2: hotUsers.slice(0, 2),
        urlPrefix: config.urlPrefix, //"http://proto.whyd.com";
        imgPath: config.urlPrefix + '/images/email',
        unsubUrl:
          config.urlPrefix + '/api/unsubscribe?type=emSub&uId=' + user.id,
      };
      cb({
        subject: 'Welcome to Openwhyd, ' + user.name + '!',
        bodyText: exports.generateRegWelcome(user, inviteSender).bodyText,
        bodyHtml: renderTemplateFile('welcome', p),
      });
    });
  });
};

exports.generateInviteBy = function (senderName, inviteId, message) {
  const inviteUrl = urlPrefix + '/invite/' + inviteId;
  return {
    subject: senderName + ' invited you to join Openwhyd',
    bodyText:
      (message ? message + '\n\n--\n\n' : '') +
      [
        "Hey, I wanted to invite you to join our community of music lovers at Openwhyd. It's a social network designed exclusively for music.",
        "Openwhyd is the place to keep, play, and share all of the internet's music from sites like Soundcloud, Vimeo, and YouTube.",
        'Here is your personal invite: ' + inviteUrl,
        'Never stop jamming,',
        senderName,
        //FEEDBACK_FOOTER
      ].join('\n\n'),
  };
};

exports.generateInviteAccepted = function (user) {
  return {
    subject: 'Your friend ' + user.name + ' accepted your invite to Openwhyd',
    bodyText:
      'Great news! Your friend ' +
      user.name +
      ' just accepted your invitation to Openwhyd!\n\n' +
      'Check out their library: ' +
      urlPrefix +
      '/u/' +
      user.id +
      '\n\n' +
      'Thanks for adding interesting people to the Openwhyd community!\n\n' +
      'We look forward to listening to your next amazing tracks on Openwhyd: ' +
      urlPrefix +
      '\n\n' +
      'Greetings from the Openwhyd team!\n\n' +
      FEEDBACK_FOOTER,
  };
};

// ACCOUNT RELATED

exports.generatePasswordReset = function (user, options) {
  options = options || {};
  let href =
    urlPrefix + '/password?uid=' + user.id + '&resetCode=' + options.resetCode;
  if (options.redirect)
    href += '&redirect=' + encodeURIComponent(options.redirect);
  return {
    subject: 'Openwhyd password',
    bodyText:
      'If you want to set a new password to your Openwhyd account, open this link:\n\n' +
      href +
      '\n\n' +
      'Greetings from the Openwhyd team!\n\n' +
      FEEDBACK_FOOTER,
  };
};

exports.generatePasswordUpdated = function (user) {
  return {
    subject: 'your Openwhyd password was successfully updated!',
    bodyText:
      'As you requested, we updated your password on Openwhyd.\n\n' +
      'In order to login, open this URL: ' +
      urlPrefix +
      '\n' +
      'Then, enter your email (' +
      user.email +
      ') and your new password.\n\n' +
      "We're eager to hearing your feedback about Openwhyd!\n\n" +
      'Greetings from the Openwhyd team!\n\n' +
      FEEDBACK_FOOTER,
  };
};

exports.generateEmailUpdated = function () {
  return {
    subject: 'your Openwhyd email address was successfully updated!',
    bodyText: [
      'As you requested, we updated your email address on Openwhyd.',
      'From now on, you must use your new email address in order to log in: ' +
        urlPrefix,
      "We're eager to hearing your feedback about Openwhyd!",
      'Greetings from the Openwhyd team!',
      FEEDBACK_FOOTER,
    ].join('\n\n'),
  };
};

// USER-TO-USER ACTION NOTIFICATIONS

exports.generateNotifDigest = function (p) {
  // {user, subscriptions, repostedTrackSet, likersPerPost, digestFrequency}
  p = p || {};
  p.notifType = 'digest';
  return new NotifDigest(p).renderNotifEmailObj(
    'Your ' + p.digestFrequency + ' digest',
  );
};

exports.generateRepost = async function (reposter, post) {
  return new NotifDigest({
    recipient: await mongodb.getUserFromId(post.uId),
    notifType: 'emAdd',
  })
    .addRepostedTrack(post, reposter)
    .renderNotifEmailObj(
      reposter.name + ' has added one of your tracks on Openwhyd!',
    );
};

exports.generateSubscribedToUser = async function (sender, favoritedId) {
  return new NotifDigest({
    recipient: await mongodb.getUserFromId(favoritedId),
    subscriptions: [sender],
    notifType: 'emSub',
  }).renderNotifEmailObj(sender.name + ' has subscribed to you on Openwhyd!');
};

exports.generateLike = async function (user, post) {
  return new NotifDigest({
    recipient: await mongodb.getUserFromId(post.uId),
    notifType: 'emLik',
  })
    .addLikedTrack(post, user)
    .renderNotifEmailObj(
      user.name + ' has liked one of your tracks on Openwhyd!',
    );
};

exports.generateComment = async function (post, comment) {
  return renderEmailTemplate(comment.uNm + ' commented on your track', [
    //renderLink("See the comment", "/c/"+post._id),
    renderTemplateFile('comment', {
      unsubUrl:
        config.urlPrefix + '/api/unsubscribe?type=emCom&uId=' + post.uId,
      user: await mongodb.getUserFromId('' + comment.uId),
      track: post,
    }),
  ]);
};

exports.generateMention = async function (mentionedUid, post, comment) {
  return renderEmailTemplate(comment.uNm + ' mentioned you on a track', [
    //renderLink("See the comment", "/c/"+post._id),
    renderTemplateFile('mention', {
      unsubUrl:
        config.urlPrefix + '/api/unsubscribe?type=emMen&uId=' + mentionedUid,
      user: await mongodb.getUserFromId('' + comment.uId),
      track: post,
    }),
  ]);
};

exports.generateCommentReply = async function (post, comment, repliedUid) {
  return renderEmailTemplate(comment.uNm + ' replied to one of your comments', [
    //renderLink("See the comment", "/c/"+post._id),
    renderTemplateFile('commentReply', {
      unsubUrl:
        config.urlPrefix + '/api/unsubscribe?type=emRep&uId=' + repliedUid,
      user: await mongodb.getUserFromId('' + comment.uId),
      track: post,
    }),
  ]);
};
