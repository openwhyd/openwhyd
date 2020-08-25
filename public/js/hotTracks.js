var hotTracks = {
  skip: 0,

  limit: 5,

  genre_index: 0,

  current_genre: undefined,

  genres: [
    { name: 'All', key: 'all' },
    { name: 'Electro', key: 'electro' },
    { name: 'Hip hop', key: 'hiphop' },
    { name: 'Pop', key: 'pop' },
    { name: 'Indie', key: 'indie' },
    { name: 'Folk', key: 'folk' },
    { name: 'Rock', key: 'rock' },
    { name: 'Punk', key: 'punk' },
    { name: 'Metal', key: 'metal' },
    { name: 'Blues', key: 'blues' },
    { name: 'R&B', key: 'r-b' },
    { name: 'Soul', key: 'soul' },
    { name: 'Jazz', key: 'jazz' },
    { name: 'Classical', key: 'classical' },
    { name: 'Reggae', key: 'reggae' },
    { name: 'Latin', key: 'latin' },
    { name: 'World', key: 'world' },
  ],

  init: function () {
    hotTracks.loadGenre(hotTracks.genre_index);
  },

  loadGenre: function (genre_index) {
    if (hotTracks.current_genre != undefined) {
      $('body').addClass('loading');
    }
    hotTracks.skip = 0;
    hotTracks.current_genre = hotTracks.genres[genre_index];
    //DISPLAY GENRES

    genreList = hotTracks.genres.map(function (object, i) {
      cssClass = object.key == hotTracks.current_genre.key ? 'selected' : '';
      return (
        '<li class=' +
        cssClass +
        "><a  onclick='hotTracks.loadGenre(" +
        i +
        ")'>" +
        object.name +
        '</a></li>'
      );
    });

    $('#genres').html(genreList);
    $('.genreSelector').html(' / ' + hotTracks.current_genre.name);

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
      '/hot/' +
        hotTracks.current_genre.key +
        '?format=json&skip=' +
        hotTracks.skip +
        '&limit=' +
        hotTracks.limit,
      function (data) {
        var content = '';

        content = data.tracks.map(function (track, i) {
          return hotTracks.templating(hotTracks.template, track);
        });

        $('.btnLoadMore').before(content);
        $('body').removeClass('loading');
        $('.btnLoadMore').removeClass('loading');
        $('.posts').ajaxify();

        if (callback != undefined) {
          callback.call();
        }
      }
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

    item.agoTimestamp = timeFromPost(item);

    //STATS
    if (item.nbR <= 0) {
      item.hasReposts = 'display:none';
    }
    if (item.nbL <= 0) {
      item.hasLoves = 'display:none';
    }

    item.hasComments = 'display:none';

    item.trackUrl = translateEidToUrl(item.eId);

    for (var p in item) {
      template = template.replace(
        new RegExp('{' + p + '}', 'g'),
        htmlEntities(item[p])
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
          /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/
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
          url.match(/https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/) || []
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
          /https?:\/\/(?:www\.)?dailymotion.com(?:\/embed)?\/video\/([\w-]+)/
        ) || []
      ).pop();
    },
  },
  vi: {
    name: 'Vimeo',
    urlPrefix: '//vimeo.com/',
    extractId: function (url) {
      return (
        url.match(/https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/) || []
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
      /jamendo.com\/.*track\/(\d+)/.test(url) ? { videoId: RegExp.$1 } : null;
    },
  },
  fi: {
    name: 'File',
  },
};

getPlayerMeta = function (eId, src) {
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

translateEidToUrl = function (eId) {
  return (getPlayerMeta(eId) || {}).contentUrl || eId;
};

/********************* TIME AGO ***************************/

timeFromPost = function (post) {
  var timeString = post._id.substring(0, 8);
  var timestamp = parseInt(timeString, 16) * 1000;
  return timeAgoWithString(timestamp);
};

/*
 * @param timestamp
 * @return date string
 */
timeAgoWithString = function (timestamp) {
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

  padNumber = function (str, n) {
    var ret = '' + str;
    while (ret.length < n) {
      // pad with leading zeroes
      ret = '0' + ret;
    }
    return ret;
  };

  renderTime = function (t) {
    var t = new Date(t);
    return t.getHours() + ':' + padNumber(t.getMinutes(), 2);
  };

  renderTimestamp = function (timestamp) {
    var t = timestamp / 1000,
      lastScale = 'second(s)';
    for (i in timeScales) {
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

  renderShortMonthYear = function (t) {
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
window.whydCtx = 'hot';
