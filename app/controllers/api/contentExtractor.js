/**
 * contentExtractor controller (based on contentType controller)
 * Extracts the embedded content in a given http resource
 */
var get = require('../../lib/get');

exports.controller = function (request, reqParams, response) {
  request.logToConsole('contentExtractor.controller', reqParams);

  // make sure a registered user is logged, or return an error page
  var loggedInUser = request.checkLogin(/*response*/);
  if (!loggedInUser) return response.legacyRender({});

  if (!reqParams || !reqParams.url) {
    console.log('contentExtractor: no url provided => returning null');
    return response.legacyRender(null);
  }

  function handleError(err) {
    console.log('contentExtractor error:', err);
    response.legacyRender({ error: err });
  }

  function renderResult(embeds, allEmbeds) {
    function normalize(str) {
      return str.replace(/[^\w]*/gi, '').toLowerCase();
    }

    if (reqParams.title) {
      var title = normalize(reqParams.title);
      console.log('normalized title:', title);
      for (var i in embeds)
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

  var url = reqParams.url;

  try {
    get(url, function (err, page) {
      if (err)
        //throw err;
        console.log('contentExtractor.get() error: ', err, err.stack);
      else
        page.extractEmbeds(function (embeds) {
          // 1) extract named embeds
          var embedRefs = [];
          embeds = embeds || [];
          for (var i in embeds)
            if (embeds[i] && embeds[i].name) embedRefs.push(embeds[i]);
          console.log(
            '-> extracted embeds',
            embedRefs.length,
            ' (skipped',
            embeds.length - embedRefs.length,
            'no-name embeds)'
          );

          // 2) extract mp3
          var mp3 = page.getMp3s();
          if (mp3) {
            console.log('-> extracted mp3', mp3.length);
            for (var i in mp3)
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
        });
    });
  } catch (err) {
    handleError(err);
  }
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
  for (var c = 0; c < n + 1; c++) {
    r[0][c] = c;
  }

  for (var i = 1; i < m + 1; i++) {
    r[i] = [];
    r[i][0] = i;
    for (var j = 1; j < n + 1; j++) {
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
