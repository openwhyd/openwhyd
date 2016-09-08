console.log("[ADRIEN] welcome, adrien!");

// by http://andrew.hedges.name
var levenshteinenator = (function(){
	function minimator(x,y,z) {
		if (x < y && x < z) return x;
		if (y < x && y < z) return y;
		return z;
	}
	return function(a, b) {
		var cost, m = a.length, n = b.length;
		if (m < n) {
			var c=a;a=b;b=c;
			var o=m;m=n;n=o;
		}
		var r = new Array(); r[0] = new Array();
		for (var c = 0; c < n+1; c++) r[0][c] = c;
			for (var i = 1; i < m+1; i++) {
				r[i] = new Array(); r[i][0] = i;
				for (var j = 1; j < n+1; j++) {
					cost = (a.charAt(i-1) == b.charAt(j-1))? 0: 1;
					r[i][j] = minimator(r[i-1][j]+1,r[i][j-1]+1,r[i-1][j-1]+cost);
				}
			}
			return r[m][n];
	}
})();

function transformEchonestResults(cb){
	return function(res){
		var firstResult = (res.response.songs || [])[0] || {};
		//console.log("first result", firstResult);
		var meta = {
			trackTitle: firstResult.title,
			artistName: firstResult.artist_name,
			artistId: firstResult.artist_foreign_ids.map(function(f){return f.foreign_id;}),//((firstResult.artist_foreign_ids || [])[0] || {}).foreign_id,
			trackId: firstResult.tracks.map(function(f){return f.foreign_id;}),//firstTrack.foreign_id,
			albumId: firstResult.tracks.map(function(f){return f.foreign_release_id;}),//firstTrack.foreign_release_id,
			albumName: firstResult.tracks.map(function(f){return f.album_name;}),//firstTrack.album_name,
		};
		cb(meta);
	};
}

function queryEchonest(q, cb){
	var finalQ = {
		api_key: "THPZEU9N7TCVO7CAH",
		format: "jsonp",
		limit: true, // limit results to catalog specified by `sourceId`
		//bucket: ["id:deezer", "tracks"],
		//callback: "?"
	};
	for (var i in q)
		finalQ[i] = q[i];
	$.getJSON("http://developer.echonest.com/api/v4/song/search?bucket=id%3Adeezer&bucket=id:spotify-WW&bucket=tracks&callback=?", finalQ, cb);
}

function getForeignId(artist, title, cb){
	queryEchonest({
		artist: artist,
		title: title,
	}, transformEchonestResults(cb));
}

function searchForeignId(q, cb){
	queryEchonest({
		combined: q,
	}, transformEchonestResults(cb));
}

function filterForeignIds(ids, prefix){
	var out = [];
	ids.map(function(id){
		var splitted = id.split(":");
		if (splitted.shift().indexOf(prefix) == 0)
			out.push(splitted.pop());
	});
	return out;
}

var trackFetcher = {
	deezer: function(trackId, cb){
		$.getJSON("http://api.deezer.com/track/" + trackId + "?output=jsonp&callback=?", function(res){
			cb({
				artistName: res.artist.name,
				trackTitle: res.title,
			});
		});
	},
	spotify: function(trackId, cb){
		$.getJSON("/api/metadataExtractor?url=spotify:track:" + trackId, cb);
	},
};

function pickBestForeignTracks(meta, source, cb){
	console.log("pick best", source, "track for:", meta.artistName, "-", meta.trackTitle);
	var trackIds = filterForeignIds(meta.trackId, source);
	(function next(i){
		if (i<0) {
			cb(trackIds.sort(function(a, b){
				return a.distance - b.distance;
			}));
			return;
		}
		var trackId = trackIds[i];
		//console.log("source", trackId, "...");
		trackFetcher[source](trackId, function(res){
			var distance = levenshteinenator(meta.artistName, res.artistName)
				+ levenshteinenator(meta.trackTitle, res.trackTitle);
			//console.log("("+distance+")", res.artistName, "-", res.trackTitle);
			res.trackId = trackId;
			res.distance = distance;
			trackIds[i] = res;
			next(i-1);
		});
	})(trackIds.length-1);
}
/*
// test that the first foreign result is the closest match to the track's name
(function testBestForeignMatch(trackName, source){
	searchForeignId(trackName, function(meta){
		pickBestForeignTracks(meta, source, function(bestTracks){
			var lowestDistance = 0;
			bestTracks.map(function(track){
				console.log(track);
				if (track.distance >= lowestDistance)
					lowestDistance = track.distance;
				else
					throw new Error("best match is not first");
			})
		});
	});
})("LIGHTS - Cactus In The Valley Acoustic [Lyric Video]", "spotify");
*/
// = = = = = = = = = = = = 

