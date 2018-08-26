var assert = require('assert');

describe('Content Embed', function() {
  // DEPRECATION NOTICE: TRACK DETECTION CODE AND TEST SUITE HAS MOVED AND IS MAINTAINED BY PLAYEMJS PROJECT

  var log = console.log;

  var ContentEmbedWrapper = require('../../app/lib/get').ContentEmbedWrapper;
  var embed = new ContentEmbedWrapper();

  // from https://github.com/whyd/whyd/wiki/Tests

  var vimeoUrls = ['http://vimeo.com/8020959'];

  var dailymotionUrls = [
    'http://www.dailymotion.com/video/xmsihw_presidentielle-2012-le-programme-de-francois-asselineau-president-de-l-upr-1-10_news#from=embediframe'
  ];

  var soundcloudUrls = [
    /*
        "http://soundcloud.com/8bitsongs/lights-drive-my-soul-8-bit",
        "http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F53867958&auto_play=false&show_artwork=false&color=00b4ff",
        "http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F53867958",
        "http://snd.sc/XNy3e9", // short url
        */
    'http://soundcloud.com/wildbelle/keep-you', // supposed not to be embeddable, according to oembed API (status code 403)
    'https://soundcloud.com/wildbelle/keep-you'
  ];

  // from playem tests
  var youtubeUrls = [
    'http://youtu.be/LHcP4MWABGY',
    'http://www.youtube.com/v/c3sBBRxDAqk',
    'https://www.youtube.com/v/c3sBBRxDAqk',
    'http://www.youtube.com/embed/c3sBBRxDAqk',
    'http://www.youtube.com/watch?v=Xdbt-0B864k',
    'http://www.youtube.com/watch?v=dDt5RuxIg-U',
    'http://www.youtube.com/watch?v=Bx2guCyfLXo&feature=share',
    'http://www.youtube.com/watch?feature=share&v=Bx2guCyfLXo',
    'http://www.youtube.com/watch?feature=player_embedded&v=EXFhuAbYXBk',
    'https://www.youtube.com/watch?feature=player_embedded&v=rGKfrgqWcv0#!', // tistou: fails with bookmarklet when clicking on the youtube logo from a facebook embed
    'http://www.youtube.com/watch?v=rGKfrgqWcv0&feature=share'
  ];

  var mp3Urls = [
    "http://popdose.com/digging-for-gold-the-time-life-am-gold-series-part-55/#http://earbuds.popdose.com/thechrisholmes/tuneage/amgold/1975/16 (Hey Won't You Play) Another Some.mp3",
    //	"http://popdose.com/digging-for-gold-the-time-life-am-gold-series-part-55/", // blog page that embeds an mp3 file
    "http://earbuds.popdose.com/thechrisholmes/tuneage/amgold/1975/16 (Hey Won't You Play) Another Some.mp3" // actual mp3 file
  ];

  var bandcampUrls = [
    'https://bienatoi.bandcamp.com/track/noyade-noyade', // cover art to be fetched from album
    'http://manisnotabird.bandcamp.com/track/the-sound-of-spring'
  ];

  // pages avec MP3:
  // http://klubbace.se/2012/09/24261/
  // http://www.html5tutorial.info/html5-audio.php

  []
    .concat(
      youtubeUrls,
      soundcloudUrls,
      vimeoUrls,
      //dailymotionUrls,
      //bandcampUrls,
      mp3Urls
    )
    .forEach(function(url) {
      it('should recognize ' + url, function(done) {
        console.log = function() {}; // prevent ContentEmbed from printing to the console
        embed.extractEmbedRef(url, function(embedRef) {
          console.log = log; // restore console.log
          assert(!!embedRef, 'a result must be provided');
          assert.ifError(embedRef.error);
          assert(!!embedRef.id, 'result must have a non-null id');
          done();
        });
      });
    });
});

// Webdriver API documentation: http://webdriver.io/api.html
