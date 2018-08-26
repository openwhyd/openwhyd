var assert = require('assert');

describe('hypemachine / mp3 detector', function() {
    var hypem = require('../../app/lib/hypem');

    // Wrapper to a controller that detects embeds (youtube + soundcloud) and MP3 files from a HTML page

    function ContentDetector() {
        console.logBackup = console.log;
        var controller = require('../../app/controllers/api/contentExtractor.js')
            .controller;
        var fakeRequest = {
            logToConsole: function() {},
            checkLogin: function() {
                return { id: 1, name: 'fake' };
            }
        };
        return {
            detect: function(url, title, cb) {
                var params = { url: url };
                if (title) params.title = title;
                console.log = function() {}; // prevent controller from writing to stdout
                controller(fakeRequest, params, {
                    render: function(r) {
                        console.log = console.logBackup; // restore console.log
                        cb(r);
                    }
                });
            }
        };
    }

    // Tests

    function objToArray(results) {
        var array = [];
        for (var i in results) array.push(results[i]);
        return array;
    }

    function genSearchTest(q) {
        it('finds a match on hypemachine from the title "' + q + '"', function(
            done
        ) {
            //console.log('(hypem.search) query:', q, '...');
            hypem.search(q, function(err, results) {
                assert.ifError(err);
                assert(objToArray(results).length);
                done();
            });
        });
    }

    function genSearchMp3Test(q) {
        it('finds a mp3 file from the title "' + q + '"', function(done) {
            //console.log('(hypem.searchMp3s) query:', q, '...');
            hypem.searchMp3s(q, function(err, results) {
                assert.ifError(err);
                assert(objToArray(results).length);
                done();
            });
        });
    }

    function genExtractMp3Test(url, title) {
        it('extracts the mp3 file from ' + url, function(done) {
            //console.log('(hypem.getMp3FromPostUrl) ', {url:url, title:title}, '...');
            hypem.getMp3FromPostUrl(url, title, function(err, mp3) {
                assert.ifError(err);
                assert(mp3);
                done();
            });
        });
    }

    function genDetectTracksTest(url, title) {
        it('detects title of ' + url, function(done) {
            new ContentDetector().detect(url, title, function(r) {
                assert(r && r.embeds && r.embeds.join && r.embeds.length);
                //console.log("First result: ", r.embeds[0]);
                done();
            });
        });
    }

    // run tests

    /*
	genSearchTest('metronomy');
	genSearchMp3Test('metronomy');
	genExtractMp3Test('http://8106.tv/blog/2012/04/06/elegancia-presentado-por-smirnoff/', 'The Bay');
	genDetectTracksTest('http://8106.tv/blog/2012/04/06/elegancia-presentado-por-smirnoff/');
	genDetectTracksTest('http://8106.tv/blog/2012/04/06/elegancia-presentado-por-smirnoff/', 'The Bay');
	genDetectTracksTest('http://bib-on-the-sofa.blogspot.fr/2012/09/metronomy-tens-and-tens-theatre-of.html', 'Metronomy - Tens And Tens'); // one soundcloud embeds
	genDetectTracksTest('http://musicunderfire.com/2012/09/new-music-releases-for-tuesday-9252012.html', 'Metronomy - Corinne'); // multiple soundcloud embeds
	genDetectTracksTest('http://audioporncentral.com/2012/09/metronomy-hypnose-late-night-tales.html', 'Metronomy - Hypnose'); // one vimeo and 1 soundcloud embed
	*/
    genDetectTracksTest(
        'http://www.deadhorsemarch.com/video-metronomy-everything-goes-my-way-6-5-12/' /*, 'Metronomy – “Everything Goes My Way”'*/
    ); // 1 youtube video embed
    genDetectTracksTest(
        'http://www.deadhorsemarch.com/video-metronomy-everything-goes-my-way-6-5-12/',
        'Metronomy – “Everything Goes My Way”'
    ); // 1 youtube video embed

    // TODO: fix hypem module => re-enable all test cases
});
