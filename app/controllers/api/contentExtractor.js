/**
 * contentExtractor controller (based on contentType controller)
 * Extracts the embedded content in a given http resource
 */
var path = require('path');
var get = require('../../lib/get');

var BASE_REG = /<base[^<>]+href\s*=\s*"([^"]*)"[^<>]*>/;
var MP3_REG = /<a\s+[^<>]*href\s*=\s*"[^"]*\.mp3"/gi;
var MP3_URL_REG = /<a\s+[^<>]*href\s*=\s*"([^"]*\.mp3)"/i;

function getMp3s() {
  var mp3s = this.text.match(MP3_REG) || [];
  var mp3sUniq = [];
  var base = BASE_REG.test(this.text) ? RegExp.$1 : null;
  var i, len, mp3;
  for (i = 0, len = mp3s.length; i < len; i++) {
    mp3 = mp3s[i].match(MP3_URL_REG)[1];
    if (mp3.substr(0, 7) !== 'http://') {
      if (base) mp3 = path.normalize(base + '/' + mp3);
      else
        mp3 =
          'http://' +
          path.normalize(
            mp3.charAt(0) === '/'
              ? this.host + '/' + mp3
              : this.host + '/' + this.path + '/' + mp3
          );
    }
    mp3s[i] = mp3;
  }
  for (const mp3 of mp3s) {
    if (mp3sUniq.indexOf(mp3) === -1) mp3sUniq.push(mp3);
  }
  return mp3sUniq;
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('contentExtractor.controller', reqParams);

  // make sure a registered user is logged, or return an error page
  var loggedInUser = request.checkLogin(/*response*/);
  if (!loggedInUser) return response.legacyRender({});

  if (!reqParams || !reqParams.url) {
    console.log('contentExtractor: no url provided => returning null');
    return response.legacyRender(null);
  }

  function renderResult(embeds, allEmbeds) {
    function normalize(str) {
      return str.replace(/[^\w]*/gi, '').toLowerCase();
    }

    if (reqParams.title) {
      var title = normalize(reqParams.title);
      console.log('normalized title:', title);
      for (let i in embeds)
        if (embeds[i].name)
          embeds[i].distance = levenshteinenator(
            normalize(embeds[i].name),
            title
          );
      embeds.sort(function (a, b) {
        return a.distance - b.distance;
      });
    }

    //console.log("contentExtractor embeds:", embeds);
    response.legacyRender({ embeds: embeds, allEmbed: allEmbeds });
  }

  get(reqParams.url, function (err, page) {
    if (err) {
      console.log('contentExtractor.get() error: ', err, err.stack);
      response.legacyRender({ error: err });
    } else {
      const embeds = [];
      const embedRefs = [];
      var mp3 = getMp3s.bind(page)();
      if (mp3) {
        console.log('-> extracted mp3', mp3.length);
        for (let i in mp3)
          embedRefs.push({
            type: 'mp3 file',
            url: mp3[i],
            name: mp3[i]
              .split('/')
              .pop()
              .replace(/\.mp3$/i, ''),
          });
      }
      renderResult(embedRefs, embeds);
    }
  });
};

/*

Copyright (c) 2006. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

// return the smallest of the three values passed in
var minimator = function (x, y, z) {
  if (x < y && x < z) return x;
  if (y < x && y < z) return y;
  return z;
};

// calculate the Levenshtein distance between a and b
var levenshteinenator = function (a, b) {
  var cost;

  var m = a.length;
  var n = b.length;

  // make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
  if (m < n) {
    var c = a;
    a = b;
    b = c;
    var o = m;
    m = n;
    n = o;
  }

  var r = [];
  r[0] = [];
  for (let c = 0; c < n + 1; c++) {
    r[0][c] = c;
  }

  for (let i = 1; i < m + 1; i++) {
    r[i] = [];
    r[i][0] = i;
    for (let j = 1; j < n + 1; j++) {
      cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
      r[i][j] = minimator(
        r[i - 1][j] + 1,
        r[i][j - 1] + 1,
        r[i - 1][j - 1] + cost
      );
    }
  }

  return r[m][n];
};
