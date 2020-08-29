/**
 * lastFm API controller
 * called back from last.fm when connecting account (for scrobbling, from settings page)
 * @author adrienjoly, whyd
 */

var crypto = require('crypto');
var querystring = require('querystring');

var userModel = require('../../models/user.js');
var snip = require('../../snip.js');
var uiSnip = require('../../templates/uiSnippets.js');

var API_KEY = process.env.LAST_FM_API_KEY.substr();
var API_SECRET = process.env.LAST_FM_API_SECRET.substr();

var API_HOST = 'ws.audioscrobbler.com';
var API_PREFIX = '/2.0/';

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function LastFM(apiKey, apiSecret) {
  // http://www.lastfm.fr/api/webauth
  function sign(p) {
    p.api_key = apiKey;
    var keys = Object.keys(p);
    keys.sort();
    var chain = '';
    for (let i in keys) chain += keys[i] + p[keys[i]];
    p.api_sig = md5(chain + apiSecret);
    return p;
  }

  this.submitRequest = function (p, options = {}, cb) {
    options.responseEncoding = 'utf-8';

    p.api_key = apiKey;
    p.format = 'json';

    var path = 'http://' + API_HOST + API_PREFIX;
    var body = querystring.stringify(p);

    if ((options.method || '').toLowerCase() == 'post') {
      options.body = body;
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Content-Length': body.length,
      };
    } else path += '?' + body;

    console.log('submitting ' + path + ' request to last.fm ...', options);

    snip.httpRequestJSON(path, options, function (err, data) {
      //console.log("-> last.fm response status code", (res || {}).statusCode)
      cb(data || err);
    });
  };

  // http://www.lastfm.fr/api/show/auth.getSession
  // Note: "Session keys have an infinite lifetime by default. You are recommended to store the key securely."
  this.fetchSession = function (token, cb) {
    this.submitRequest(
      sign({
        method: 'auth.getSession',
        token: token,
      }),
      {},
      function (res) {
        cb((res || {}).session);
      }
    );
  };

  // http://www.lastfm.fr/api/show/user.getInfo
  this.getUserInfo = function (handle, cb) {
    this.submitRequest(
      {
        method: 'user.getinfo',
        user: handle,
      },
      {},
      function (res) {
        cb && cb((res || {}).user);
      }
    );
  };

  // http://www.lastfm.fr/api/show/track.updateNowPlaying
  this.updateNowPlaying = function (data, cb) {
    data.method = 'track.updateNowPlaying';
    this.submitRequest(sign(data), { method: 'POST' }, cb);
  };

  this.updateNowPlaying2 = function (post, lastFmSessionKey, cb) {
    post = post || {};
    var splitted = ('' + post.name).split(' - ');
    if (lastFmSessionKey && splitted.length > 1) {
      var scrobbleData = {
        sk: lastFmSessionKey,
        artist: splitted[0], //"Man is not a Bird", //"Finnebassen", //"Maybeshewill",
        track: splitted[1], //"Bringer of rain and seed" //"Touching Me (Original Mix)" //"Opening"
      };
      if (post.duration) scrobbleData.duration = parseInt(post.duration);
      this.updateNowPlaying(scrobbleData, cb);
    } else if (cb) cb();
  };

  // http://www.lastfm.fr/api/scrobbling
  this.scrobble = function (data, cb) {
    data.method = 'track.scrobble';
    this.submitRequest(sign(data), { method: 'POST' }, cb);
  };

  this.scrobble2 = function (
    trackName,
    lastFmSessionKey,
    chosenByUser,
    timestamp,
    cb
  ) {
    var splitted = (trackName || '').split(' - ');
    if (lastFmSessionKey && splitted.length > 1)
      this.scrobble(
        {
          //method: "track.scrobble",
          sk: lastFmSessionKey,
          artist: splitted[0],
          track: splitted[1],
          timestamp: timestamp,
          chosenByUser: !!chosenByUser,
        },
        cb
      );
    else if (cb) cb({ error: 'unable to scrobble track' });
  };
}

exports.lastFm = new LastFM(API_KEY, API_SECRET);

exports.controller = function (request, p, response) {
  request.logToConsole('api.lastFm.controller', p);
  p = p || {};

  var loggedUser = request.checkLogin(response);
  if (!loggedUser) return;

  if (p.token) {
    const render = (message, _session) => {
      const session = _session
        ? JSON.stringify({
            sk: session.key,
            name: uiSnip.htmlEntities(session.name),
          })
        : '';
      console.log('rendering lastfm session for callback', message, session);
      response.renderHTML(
        message +
          '<script>window.opener.lastFmCallback(' +
          session +
          ');</script>'
      );
    };
    exports.lastFm.fetchSession(p.token, function (session) {
      if (session) {
        var userUpdate = {
          id: loggedUser.id,
          lastFm: {
            sk: session.key,
            name: session.name,
          },
        };
        userModel.save(userUpdate, function () {
          render('Yeah!', session);
        });
      } else render('Unable to connect openwhyd to last.fm. Please try again!');
    });
  }
};
