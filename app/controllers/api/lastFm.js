/**
 * lastFm API controller
 * called back from last.fm when connecting account (for scrobbling, from settings page)
 * @author adrienjoly, whyd
 */

const crypto = require('crypto');
const querystring = require('querystring');

const userModel = require('../../models/user.js');
const snip = require('../../snip.js');
const uiSnip = require('../../templates/uiSnippets.js');

if (process.env['LAST_FM_API_KEY'] === undefined)
  throw new Error(`missing env var: LAST_FM_API_KEY`);
if (process.env['LAST_FM_API_SECRET'] === undefined)
  throw new Error(`missing env var: LAST_FM_API_SECRET`);

const API_KEY = process.env.LAST_FM_API_KEY;
const API_SECRET = process.env.LAST_FM_API_SECRET;

const API_HOST = 'ws.audioscrobbler.com';
const API_PREFIX = '/2.0/';

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function LastFM(apiKey, apiSecret) {
  // http://www.lastfm.fr/api/webauth
  function sign(p) {
    p.api_key = apiKey;
    const keys = Object.keys(p);
    keys.sort();
    let chain = '';
    for (const i in keys) chain += keys[i] + p[keys[i]];
    p.api_sig = md5(chain + apiSecret);
    return p;
  }

  this.submitRequest = function (p, options = {}, cb) {
    options.responseEncoding = 'utf-8';

    p.api_key = apiKey;
    p.format = 'json';

    let path = 'http://' + API_HOST + API_PREFIX;
    const body = querystring.stringify(p);

    if ((options.method || '').toLowerCase() == 'post') {
      options.body = body;
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Content-Length': body.length,
      };
    } else path += '?' + body;

    console.log('[lastFm] submitting to ' + path + '...');

    snip.httpRequestJSON(path, options, function (err, data) {
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
      },
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
      },
    );
  };

  // http://www.lastfm.fr/api/show/track.updateNowPlaying
  this.updateNowPlaying = function (data, cb) {
    data.method = 'track.updateNowPlaying';
    this.submitRequest(sign(data), { method: 'POST' }, cb);
  };

  this.updateNowPlaying2 = function (post, lastFmSessionKey, cb) {
    post = post || {};
    const splitted = ('' + post.name).split(' - ');
    if (lastFmSessionKey && splitted.length > 1) {
      const scrobbleData = {
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
    cb,
  ) {
    const splitted = (trackName || '').split(' - ');
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
        cb,
      );
    else if (cb) cb({ error: 'unable to scrobble track' });
  };
}

exports.lastFm = new LastFM(API_KEY, API_SECRET);

exports.controller = async function (request, p, response) {
  request.logToConsole('api.lastFm.controller', p);
  p = p || {};

  const loggedUser = await request.checkLogin(response);
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
          ');</script>',
      );
    };
    exports.lastFm.fetchSession(p.token, function (session) {
      if (session) {
        const userUpdate = {
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
