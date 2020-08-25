var deezerFallback = (function () {
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/gm, '');
    };
  }

  function normalize(str) {
    return !str
      ? ''
      : str
          .toLowerCase()
          .replace(/[àâä]/gi, 'a')
          .replace(/[éèêë]/gi, 'e')
          .replace(/[îï]/gi, 'i')
          .replace(/[ôö]/gi, 'o')
          .replace(/[ùûü]/gi, 'u')
          .split(/[\s\+]+/g);
  }

  function parseTrack(track) {
    if (/(.+)\-(.+)/.test(track)) {
      var artist = RegExp.$1,
        title = RegExp.$2;
      return {
        artist: normalize(artist.trim()),
        title: normalize(title.trim()),
      };
    }
  }

  // by http://andrew.hedges.name
  var levenshteinenator = (function () {
    function minimator(x, y, z) {
      if (x < y && x < z) return x;
      if (y < x && y < z) return y;
      return z;
    }
    return function (a, b) {
      var cost,
        m = a.length,
        n = b.length;
      if (m < n) {
        var c = a;
        a = b;
        b = c;
        var o = m;
        m = n;
        n = o;
      }
      var r = new Array();
      r[0] = new Array();
      for (var c = 0; c < n + 1; c++) r[0][c] = c;
      for (var i = 1; i < m + 1; i++) {
        r[i] = new Array();
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
  })();

  function matcher(track) {
    var artist = track.artist.join('+'),
      title = track.title.join('+');
    return function (dzTrack) {
      var dzArtist = normalize(dzTrack.artist.name).join('+'),
        dzTitle = normalize(dzTrack.title).join('+');
      return {
        track: dzTrack,
        rank: dzArtist == artist ? levenshteinenator(title, dzTitle) : 99999,
      };
    };
  }

  function rankSort(a, b) {
    return a.rank - b.rank;
  }

  function deezerSearch(track, cb) {
    track = parseTrack(track);
    if (track) {
      var rank = matcher(track);
      DZ.api('/search?q=' + track.title.join('+'), function (response) {
        var results = (response.data || []).map(rank).sort(rankSort);
        cb(
          results.length && results[0].rank < 5 ? results.shift() : null,
          results
        );
      });
    } else {
      cb(null);
    }
  }

  return function (track, cb) {
    setTimeout(function (track, cb) {
      deezerSearch(track, cb);
    }, 1000);
  };
})();

/* how to use in whydplayer:

	function replaceTrackWith(currentIndex, track, cb){
		playem.addTrackByUrl(track.link, currentTrack.metadata, function() {
			var queue = playem.getQueue();
			var altTrack = queue[currentIndex] = queue.pop();
			altTrack.index = currentIndex;
			cb(altTrack);
		});
	}
	
	var playemEventHandlers = {
		onError: function(e) {
			e = e || {};
			var logData = {};
			if (currentTrack.metadata.logData)
				logTrackPlay();
			var logData = {
				err: e // TODO: check that format is correct
			};
			// fallback failing tracks to deezer player
			var currentIndex = currentTrack.index;
			deezerFallback($(currentTrack.metadata.title).text(), function(track){
				if (track) {
					replaceTrackWith(currentIndex, track, function(altTrack){
						var fbk = {
							eId: "/dz/" + altTrack.trackId,
						};
						if (altTrack.player.isLogged())
							fbk.dCo = true;
						// TODO: add fbk.dPm if it's a deezer premium account
						altTrack.metadata.logData = {
							err: logData.err,
							fbk: fbk,
						};
						playTrack(currentIndex); // logData will be submitted when onPlay or onError is received
					});
				} else {
					window.showMessage && showMessage('We\'re unable to play <a href="'+currentTrack.metadata.url+' target="_blank">that track</a>, sorry...', true);
					logData.fbk = {
						track: track,
						code: -1 // track not found
					};
					currentTrack.metadata.logData = logData;
					logTrackPlay();
					playem.next();
				}
			});
		},

*/
