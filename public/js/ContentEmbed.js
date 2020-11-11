/**
 * ContentEmbed
 * a class for embedding content from openwhyd and other web sites: youtube, dailymotion, vimeo, soundcloud...
 * @author adrienjoly, whyd
 */

// DEPRECATED: The track detection and metadata retrieval functionalities are to be replaced by PlayemJS

function ContentEmbed() {
  var generalUrl = /\/\/[-A-Z0-9+&@#$*'()\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/gi; // \b(?:https?|ftp|file):
  var scClientId = 'eb257e698774349c22b0b727df0238ad';
  var JAMENDO_CLIENT_ID = '2c9a11b9';

  var embedDefaults = {
    autoplay: true,
    width: 360, //425,
    height: 270, //344
  };

  // ex: https://www.jamendo.com/en/track/1115147/get-momentum
  //  => https://api.jamendo.com/v3.0/tracks?client_id=2c9a11b9&id=1115147
  //  => https://api.jamendo.com/v3.0/tracks/file?client_id=2c9a11b9&action=stream&audioformat=mp32&id=1115147
  // TODO: also support short urls: http:\/\/jamen.do\/t\/1115147
  var jamendoEmbed = {
    whydPrefix: 'ja',
    label: 'Jamendo',
    detect: function (url, cb) {
      cb(
        /jamendo.com\/.*track\/(\d+)/.test(url) ? { videoId: RegExp.$1 } : null
      );
    },
    getHref: function (embedRef) {
      return '//www.jamendo.com/track/' + embedRef.videoId;
    },
    renderImg: function (embedRef) {
      return '<img src="' + embedRef.img + '" />';
    },
    require: function (embedRef, callback) {
      $.ajax({
        url:
          '//api.jamendo.com/v3.0/tracks?client_id=' +
          JAMENDO_CLIENT_ID +
          '&id=' +
          embedRef.videoId,
        success: function (data) {
          try {
            var errors = data.headers.error_message + data.headers.warnings;
            if (errors) console.log(errors);
          } catch (e) {
            console.error(e);
          }
          data = data.results[0];
          embedRef.name = data.artist_name + ' - ' + data.name;
          embedRef.img = data.album_image;
          callback(embedRef);
        },
        error: function () {
          callback(embedRef);
        },
      });
    },
  };

  var bandcampEmbed = (function () {
    var API_KEY = 'vatnajokull';
    var API_PREFIX = '//api.bandcamp.com/api';
    var API_SUFFIX = '&key=' + API_KEY + '&callback=?';
    var REGEX = /([a-zA-Z0-9_\-]+).bandcamp\.com\/track\/([a-zA-Z0-9_\-]+)/;
    function detect(url, cb) {
      url = url.split('#')[0].split('//').pop();
      var matches = url.match(REGEX);
      if (!matches || matches.length < 3) return cb();
      var bandUri = matches[1],
        trackUri = matches[2];
      $.getJSON(
        API_PREFIX + '/url/1/info?url=' + encodeURIComponent(url) + API_SUFFIX,
        function (data) {
          var trackId = (data || {}).track_id;
          if (!trackId) return cb();
          $.getJSON(
            API_PREFIX + '/track/3/info?track_id=' + trackId + API_SUFFIX,
            function (data) {
              data = data || {};
              if (!data.streaming_url) return cb();
              var embedRef = {
                id:
                  '/bc/' +
                  [bandUri, trackUri, trackId].join('/') +
                  '#' +
                  data.streaming_url,
                title: data.title,
                img: data.large_art_url || data.small_art_url,
                url: url,
                name: data.title,
              };
              // optional parts
              function fetchBandName(cb) {
                if (!data.band_id) return cb();
                $.getJSON(
                  API_PREFIX +
                    '/band/3/info?band_id=' +
                    data.band_id +
                    API_SUFFIX,
                  function (data) {
                    var bandName = (data || {}).name;
                    if (bandName)
                      embedRef.name = bandName + ' - ' + embedRef.name;
                    cb();
                  }
                );
              }
              function fetchAlbumArt(cb) {
                if (embedRef.img || !data.album_id) return cb();
                $.getJSON(
                  API_PREFIX +
                    '/album/2/info?album_id=' +
                    data.album_id +
                    API_SUFFIX,
                  function (data) {
                    data = data || {};
                    embedRef.img = data.large_art_url || data.small_art_url;
                    cb();
                  }
                );
              }
              fetchBandName(function () {
                fetchAlbumArt(function () {
                  cb(embedRef);
                });
              });
            }
          );
        }
      );
    }
    var BandcampPlayer = BandcampPlayer || function () {};
    return {
      whydPrefix: 'bc',
      label: 'Bandcamp',
      detect: detect,
      player: new BandcampPlayer(),
      getHref: function (embedRef) {
        return embedRef.url;
      },
      renderImg: function (embedRef, callback) {
        return '<img src="' + embedRef.img + '" />';
      },
      play: function (embedRef, options, cb) {
        this.player.playStreamUrl(embedRef.id.split('#').pop());
        cb && cb();
      },
      stop: function () {
        this.player.stop();
      },
    };
  })();

  var fileEmbed = {
    whydPrefix: 'fi',
    label: 'Audiofile',
    detect: function (url, cb) {
      var ext = url.split('#').pop().toLowerCase().split('.').pop();
      cb(
        ext != 'mp3' && ext != 'ogg'
          ? null
          : {
              id: url,
              url: url,
              name: url.split('/').pop(),
              img: '/images/cover-audiofile.png',
            }
      );
    },
    getHref: function (embedRef) {
      return embedRef.url;
    },
    renderImg: function (embedRef, callback) {
      return '<img src="' + embedRef.img + '" />';
    },
  };

  var deezerEmbed = {
    whydPrefix: 'dz',
    label: 'Deezer',
    regex: /deezer\.com\/track\/(\d+)/i,
    detect: function (url, cb) {
      cb(this.regex.test(url) ? { videoId: RegExp.$1 } : null);
    },
    getHref: function (embedRef) {
      return '//www.deezer.com/track/' + embedRef.videoId;
    },
    renderImg: function (embedRef) {
      return '<img src="' + embedRef.img + '" title="' + embedRef.name + '" />';
    },
    require: function (embedRef, callback) {
      $.ajax({
        type: 'GET',
        url: '//api.deezer.com/track/' + embedRef.videoId + '?output=jsonp',
        dataType: 'jsonp',
        success: function (data) {
          if (!data.error) {
            embedRef.name = data.artist.name + ' - ' + data.title;
            embedRef.img = data.album.cover;
          }
          callback(embedRef);
        },
        error: function () {
          callback(embedRef);
        },
      });
    },
  };

  function oEmbed(sourceId, sourceName, oembedUrl, regexs) {
    return {
      whydPrefix: sourceId,
      label: sourceName,
      detect: function (url, cb) {
        for (let i in regexs)
          if (regexs[i].test(url)) return cb({ url: url, videoId: RegExp.$1 });
        cb();
      },
      getHref: function (embedRef) {
        return this.url;
      },
      renderImg: function (embedRef) {
        return '<img src="' + embedRef.img + '" />';
      },
      require: function (embedRef, callback) {
        $.ajax({
          type: 'GET',
          url: oembedUrl + encodeURIComponent(embedRef.url),
          dataType: 'jsonp',
          success: function (data) {
            if (data) {
              embedRef.name = data.title;
              embedRef.img = data.thumbnail_url;
            }
            callback(embedRef);
          },
          error: function () {
            callback(embedRef);
          },
        });
      },
    };
  }

  var spotifyEmbed = oEmbed(
    'sp',
    'Spotify',
    '//embed.spotify.com/oembed/?url=',
    [/spotify\.com\/track\/(\w+)/i, /spotify\:track\:(\w+)/i]
  );

  // test: spotify:track:6NmXV4o6bmp704aPGyTVVG => https://open.spotify.com/track/4VGLw2x6oTDc9krhyP0MVP

  var youtubeEmbed = {
    whydPrefix: 'yt',
    label: 'Youtube',
    //regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/)?([a-zA-Z0-9_\-]+)/,
    //regex: /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/,
    regex: /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/,
    detect: function (url, cb) {
      var m = url.match(this.regex);
      cb(
        !m
          ? null
          : {
              videoId: m.pop(),
            }
      );
    },
    getHref: function (embedRef) {
      return 'https://www.youtube.com/v/' + embedRef.videoId;
    },
    renderImg: function (embedRef, callback) {
      return '<img src="' + embedRef.img + '" title="' + embedRef.name + '" />';
    },
    require: function (embedRef, callback) {
      embedRef.img = 'https://i.ytimg.com/vi/' + embedRef.videoId + '/0.jpg';
      var YOUTUBE_API_KEY =
        YOUTUBE_API_KEY || 'AIzaSyAaCiahZyfSTOmQoWkul78t00vO88wUrYQ';
      // TODO: use playemjs instead
      $.getJSON(
        'https://www.googleapis.com/youtube/v3/videos?id=' +
          embedRef.videoId +
          '&part=snippet&key=' +
          YOUTUBE_API_KEY +
          '&callback=?',
        function (data) {
          if (data && (data.items || []).length)
            embedRef.name = (data.items[0].snippet || {}).title;
          callback(embedRef);
        }
      );
    },
    render: function (embedRef, options, callback) {
      var options = options || embedDefaults;
      var url =
        'https://youtube.com/embed/' +
        embedRef.videoId +
        '?wmode=opaque&amp;controls=0;autoplay=' +
        (options.autoplay ? 1 : 0);
      var html =
        '<iframe src="' +
        url +
        '" width="' +
        options.width +
        '" height="' +
        options.height +
        '" frameborder="0" class="youtube-player" type="text/html" ></iframe>';
      if (callback) callback(html);
      return html;
    },
  };

  var soundcloudEmbed = {
    whydPrefix: 'sc',
    label: 'Soundcloud',
    regex: /soundcloud\.com\/([\w-_\/]+)/, // https?:\/\/(?:www\.)?
    regexShort: /snd\.sc\/([\w-_\/]+)/, // https?:\/\/
    detect: function (url, cb) {
      if (url.split('?')[0].indexOf('/sets/') > -1) {
        try {
          showMessage('Soundcloud Sets are not supported yet', true);
        } catch (e) {
          console.error(e);
        }
        cb();
        return;
      }
      if (url.indexOf('/sc/') == 0)
        // ex: /sc/silkmusik/raw-percussion-build#https://api.soundcloud.com/tracks/60886771
        url = url.replace('/sc/', '//soundcloud.com/');
      if (url.match(this.regex) || url.match(this.regexShort)) cb({ url: url });
      /*else if (url.match(this.regexShort))
				$.getJSON('//soundcloud.com/oembed?callback=?', {format: 'js', url: url, iframe: true }, function(data) {
					console.log("sc oembed", data);
					cb({ url: data.url });
				});*/ else if (
        url.indexOf('soundcloud.com/player') != -1
      ) {
        var url = /url=([^&]*)/.exec(url);
        cb(
          !url || url.length != 2
            ? null
            : {
                url: decodeURIComponent(url[1]),
              }
        );
      } else cb();
    },
    getHref: function (embedRef) {
      return embedRef.url;
    },
    renderImg: function (embedRef, callback) {
      return '<img src="' + embedRef.img + '" />';
    },
    require: function (embedRef, callback) {
      //var url = 'https://soundcloud.com/oembed?url='+encodeURIComponent(embedRef.url)+'&format=js&iframe=true&maxwidth='+embedDefaults.width + '&callback=?';
      var url =
        'https://api.soundcloud.com/resolve.json?url=' +
        encodeURIComponent('http://' + embedRef.url.split('//').pop()) +
        '&client_id=' +
        scClientId +
        '&callback=?';
      $.getJSON(url, function (data, status) {
        if (!data || !data.id) return callback();
        embedRef.name = data.title;
        embedRef.id =
          '/sc/' +
          data.permalink_url.split('soundcloud.com/').pop() +
          '#' +
          data.uri; // includes data.id
        embedRef.img = data.artwork_url;
        embedRef.name =
          (data.title && data.user && data.title.indexOf(' - ') == -1
            ? data.user.username + ' - '
            : '') + data.title;
        callback(embedRef);
      });
    },
    render: function (embedRef, options, callback) {
      var options = options || embedDefaults;
      var scId = embedRef.id.split('#').pop();
      var url =
        'https://w.soundcloud.com/player/?url=' +
        /*encodeURIComponent*/ scId +
        '&amp;show_artwork=true' +
        (options.autoplay ? '&amp;auto_play=true' : '');
      var html =
        '<iframe src="' +
        url +
        '" width="' +
        options.width +
        '" height="166" scrolling="no" frameborder="0" kwframeid="4"></iframe>';
      if (callback) callback(html);
      return html;
    },
  };

  var vimeoEmbed = {
    whydPrefix: 'vi',
    label: 'Vimeo',
    regex: /vimeo\.com\/(clip\:)?(\d+)/, // https?:\/\/(?:www\.)? // http://stackoverflow.com/questions/2662485/simple-php-regex-question
    detect: function (url, cb) {
      var m = url.match(this.regex);
      cb(
        !m
          ? null
          : {
              videoId: m.pop(),
            }
      );
    },
    getHref: function (embedRef) {
      return 'https://vimeo.com/' + embedRef.videoId;
    },
    renderImg: function (embedRef, callback) {
      return '<img src="' + embedRef.img + '" />';
    },
    require: function (embedRef, callback) {
      $.getJSON(
        'https://vimeo.com/api/v2/video/' +
          embedRef.videoId +
          '.json?callback=?',
        function (data) {
          //console.log("vimeo api response", data);
          if (data && data.length) {
            embedRef.name = data[0].title;
            embedRef.img = data[0].thumbnail_medium;
            callback(embedRef);
          } else callback();
        }
      );
    },
    render: function (embedRef, options, callback) {
      var options = options || embedDefaults;
      var url =
        'https://player.vimeo.com/video/' +
        embedRef.videoId +
        '?title=0&amp;byline=0&amp;portrait=0&amp;wmode=opaque&amp;autoplay=' +
        (options.autoplay ? 1 : 0);
      var html =
        '<iframe src="' +
        url +
        '" width="' +
        options.width +
        '" height="' +
        options.height +
        '" frameborder="0" type="text/html" ></iframe>';
      if (callback) callback(html);
      return html;
    },
  };

  var dailymotionEmbed = {
    whydPrefix: 'dm',
    label: 'Dailymotion',
    regex: /dailymotion.com(?:\/embed)?\/video\/([\w-]+)/, // https?:\/\/(?:www\.)?
    detect: function (url, cb) {
      var m = url.match(this.regex);
      cb(
        !m
          ? null
          : {
              videoId: m.pop(),
            }
      );
    },
    getHref: function (embedRef) {
      return embedRef.url; //'http://www.dailymotion.com/swf/' + embedRef.videoId;
    },
    renderImg: function (embedRef, callback) {
      return (
        '<img src="https://www.dailymotion.com/thumbnail/video/' +
        videoId +
        '" />'
      );
    },
    require: function (embedRef, callback) {
      //embedRef.img = 'https://www.dailymotion.com/thumbnail/video/' + embedRef.videoId + '/0.jpg';
      //callback(embedRef);
      var url = encodeURIComponent('http://' + embedRef.url.split('//').pop()); // "http://www.dailymotion.com/embed/video/k7lToiW4PjB0Rx2Pqxt";
      $.getJSON(
        'https://www.dailymotion.com/services/oembed?format=json&url=' +
          url +
          '&callback=?',
        function (data) {
          //console.log(data)
          embedRef.img = data.thumbnail_url; //.replace("_preview_medium", "_preview_large");
          embedRef.name = data.title;
          embedRef.url = /src=\"([^\"]*)\"/.exec(data.html).pop();
          if (embedRef.url)
            embedRef.videoId = decodeURIComponent(embedRef.url)
              .split('/')
              .pop();
          callback(embedRef);
        }
      );
    },
    render: function (embedRef, options, callback) {
      options = options || embedDefaults;
      var url =
        'https://www.dailymotion.com/swf/' +
        embedRef.videoId +
        '?autoPlay=' +
        options.autoplay +
        '&related=0';
      var html =
        '<iframe src="' +
        url +
        '" width="' +
        options.width +
        '" height="' +
        options.height +
        '" frameborder="0" type="text/html" ></iframe>';
      if (callback) callback(html);
      return html;
    },
  };

  var embedTypes = {
    yt: youtubeEmbed,
    sc: soundcloudEmbed,
    vi: vimeoEmbed,
    dm: dailymotionEmbed,
    fi: fileEmbed,
    bc: bandcampEmbed,
    ja: jamendoEmbed,
    sp: spotifyEmbed,
    dz: deezerEmbed,
  };

  var embedDetectors = [];
  for (let i in embedTypes) embedDetectors.push(embedTypes[i]);

  return {
    extractEmbedRef: function (url, callback) {
      //console.log("ContentEmbed.extractEmbedRef()", url, "...");
      var embedRef = { url: url };
      function fallback() {
        callback(embedRef);
        return embedRef;
      }
      function detectNext(i) {
        if (i == embedDetectors.length) return fallback();
        var detectorName = Object.keys(embedTypes)[i];
        //console.log(detectorName, "...");
        embedDetectors[i].detect(url, function (embedRef) {
          //console.log(detectorName, "->", embedRef);
          if (embedRef) {
            embedRef.url = embedRef.url || url;
            embedRef.id =
              embedRef.id ||
              '/' + embedDetectors[i].whydPrefix + '/' + embedRef.videoId;
            embedRef.embedType = embedDetectors[i];
            if (embedDetectors[i].require) {
              // e.g. openwhyd topics need to be queried to the server before rendering
              var timeout = setTimeout(function () {
                //console.log("ContentEmbed: unable to embed from this URL, request timed out")
                callback({
                  error: 'unable to embed from this URL, request timed out',
                });
              }, 2000);
              embedDetectors[i].require(embedRef, function (embedRef) {
                clearTimeout(timeout);
                callback(embedRef);
              });
            } else callback(embedRef); // immediate rendering
            return embedRef; // return the current state of completion of embedRef anyway
          } else return detectNext(i + 1);
        });
      }
      return detectNext(0);
    },
    findLinks: function (text, callback) {
      //console.log("ContentEmbed.findLinks()", text, "...");
      var found = false;
      do {
        var u = generalUrl.exec(text); // get next match
        if (u && u.length > 0) {
          callback(u[0]);
          found = true;
        }
      } while (u != null);
      // TODO: callback if not found?
      return found;
    },
    renderEmbed: function (embedId, options) {
      if (options)
        for (let i in embedDefaults)
          options[i] = options[i] != undefined ? options[i] : embedDefaults[i];
      //console.log("renderEmbed", embedId, options);
      var embedTypeId = embedId.split('/')[1];
      var videoId = embedId.substr(embedId.indexOf('/', 1) + 1);
      return embedTypes[embedTypeId].render(
        { id: embedId, videoId: videoId },
        options
      );
    },
    findTracksInPage: function (title, url, cb) {
      //console.log("contentExtractor...", url, title);
      $.ajax({
        type: 'GET',
        url: '/api/contentExtractor',
        data: { url: url, title: title },
        success: function (r) {
          if (r && r.error) console.log('findTracksInPage error', r.error);
          cb(r);
        },
      });
    },
  };
}

try {
  module.exports = ContentEmbed;
} catch (e) {
  /* do nothing */
}
