/**
 * metadataExtractor API controller
 * Tries to scrape track metadata from a given http resource
 */

var snip = require('../../snip.js');
var trackModel = require('../../models/track.js');
var youtubeApi = require('../../models/youtube.js');
var spotifyApi = require('../../models/spotify.js');
var metadataResolver = require('../../models/metadataResolver.js');

function handleUrl(url, render, raw) {
  if (url.indexOf('spotify:track:') == 0)
    spotifyApi.fetchTrackMetadata(url, render, raw);
  else if (url.indexOf('youtube.com') > -1)
    youtubeApi.fetchMetadataFromYoutubePage(url, render);
  else if (url.indexOf('soundcloud.com') > -1)
    metadataResolver.fetchMetadataForEid('/sc/' + url, render);
  else render(new Error('URL is not recognized'));
}

function search(trackMetadata, cb) {
  var res = {};
  var extractors = snip.mapToObjArray(
    metadataResolver.EXTRACTORS,
    'name',
    'api'
  );
  (function next() {
    if (!extractors.length) return cb(null, res);
    var extr = extractors.shift();
    console.log('searching', extr.name, '...');
    metadataResolver.searchBestMatches(extr.api, trackMetadata, function (
      err,
      hits
    ) {
      console.log(extr.name, '=>', err || (hits || [])[0]);
      res[extr.name] = err || (hits || [])[0];
      next();
    });
  })();
}

function monitor(cb) {
  var domains = {};
  for (let i in snip.httpDomains) {
    var domainParts = i.replace(/\\+/g, '').split('.');
    var domainName = domainParts[domainParts.length - 2];
    domains[domainName] = (snip.httpDomains[i][1].queue || []).length;
  }
  trackModel.countTracksWithField('meta', function (err, countMeta) {
    trackModel.countTracksWithField('alt', function (err, countAlt) {
      cb(null, {
        apiQueues: domains,
        tracksWith: {
          meta: countMeta,
          alt: countAlt,
        },
      });
    });
  });
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('metadataExtractor.controller', reqParams);

  // make sure a user is logged, or return an error page
  var loggedInUser = request.checkLogin(response);
  if (!loggedInUser) return; // response.badRequest();

  var isAdmin = request.isAdmin();

  reqParams = reqParams || {};

  function render(err, result) {
    result = result || {};
    if (err) result.error = err.message || err;
    response.legacyRender(
      reqParams.format == 'text' ? JSON.stringify(result, null, 2) : result
    );
  }

  if (reqParams._1 && reqParams._2) {
    var components = ['', reqParams._1, reqParams._2];
    if (reqParams._3)
      // soundcloud eIds contain a third component (/sc/user/title)
      components.push(reqParams._3);
    metadataResolver.fetchMetadataForEid(components.join('/'), render);
  } else if (isAdmin && reqParams.url)
    handleUrl(reqParams.url, render, reqParams.raw);
  else if (isAdmin && reqParams.q) search({ name: reqParams.q }, render);
  else if (isAdmin && reqParams._1 == 'monitor') monitor(render);
  else if (
    isAdmin &&
    (reqParams.name || reqParams.artistName || reqParams.trackTitle)
  )
    search(reqParams, render);
  else {
    response.badRequest();
  }
};

// tests => /controllers/admin/test/metadataExtractor.js
