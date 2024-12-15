// command-line overridable config

const config = process.appParams; // cf init in appd.js
for (const key in config) exports[key] = config[key]; // 🥷 this populates module.exports with all the values from process.appParams

// TODO: update team and autoSubscribeUsers

exports.whydTeam = [
  // for access to admin endpoints
  {
    id: process.env.WHYD_ADMIN_OBJECTID,
    name: process.env.WHYD_ADMIN_NAME,
    email: process.env.WHYD_ADMIN_EMAIL,
  },
];

exports.autoSubscribeUsers = [
  /*
	{
		id: process.env.WHYD_ADMIN_OBJECTID,
		name: process.env.WHYD_ADMIN_NAME
	},
	*/
];

exports.adminEmails = {};
for (const i in exports.whydTeam)
  exports.adminEmails[exports.whydTeam[i].email] = true;

// track players

const PLAYERS = {
  yt: {
    name: 'YouTube',
    urlPrefix: '//youtube.com/watch?v=',
    extractId: function (url) {
      return (
        url.match(
          /(youtube\.com\/(v\/|embed\/|(?:.+)?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
        ) || []
      ).pop();
    },
  },
  sc: {
    name: 'Soundcloud',
    urlPrefix: '//soundcloud.com/',
    extractId: function (url) {
      return (
        (url.indexOf('soundcloud.com/player') != -1
          ? (url.match(/url=([^&]*)/) || []).pop()
          : null) ||
        (
          url.match(/https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_/]+)/) || []
        ).pop()
      );
    },
  },
  dm: {
    name: 'Dailymotion',
    urlPrefix: '//dailymotion.com/video/',
    extractId: function (url) {
      return (
        url.match(
          /https?:\/\/(?:www\.)?dailymotion.com(?:\/embed)?\/video\/([\w-]+)/,
        ) || []
      ).pop();
    },
  },
  vi: {
    name: 'Vimeo',
    urlPrefix: '//vimeo.com/',
    extractId: function (url) {
      return (
        url.match(/https?:\/\/(?:www\.)?vimeo\.com\/(clip:)?(\d+)/) || []
      ).pop();
    },
  },
  dz: {
    name: 'Deezer',
    urlPrefix: '//www.deezer.com/',
  },
  sp: {
    name: 'Spotify',
    urlPrefix: '//open.spotify.com/track/',
  },
  bc: {
    name: 'Bandcamp',
    urlMaker: function (eId) {
      const parts = eId.split('#')[0].substr(4).split('/');
      return parts.length < 2
        ? undefined
        : '//' + parts[0] + '.bandcamp.com/track/' + parts[1];
    },
  },
  ja: {
    name: 'Jamendo',
    urlPrefix: '//jamendo.com/track/',
    extractId: function (url) {
      const matches = /jamendo.com\/.*track\/(\d+)/.exec(url);
      return matches?.length > 0 ? { videoId: matches[1] } : null;
    },
  },
  fi: {
    name: 'File',
  },
};

exports.getPlayerMeta = function (eId, src) {
  if (eId && eId.length && eId[0] == '/') {
    const playerId = eId.split('/')[1];
    const player = PLAYERS[playerId];
    if (player)
      return {
        hostLabel: player.name,
        hostClass: player.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
        contentUrl: player.urlPrefix
          ? eId.replace('/' + playerId + '/', player.urlPrefix)
          : player.urlMaker
            ? player.urlMaker(eId, src)
            : src || eId.replace('/fi/', ''), // for audio files
      };
  }
};

exports.translateEidToUrl = function (eId) {
  return (exports.getPlayerMeta(eId) || {}).contentUrl || eId;
};

exports.translateUrlToEid = function (url) {
  for (const i in PLAYERS) {
    const eId = PLAYERS[i].extractId && PLAYERS[i].extractId(url);
    if (eId) return '/' + i + '/' + eId;
  }
};

// helper functions (from topicRendering module)

exports.addPrefix = function (url, urlPrefix) {
  return !url
    ? url
    : url.replace(/^\//, (urlPrefix || exports.urlPrefix) + '/');
};

exports.userImg = function (uid, urlPrefix) {
  return exports.addPrefix('/img/u/' + ('' + uid).split('/').pop(), urlPrefix);
};

exports.imgUrl = function (mid, freebaseThumbParams, _urlPrefix) {
  const urlPrefix = _urlPrefix || exports.urlPrefix;
  if (!mid) return mid;
  if (mid.startsWith('/yt/'))
    return 'https://i.ytimg.com/vi/' + mid.substr(4) + '/0.jpg';
  if (mid.startsWith('/dm/'))
    return 'https://www.dailymotion.com/thumbnail/video/' + mid.substr(4);
  if (mid.startsWith('/sc/')) return '/images/cover-soundcloud.jpg';
  if (mid == '/u/0') return urlPrefix + '/images/blank_user.gif';
  if (mid.startsWith('/u/'))
    return exports.userImg(mid /*.substr(3)*/, urlPrefix); //return "http://graph.facebook.com/v2.3/"+mid.substr(3)+"/picture";//?type=large";
  if (mid.startsWith('/uAvatarImg')) return exports.addPrefix(mid, urlPrefix);
  //if (mid.startsWith("/img")) mid = mid.substr(4);
  //if (mid.startsWith("/m")) mid = mid.substr(3);
  return mid;
};

/*
// dynamic part of config

var mongodb = require('../models/mongodb.js');
var configCol = mongodb.collections["config"];

exports.fetchDoc = function(doc, callback) {
	configCol.findOne({_id:doc}, function (err, record) {
		callback(record);
	});
};

exports.fetchVal = function(doc, key, callback) {
	exports.fetchDoc(doc, function(vals){
		callback(vals ? vals[key] : null);
	});
};

exports.update = function(doc, vals) {
	configCol.update({_id:doc}, {$set:vals}, { upsert: true });
}
*/
