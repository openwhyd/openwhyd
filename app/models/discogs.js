var querystring = require('querystring');
var snip = require('../snip.js');

var SCRAPING_HTTP_OPTIONS = {
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4',
    Accept: 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
  },
};

function queryDiscogs(p, cb) {
  var url =
    'http://api.discogs.com/database/search?' + querystring.stringify(p || {});
  return snip.httpRequestJSON(url, SCRAPING_HTTP_OPTIONS, cb);
}

var SEARCH_FIELD_MAPPING = {
  artistName: 'artist',
  trackTitle: 'release_title',
};

function searchTracks(p, cb) {
  p = snip.filterFields(p || {}, SEARCH_FIELD_MAPPING);
  queryDiscogs(p, cb);
}

// searchTracks({trackTitle:"the monster", artistName:"eminem"}, console.log); // => works but no isrc

exports.searchTracks = searchTracks;
