/* global $ */

const global = window;

var hotTracks = {
  skip: 0,

  limit: 5,

  init: function () {
    hotTracks.skip = 0;

    hotTracks.loadTracks(function () {
      $('.post:eq(0) .thumb').append('<div class="medal">1</div>');
      $('.post:eq(1) .thumb').append('<div class="medal">2</div>');
      $('.post:eq(2) .thumb').append('<div class="medal">3</div>');
    });
  },

  loadTracks: function (callback) {
    if (hotTracks.skip == 0) {
      $('.posts .post').remove();
    }

    $.getJSON(
      '/hot/all?format=json&skip=' +
        hotTracks.skip +
        '&limit=' +
        hotTracks.limit,
      function (data) {
        var content = '';

        content = data.tracks.map(function (track) {
          return hotTracks.templating(hotTracks.template, track);
        });

        $('.btnLoadMore').before(content);
        $('body').removeClass('loading');
        $('.btnLoadMore').removeClass('loading');
        $('.posts').ajaxify();

        if (callback != undefined) {
          callback.call();
        }
      },
    );
  },

  loadMore: function () {
    hotTracks.skip = hotTracks.skip + hotTracks.limit;
    hotTracks.loadTracks();
    $('.btnLoadMore').addClass('loading');
  },

  templating: function (template, item) {
    //CSS
    item.cssClass = '';
    var rankIncr = item.rankIncr;
    if (rankIncr != 'undefined') {
      if (rankIncr > 0) {
        item.cssClass += 'rankingUp';
      } else if (rankIncr < 0) {
        item.cssClass += 'rankingDown';
      } else {
        item.cssClass += '';
      }
    }

    item.agoTimestamp = global.timeFromPost(item);

    //STATS
    if (item.nbR <= 0) {
      item.hasReposts = 'display:none';
    }
    if (item.nbL <= 0) {
      item.hasLoves = 'display:none';
    }

    item.hasComments = 'display:none';

    item.trackUrl = global.translateEidToUrl(item.eId);

    for (let p in item) {
      template = template.replace(
        new RegExp('{' + p + '}', 'g'),
        global.htmlEntities(item[p]),
      );
    }

    return template.replace(/\{\w*\}/gi, ''); // remove un-populated slots
  },

  template:
    '<div class="post {cssClass}" data-pid="{_id}" data-loved="{isLoved}" >' +
    '<div class="playBar"></div>' +
    '<a class="thumb" href="{trackUrl}" target="_blank" data-eid="{eId}" onclick="return playTrack(this);"' +
    'style="background-image:url(\'{img}\');">' +
    '<img src="{img}">' +
    '<div class="play"></div>' +
    '</a>' +
    '<h2><a href="/c/{_id}" class="no-ajaxy">{name}</a></h2>' +
    '<p class="author">' +
    '  <span style="background-image:url(\'/img/u/{uId}\');"></span>' +
    '  <a href="/u/{uId}">{uNm}</a>' +
    '</p>' +
    '<span class="ago">' +
    '  <a href="/c/{_id}">{agoTimestamp}</a>' +
    '</span>' +
    '<div class="stats">' +
    '  <span class="nbReposts" style="{hasReposts}" onclick="javascript:showReposts(\'{_id}\')">' +
    '     <span>{nbR}</span>' +
    '  </span>' +
    '  <span class="nbLoves" style="{hasLoves}" onclick="javascript:showPostLovers(\'{_id}\')">' +
    '    <span>{nbL}</span>' +
    '  </span>' +
    '</div>' +
    '<div class="btns">' +
    '  <a class="btnRepost" href="javascript:publishPost(\'{_id}\');">Add to</a>' +
    '  <span>&middot;</span>' +
    '  <a class="btnLike " href="javascript:toggleLovePost(\'{_id}\');">Like</a>' +
    '  <span>&middot;</span>' +
    '  <a class="btnComment" href="javascript:login();">Comment</a>' +
    '  <span>&middot;</span>' +
    '  <a class="btnShare" href="javascript:sharePost(\'{_id}\');">' +
    '    <span> Share </span>' +
    '  </a>' +
    '</div>' +
    '</div>',
};

/********************* UTILS ***************************/

//TODO MOVE TO WHYDPLAYER.JS

var PLAYERS = {
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
    urlPrefix: '//www.deezer.com/track/',
  },
  sp: {
    name: 'Spotify',
    urlPrefix: '//open.spotify.com/track/',
  },
  bc: {
    name: 'Bandcamp',
    urlMaker: function (eId) {
      var parts = eId.split('#')[0].substr(4).split('/');
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

global.getPlayerMeta = function (eId, src) {
  if (eId && eId.length && eId[0] == '/') {
    var playerId = eId.split('/')[1];
    var player = PLAYERS[playerId];
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

global.translateEidToUrl = function (eId) {
  return (global.getPlayerMeta(eId) || {}).contentUrl || eId;
};

/********************* TIME AGO ***************************/

global.timeFromPost = function (post) {
  var timeString = post._id.substring(0, 8);
  var timestamp = parseInt(timeString, 16) * 1000;
  return global.timeAgoWithString(timestamp);
};

/*
 * @param timestamp
 * @return date string
 */
global.timeAgoWithString = function (timestamp) {
  var MONTHS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  var timeScales = [
    { 'minute(s)': 60 },
    { 'hour(s)': 60 },
    { 'day(s)': 24 },
    { 'month(s)': 30 },
    { 'year(s)': 12 },
  ];

  const padNumber = function (str, n) {
    var ret = '' + str;
    while (ret.length < n) {
      // pad with leading zeroes
      ret = '0' + ret;
    }
    return ret;
  };

  const renderTime = function (t) {
    var t = new Date(t);
    return t.getHours() + ':' + padNumber(t.getMinutes(), 2);
  };

  const renderTimestamp = function (timestamp) {
    var t = timestamp / 1000,
      lastScale = 'second(s)';
    for (const i in timeScales) {
      var scaleTitle;
      for (scaleTitle in timeScales[i]);
      var scaleVal = timeScales[i][scaleTitle];

      if (t / scaleVal < 1) break;

      t = t / scaleVal;
      lastScale = scaleTitle;
    }
    var rounded = Math.round(t);
    return rounded + ' ' + lastScale.replace(/\(s\)/g, rounded > 1 ? 's' : '');
  };

  const renderShortMonthYear = function (t) {
    var t = new Date(t);
    var sameYear = false; //(new Date()).getFullYear() == t.getFullYear();
    return MONTHS_SHORT[t.getMonth()] + (sameYear ? '' : ' ' + t.getFullYear());
  };

  var date = new Date(timestamp);
  date =
    renderTime(date) +
    ' - ' +
    date.getDate() +
    ' ' +
    MONTHS_SHORT[date.getMonth()] +
    ' ' +
    date.getFullYear();

  var ago = new Date() - timestamp;
  if (ago < 1000 * 60 * 60 * 24 * 32) {
    ago = renderTimestamp(ago);
  } else {
    ago = renderShortMonthYear(timestamp);
  }
  return ago;
};

$(document).ready(function () {
  hotTracks.init();
  $('#searchForm input').focus();
});
global.whydCtx = 'hot';