function trackCss() {

	var target = document.querySelectorAll('.newComment *');

	console.log("observing", target.length, "elements");

	var MutationObserver = window.WebKitMutationObserver;
	var observer = new MutationObserver(function(mutations) {
	  mutations.forEach(function(mutation) {
	  	if (mutation.attributeName=="style")
	  		console.log(mutation.target, mutation.oldValue, "=>", mutation.target.style.cssText);
	    //console.log('old', mutation.oldValue);
	    //console.log('new', mutation.target.style.cssText);
	  });
	});

	var config = { attributes: true, attributeOldValue: true }
	//observer.observe(target, config);
	for (var i=0; i<target.length; ++i)
		observer.observe(target[i], config);

}

function coucou() {
	/*
	function appendLastfmBtn() {
		$('<div>get last fm tags</div>').click(function(){
			$.post("/api/post", {
				action: "scrobble",
				pId: currentTrack.metadata.pid,
				trackDuration: currentTrack.trackDuration,
				timestamp: Math.floor(currentTrack.metadata.tStart.getTime() / 1000)
			}, function(res) {
				console.log("scrobbled to last.fm, baby!", res);
			});				
		}).appendTo(this);
	}
	*/
	function padZeroes(t, n) {
		var t = ""+t;
		for (var i=Math.min(t.length, n-t.length); i > 0; --i)
			t = "0" + t;
		return t;
	}

	function renderDate(t) {
		return padZeroes(t.getDate(),2) + "/" + padZeroes(t.getMonth()+1,2) + "/" + t.getFullYear()
				+ " " + padZeroes(t.getHours(),2) + ":" + padZeroes(t.getMinutes(),2);
	}
	/*
	function renderEidUrl(eId) {
		return 	eId
			.replace("/yt/", window.location.protocol+"//youtube.com/v/")
			.replace("/sc/", window.location.protocol+"//soundcloud.com/")
			.replace("/vi/", window.location.protocol+"//vimeo.com/");
	}
	*/
	function displayHiddenTrackData() {
		var $post = $(this);
		var t = new Date(parseInt($post.attr("data-time")));
		//var url = $post.find("[href]").first().attr("href");
		$post.append(
			$("<div style='position:absolute; top:0px; right:0px; color:#A5ACB1; font-size:10px;'>")
			.append($("<a >")/*.attr("href", url)*/.text(renderDate(t)))
			.append($("<div class='score'>score: " + $post.attr("data-score") + "</div>"))
		);
	}

	function logMatches(meta){
		console.log("-> all track matches:", meta);
		function log(a){
			console.log(a);
		}
		pickBestForeignTracks(meta, "deezer", function(best){
			console.log(" === deezer results")
			best.map(log);
		});
		pickBestForeignTracks(meta, "spotify", function(best){
			console.log(" === spotify results")
			best.map(log);
		});
	}

	function displayTrackMetadata(elt){
		var $elt = $(elt);
		var eid = $elt.find(".thumb").attr("data-eid");
		console.log("display metadata", eid);
		$.getJSON("/api/track" + eid, function(res){
			if (res && res.meta) {
				$elt.append($("<p>").text(JSON.stringify(res.meta)));
				$elt.append($("<button>lookup with deezer</button>").click(function(){
					getForeignId(res.meta.art, res.meta.tit, logMatches);
				}));
			}
			else
				$elt.append($("<button>search with deezer</button>").click(function(){
					searchForeignId($elt.find("h2 > a").text(), logMatches);
				}));
			$elt.append($("<button>refresh meta</button>").click(function(){
				$.getJSON("/api/track" + eid + "?action=refresh", function(){
					displayTrackMetadata(elt);
				});
			}));
		});
	}

	function onEachPost(e) {
		var elt = e.target || this;
		var pid = elt.tagName == "DIV" && elt.getAttribute("data-pid");
		if (pid) {
	    	//console.log('[ADRIEN] new post id', pid);
	    	//$(elt).each(appendLastfmBtn);
	    	//$(elt).each(displayHiddenTrackData);
	    	//$(elt).find(".tags, .tag").show();
	    	displayTrackMetadata(elt);
	    }
	}

	if (window.user && window.user.lastFm)
		$(".posts").bind('DOMNodeInserted', onEachPost).children().each(onEachPost);

	$(".tags, .tag").show();
	return ("done");
}
