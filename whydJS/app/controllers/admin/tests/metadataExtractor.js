/**
 * metadataExtractor API tester
 */

var EventEmitter = require('events').EventEmitter
var metadataResolver = require('../../../models/metadataResolver.js')

var TESTS = (function () {
  var tests = {}
  function hasFields () {
    var fields = arguments
    // no argument is passed to cb() if at least one of the criteria is not met
    return function (p, cb) {
      console.log('hasfields?', fields)
      for (var i = fields.length - 1; i >= 0; --i) {
        var mapping = p.mappings[metadataResolver.SOURCES[fields[i]]]
        // console.log(fields[i], metadataResolver.SOURCES[fields[i]], mapping.c);
        if (!mapping || mapping.c < 0.1) { return cb() }
      }
      cb(true)
    }
  }
  function compileTest (test) {
    tests[this + ' test: ' + test[1]] = function (p, ee, cb) {
      metadataResolver.fetchMetadataForEid(test[0], function (err, track) {
        ee.emit('log', '  => metadata: [', track.metadata.artistName, '] - [', track.metadata.trackTitle, ']')
        for (var s in track.mappings) { ee.emit('log', '  => mapping: /' + s + '/' + track.mappings[s].id, '(' + Math.floor(track.mappings[s].c * 100) + '%)') }
        test[2](track, cb)
      })
    }
  }
  [ // youtube
    ['/yt/ijZRCIrTgQc', 'REM - everybody hurts', hasFields('youtube', 'soundcloud')], // cofidence of echonest-based results is too low (for now)
    ['/yt/lfC1qFpskyg', 'emilie simon - dreamland', hasFields('youtube', 'spotify', 'deezer', 'isrc')],
    ['/yt/pco91kroVgQ', 'Lady Gaga - Applause (thru youtube meta)', hasFields('youtube', 'spotify')], // echonest OK, but no Deezer mapping
    ['/yt/6yDEYu61piI', 'Maître Gims (utf-8 accents)', hasFields('youtube', 'soundcloud')], // nothing from echonest...
    ['/yt/uRyEG-Cmqwo', "Eazy-E - Real Muthaphuckkin G's (quotes in title)", hasFields('youtube', 'spotify', 'deezer', 'isrc')],
    ['/yt/agAp3Zp5d9A', 'man is not a bird', hasFields('youtube', 'spotify', 'deezer', 'isrc')] //  => no metadata
  ].map(compileTest.bind('youtube'));
  [ // spotify
    ['/sp/6NmXV4o6bmp704aPGyTVVG', 'Kaizers Orchestra - Bøn Fra Helvete (Live)', hasFields('spotify', 'deezer', 'isrc')]
  ].map(compileTest.bind('spotify'));
  [ // soundcloud
    ['/sc/johnny_ripper/imaginary-friend', 'johnny_ripper - imaginary friend', hasFields('soundcloud')],
    ['/sc/m83/midnight-city', 'm83 - midnight city', hasFields('soundcloud', 'spotify', 'deezer', 'isrc')]
  ].map(compileTest.bind('soundcloud'))
  return tests
})()

function translateTests (tests) {
  var arr = [], p = {}, ee = new EventEmitter()
  ee.on('log', console.log.bind(console))
  for (var name in tests) { arr.push([name, tests[name].bind(tests, p, ee/*, cb */)]) }
  return arr
}

/*
var TestRunner = require("../../../serverTestRunner.js").ServerTestRunner;
var testRunner = new TestRunner().addTests(TESTS);
*/

exports.makeTests = function (p) {
  return [
    /*
		["worker requests calls back exactly once", function(cb){
			var count = 0;
			metadataResolver.fetchMetadataForEid("/yt/7vlElmIWmNo", function(err, track){
				++count;
			});
			setTimeout(function(){
				cb(count == 1);
			}, 5000);
		}],
		*/
  ].concat(translateTests(TESTS))
}

// tests
// http://localhost:8080/api/metadataExtractor?format=text&url=http://www.youtube.com/watch?v=ijZRCIrTgQc => REM - everybody hurts => echonest OK
// http://localhost:8080/api/metadataExtractor?format=text&url=spotify:track:6NmXV4o6bmp704aPGyTVVG => Kaizers Orchestra - Bøn Fra Helvete (Live)
// http://localhost:8080/api/metadataExtractor?format=text&url=https://soundcloud.com/johnny_ripper/imaginary-friend
// http://localhost:8080/api/metadataExtractor/sc/73035648?format=text

// http://localhost:8080/api/metadataExtractor?format=text&q=stromae%20formidable
// http://localhost:8080/api/metadataExtractor?format=text&artistName=stromae&trackTitle=formidable
