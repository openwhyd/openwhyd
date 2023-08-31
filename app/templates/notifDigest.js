/**
 * notifDigest template
 * renders notification digest emails
 * @author adrienjoly, whyd
 **/

const config = require('../models/config.js');
const templateLoader = require('../templates/templateLoader.js');

// LOAD TEMPLATES

const digestTemplate = templateLoader.loadTemplate(
  'app/emails/notifDigest.html',
);
//var textTemplate = templateLoader.loadTemplate("app/emails/notifDigest.txt");

const SUPPORT_EMAIL = config.feedbackEmail;
const URL_PREFIX = config.urlPrefix;

/*
function sampleData(cb) {
	var subscriptions = {
		count: 2,
		items: [
			{id:0, name:"coco"},
			{id:1, name:"toto"}
		]
	};
	var posts = {
		count: 3,
		items: [
			{id:2, name:"hey joe", likes:{count:2}},
			{id:3, name:"maroon 5", likes:{count:1}, adds:{count:1}},
			{id:4, name:"the road", adds:{count:3}}
		]
	};
	cb(subscriptions, posts);
}
*/

function aggregateByPost(setList) {
  const postSet = {};
  for (const setName in setList)
    for (const pId in setList[setName]) {
      postSet[pId] = postSet[pId] || {};
      postSet[pId].id = postSet[pId].id || setList[setName][pId].id;
      postSet[pId].name = postSet[pId].name || setList[setName][pId].name;
      postSet[pId][setName] = setList[setName][pId][setName];
      postSet[pId].count =
        (postSet[pId].count || 0) + (postSet[pId][setName] || []).length;
      postSet[pId].plural = postSet[pId].count > 1 ? 's' : '';
    }
  return Object.values(postSet);
}

const INIT_PARAMS = {
  recipient: null,
  subscriptions: Array,
  repostedTrackSet: Object,
  likersPerPost: Object,
  sameTrackSet: Object,
  digestFrequency: null,
  notifType: null,
};

exports.NotifDigest = function (p) {
  for (const key in INIT_PARAMS)
    this[key] = p[key] || (INIT_PARAMS[key] && new INIT_PARAMS[key]());
};

exports.NotifDigest.prototype.addRepostedTrack = function (post, reposter) {
  const pId = post._id || post.id;
  const track = (this.repostedTrackSet[pId] = this.repostedTrackSet[pId] || {
    id: pId,
    name: post.name,
  });
  track.reposts = track.reposts || [];
  track.reposts.push({
    id: reposter._id || reposter.id,
    name: reposter.name,
  });
  return this;
};

exports.NotifDigest.prototype.addLikedTrack = function (post, liker) {
  const pId = post._id || post.id;
  const track = (this.likersPerPost[pId] = this.likersPerPost[pId] || {
    id: pId,
    name: post.name,
  });
  track.likes = track.likes || [];
  track.likes.push({
    id: liker._id || liker.id,
    name: liker.name,
  });
  return this;
};

exports.NotifDigest.prototype._prepareTemplateParameters = function () {
  const unsubPrefix =
    URL_PREFIX +
    '/api/unsubscribe?uId=' +
    (this.recipient._id || this.recipient.id) +
    (this.notifType ? '&type=' + this.notifType : '');
  const params = {
    // constants
    whydUrl: URL_PREFIX,
    urlPrefix: URL_PREFIX,
    supportEmail: SUPPORT_EMAIL,
    linkUnsubscribeNotifs: {
      url: unsubPrefix,
      text: 'Unsubscribe',
    },
    linkReduceNotifs: {
      url: unsubPrefix + '&action=reduce',
      text: 'receive less notifications',
    },
    // params
    user: this.recipient,
    digestFrequency: this.digestFrequency,
    posts: aggregateByPost({
      reposts: this.repostedTrackSet,
      sameTracks: this.sameTrackSet,
      likes: this.likersPerPost,
    }),
  };
  if (this.subscriptions.length)
    params.subscriptions = {
      count: this.subscriptions.length,
      plural: this.subscriptions.length > 1 ? 's' : '',
      items: this.subscriptions,
    };
  return params;
};

exports.NotifDigest.prototype.renderHtml = function () {
  return digestTemplate.render(this._prepareTemplateParameters());
};

exports.NotifDigest.prototype.renderText = function () {
  const p = this._prepareTemplateParameters();
  //return textTemplate.render(p).replace(/\n/g, "\n\n"); //"You need a modern email client to read this email, sorry...";
  let text = ['Hey, ' + p.user.name + '!'];
  if (p.posts)
    for (const i in p.posts) {
      text.push('');
      text.push(
        p.posts[i].count +
          ' music lover' +
          (p.posts[i].plural ? 's' : '') +
          ' added/liked your track "' +
          p.posts[i].name +
          '"',
      );
      for (const j in p.posts[i].reposts)
        text.push('- ' + p.posts[i].reposts[j].name);
      for (const j in p.posts[i].likes)
        text.push('- ' + p.posts[i].likes[j].name);
    }
  if (p.subscriptions) {
    text.push('');
    text.push(
      p.subscriptions.count +
        ' music lover' +
        (p.subscriptions.plural ? 's' : '') +
        ' subscribed to you',
    );
    for (const i in p.subscriptions.items)
      text.push('- ' + p.subscriptions.items[i].name);
  }
  text = text.concat([
    '',
    'The openwhyd team',
    '',
    "P.S : We're all ears at " +
      p.supportEmail +
      ', or you can chat live with us while browsing on ' +
      p.whydUrl,
    '',
  ]);
  if (p.linkUnsubscribeNotifs) {
    text.push('You receive too many Openwhyd notifications? You can: ');
    text.push(
      '- ' +
        p.linkUnsubscribeNotifs.text +
        ' (' +
        p.linkUnsubscribeNotifs.url +
        ')',
    );
    if (p.linkReduceNotifs)
      text.push(
        '- or ' + p.linkReduceNotifs.text + ' (' + p.linkReduceNotifs.url + ')',
      );
  }
  return text.join('\n');
};

exports.NotifDigest.prototype.renderNotifEmailObj = function (subject) {
  return {
    subject: subject,
    bodyText: this.renderText(),
    bodyHtml: this.renderHtml(),
  };
};
