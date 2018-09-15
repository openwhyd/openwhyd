var get = require('../get');

var HYPEM_SEARCH_URL = 'http://hypem.com/playlist/search/QUERY/json/1/data.js';
var NB_RESULTS_PER_PAGE = 20;
var TIME_OUT = 3000;

//==============================================================================
exports.search = function(query, callback) {
  get(HYPEM_SEARCH_URL.replace('QUERY', encodeURI(query)), function(err, page) {
    var data;
    if (err) {
      callback(err, null);
    } else {
      try {
        data = JSON.parse(page.text);
        if (data) delete data.version;
        callback(null, data);
      } catch (e) {
        callback(e);
      }
    }
  });
};

//==============================================================================
exports.searchMp3s = function(query, callback) {
  get(HYPEM_SEARCH_URL.replace('QUERY', encodeURI(query)), function(err, page) {
    var count = 0;
    var mp3s = [];
    var data, i, callbackCalled;

    function getMp3(data) {
      count++;
      get
        .Mp3s(data.posturl, function(err, mp3Urls) {
          if (!err && mp3Urls.length > 0) {
            for (var i = 0, url; (url = mp3Urls[i]); i++) {
              if (url.endsWith(encodeURI(data.title) + '.mp3')) {
                data.mp3 = url;
                mp3s.push(data);
              }
            }
          }
          if (--count <= 0) {
            !callbackCalled && callback(null, mp3s);
            callbackCalled = true;
          }
        })
        .setTimeout(TIME_OUT, function() {
          try {
            this.abort();
          } catch (e) {
            console.log(e.stack);
          }
          if (--count <= 0) {
            !callbackCalled && callback(null, mp3s);
          }
          callbackCalled = true;
        });
    }

    if (err) {
      callback(err);
    } else {
      data = JSON.parse(page.text);
      for (i = 0; i < NB_RESULTS_PER_PAGE; i++) {
        if (data[i]) getMp3(data[i]);
      }
    }
  });
};

//==============================================================================
exports.getMp3FromPostUrl = function(postUrl, title, callback) {
  get.Mp3s(postUrl, function(err, mp3s) {
    if (err) {
      callback(err, null);
    } else {
      for (var i = 0, mp3; (mp3 = mp3s[i]); i++) {
        if (mp3.endsWith(encodeURI(title) + '.mp3')) {
          callback(null, mp3);
          return;
        }
      }
      callback(null, null);
    }
  });
};

//==============================================================================
String.prototype.endsWith =
  String.prototype.endsWith ||
  function(str) {
    var len = this.length;
    if (str && str.length > len) return false;
    return this.substring(len - str.length, len) === str;
  };
