/**
 * openwhyd player
 * @author adrienjoly
 **/

window.playTrack = function() {
 	return false;
};

window.showMessage = window.showMessage || function(msg) {
	console.log("[showMessage]", msg);
}

// configuration

var USING_IOS = navigator.userAgent.match(/(iPod|iPhone|iPad)/i);
var USING_ELECTRON = /openwhyd-electron/.test(navigator.userAgent);
var MAX_POSTS_TO_SHUFFLE = 200;

// utility functions

if (undefined == window.console) 
	console = {log:function(){}};

function EventEmitter() {
	this._eventListeners = {};
}

EventEmitter.prototype.on = function(eventName, handler){
	this._eventListeners[eventName] = (this._eventListeners[eventName] || []).concat(handler);
}

EventEmitter.prototype.emit = function(eventName /*, args...*/){
	var args = Array.prototype.slice.call(arguments, 1); // remove eventName from arguments, and make it an array
	var listeners = this._eventListeners[eventName];
	for (var i in listeners)
		listeners[i].apply(null, args);
}

function inheritEventEmitter(object) {
	var eventEmitter = new EventEmitter();
	for (var i in eventEmitter)
		object[i] = eventEmitter[i];
}

// from snip.js
var extractTrackMetaFromTitle = (function() {
	var reQuotes = /\"[^\")]*\"/g, reSeparator = /-+\s+/g, reOnlyDigits = /^\d+$/;
	var cleanTrackName = function(str) {
		return !str ? "" : str
			.trim()
			.replace(/^\d+([\-\.\/\\]\d+)+\s+/, "") // remove prefixing date
			.replace(/^\d+[\.]+\s+/, "") // remove prefixing track number
			.replace(/^\#\d+\s+/, "") // remove prefixing rank
			.replace(/\([^\)]*\)/g, "") // remove parentheses
			.replace(/\[[^\]]*\]/g, "") // remove brackets
			.replace(/\s+/, " ") // remove extra/duplicate whitespace
			.trim()
	}
	var removeAccents = function(str) {
		return !str ? "" : str
			.replace(/[àâä]/gi, "a")
			.replace(/[éèêë]/gi, "e")
			.replace(/[îï]/gi, "i")
			.replace(/[ôö]/gi, "o")
			.replace(/[ùûü]/gi, "u")
	}
	var normalizeArtistName = function(artistName) {
		return removeAccents(artistName.trim().toLowerCase())
			.replace(/[^a-z0.1]/g, ""); // remove non alpha characters
	}
	var detectArtistName = function(trackName) {
		var quoted = trackName.match(reQuotes) || [];
		var splitted = (trackName || "").replace(reQuotes, " - ").split(reSeparator);
		// remove track title (last item of the string, or quoted items)
		splitted.length = splitted.length - (quoted.length || 1);
		for (var i in splitted) {
			var normalized = normalizeArtistName(splitted[i]);
			if (normalized && !reOnlyDigits.test(normalized))
				return splitted[i].trim();
		}
		return null;
	}
	return function (title) {
		title = cleanTrackName(title);
		var artist = detectArtistName(title);
		return {
			artist: artist,
			title: title.replace(artist, "").replace(reSeparator, "")
		};
	};
})();

/////////////////////////////////////////////////////////////////////////////////

function ProgressBar(p) {
	var p = p || {};
	var updateBarOnDrag = p.updateBarOnDrag;
	this.value = p.value || 0;
	var $progressTrack = p.progressTrack;
	var $progressBar = $progressTrack.find(".progressBar");
	var $progressCursor = $progressTrack.find(".progressCursor");
	var draggingCursor = false;
	$progressTrack.mousedown(function(e) {
		//console.log("progresstrack.mousedown", e, $progressTrack);
		var start_x = e.pageX;
		var min_x = $progressTrack.offset().left + 3;
		var width = $progressTrack.width();
		var offset_x = Math.min(width, Math.max(0, e.pageX - min_x));
		draggingCursor = true;
		function moveCursor(e) {
			$progressTrack.addClass("dragging");
			offset_x = Math.min(width, Math.max(0, e.pageX - min_x));
			$progressCursor.css("left", offset_x -6 + "px");
			if (updateBarOnDrag)
				$progressBar.css("width", 100 * (offset_x / width) + "%");
			p.onCursorMove && p.onCursorMove(offset_x / width);
		}
		$(document).mousemove(moveCursor).one('mouseup', function(e) {
			draggingCursor = false;
			$(document).unbind('mousemove');
			moveCursor(e);
			p.onChange(this.value = offset_x / width);
			setTimeout(function() {$progressTrack.removeClass("dragging");}, 1000);
		});
		return false;
	});
	this.setValue = function(newValue) {
		if (NaN != newValue) {
			this.value = Math.min(1, Math.max(0, newValue));
			$progressBar.css("width", 100 * this.value + "%");
			if (!draggingCursor) {
				$progressCursor.css("left", $progressTrack.width() * this.value - 6 + "px");
				p.onCursorMove && p.onCursorMove(this.value);
			}
		}
		return this.value;
	}
}

/////////////////////////////////////////////////////////////////////////////////

function WhydPlayer () {

	window.playem = new Playem();
	var currentTrack = null;
	var isPlaying = false;
	var isShuffle = false;
	var self = this;
	inheritEventEmitter(self); // adds on() and emit() methods

	// utility functions

	function setPageTitlePrefix(symbol) {
		var spacePos = window.document.title.indexOf(" ");
		if (spacePos < 3)
			window.document.title = window.document.title.substr(spacePos+1);
		window.document.title = symbol + " " + window.document.title;
	}

	// ui init

	var div = document.getElementById("whydPlayer");
	if (!div) {
		document.body.appendChild(document.createElement('div')).id = "whydPlayer";
		div = document.getElementById("whydPlayer");
		//div.appendChild(document.createElement('div')).id = "playerContainer";
		div.appendChild(document.createElement('div')).innerHTML = [
			'<div class="buttons">',
			'	<button id="btnPrev" onclick="whydPlayer.prev()"></button>',
			'	<button id="btnPlay" onclick="whydPlayer.playPause()"></button>',
			'	<button id="btnNext" onclick="whydPlayer.next()"></button>',
			'</div>',
		//	'<span id="trackPoster">(none)</span>',
			'<div class="progressPanel">',
			'	<div id="btnLike" class="button" onclick="whydPlayer.like()"><div></div></div>',
			'	<div id="btnRepost" class="button" onclick="whydPlayer.repost()"><div></div></div>',
			'	<span id="trackTitle">(none)</span>',
			'	<div id="progressTrack" class="progressTrack">',
			'		<div id="progressBar" class="progressBar"></div>',
			'		<div id="progressCursor" class="progressCursor"></div>',
			'	</div>',
			'	<div id="progressTimer"></div>',
			'</div>',
			'<div id="btnShuffle" onclick="whydPlayer.toggleShuffle()"><div></div></div>',
			'<div class="volumePanel">',
			'	<div class="volume less"></div>',
			'	<div id="volumeTrack" class="progressTrack">',
			'		<div class="progressBar"></div>',
			'		<div class="progressCursor"></div>',
			'	</div>',
			'	<div class="volume more"></div>',
			'</div>'
		].join('\n');
	}

	var $body = $("body");
	var $trackTitle = $("#trackTitle");
	var $trackNumber = $("#trackNumber");
	var $trackSrc = $("#trackSrc");

	function setState (state, $post) {
		var loading = (state == "loading");
		isPlaying = (state == "playing");

		$body.toggleClass("playing", isPlaying);

		var classes = $body.attr("class").split(" ");
		for (var i in classes)
			if (classes[i].indexOf("playing_") == 0)
				$body.removeClass(classes[i]);
		$body.addClass("playing_" + currentTrack.playerName);

		$trackSrc.attr("href", currentTrack.metadata.url);

		// for invisible embeds (e.g. soundcloud)
		$(".post .play").removeClass("loading").removeClass("playing").removeClass("paused");
		if ($post)
			$post.find(".play").addClass(state);

		// for visible embeds (e.g. youtube)
		$("#playBtnOverlay").removeClass("loading").removeClass("playing").removeClass("paused").addClass(state);
	}

	if (typeof document.hasFocus === 'function' && !USING_ELECTRON) {
		var hadFocus = true, wasPlaying = false;
		function updateFocusState(){
			var hasFocus = document.hasFocus();
			//console.log('updateFocusState', hadFocus, '->', hasFocus);
			if (hasFocus !== hadFocus) {
				if (!hasFocus) { // user just left Openwhyd => page lost focus
					wasPlaying = isPlaying;
					if (isPlaying) playem.pause();
				} else if (hasFocus) { // user just came back to Openwhyd
					if (wasPlaying) {
						playem.resume();
						window.showMessage && showMessage('Want to play music in the background?'
							+ ' Please install <a href="https://openwhyd.org/download"'
							+ ' target="_blank">Openwhyd Desktop App</a> 👌', true);
					}
				}
				hadFocus = hasFocus;
			}
		}
		updateFocusState();
		setInterval(updateFocusState, 500);
	}

	var $progressTimer = $("#progressTimer"), $trackDragPos = $("#trackDragPos");
	
	var progressBar = new ProgressBar({
		progressTrack: $("#progressTrack"),
		onCursorMove: function(pos) {
			if (pos && currentTrack.trackDuration) {
				$trackDragPos.text(formatTime(currentTrack.trackDuration * pos));
				$trackDragPos.css({
					"left": (100 * pos) + "%",
					"margin-left": "-" + ($trackDragPos.width() / 2) + "px"
				});
			}
		},
		onChange: function(pos) {
			playem.seekTo(pos);
			setProgress(pos);
		}
	});

	function formatTime(secTotal) {
		var mn = Math.floor(secTotal / 60);
		var sec = ""+Math.floor(secTotal - (mn * 60));
		return "" + mn + ":" + (sec.length < 2 ? "0" : "") + sec;
	}

	function setProgress(progress) {
		if (progress && NaN != progress && currentTrack.trackDuration) {
			progressBar.setValue(progress);
			$progressTimer.text(formatTime(currentTrack.trackDuration * progress)
				+ " / " + formatTime(currentTrack.trackDuration));
		}
	}

	var $volumeTrack = $("#volumeTrack");
	if ($volumeTrack.length) {
		var prevVolumeLevel = 1.0;
		var $volumeBtn = $(".volume").click(function(){
			setVolume(volumeBar.value > 0.01 ? 0 : prevVolumeLevel);
		});
		function setVolume(pos) {
			playem.setVolume(pos);
			volumeBar.setValue(pos);
			$volumeBtn.toggleClass("mute", pos < 0.01);
			$volumeBtn.toggleClass("half", pos < 0.5);
			if (pos > 0.1)
				prevVolumeLevel = pos;
			return pos;
		}
		var volumeBar = new ProgressBar({
			value: 1.0,
			updateBarOnDrag: true,
			progressTrack: $volumeTrack,
			onChange: setVolume
		});
	}

	// data provider

	var shortcuts = {
		"/yt/": window.location.protocol+"//youtube.com/v/",
		"/sc/": window.location.protocol+"//soundcloud.com/",
		"/dm/": window.location.protocol+"//dailymotion.com/video/",
		"/vi/": window.location.protocol+"//vimeo.com/",
		"/ja/": window.location.protocol+"//jamendo.com/track/",
		"/sp/": window.location.protocol+"//open.spotify.com/track/",
		"/dz/": window.location.protocol+"//www.deezer.com/track/"
		// TODO: bandcamp?
	};

	function addTrackByEid(eId, metadata){
		var eId = ("" + eId);
		var src = (shortcuts[eId.substr(0,4)] || eId.substr(0,4)) + eId.substr(4);
		var track = playem.addTrackByUrl(src, metadata);
		if (!track.player) {
			console.warn("addTrackByEid, track was not recognized:", track);
			$(metadata.post).addClass("disabled");
		}
		return track;
	}

	function addTrackFromAnchor(e) {
		var post = e.parentNode;
		var authorHtml = ($(post).find(".author") || [])[0];
		var title = (post.getElementsByTagName("h2") || [])[0];
		var track = addTrackByEid(e.dataset ? e.dataset.eid : e.getAttribute("data-eid"), {
			title: title ? title.innerHTML : null,
			url: e.getAttribute("href"),
			authorHtml: authorHtml ? authorHtml.innerHTML : null,
			post: post,
			img: $(post).find(".thumb > img").first().attr("src"),
			pid: $(post).attr("data-pid"),
			eid: $(post).attr("data-eid"),
			isLoved: !!(post.dataset ? post.dataset.loved : post.getAttribute("data-loved"))
		});
	}

	function populateTracksFromPosts() {
		console.log("populating track list...");
		playem.clearQueue();
		var posts = $(".post:visible");
		for (var i=0; i<posts.length; ++i)
			addTrackFromAnchor(posts[i].getElementsByTagName("a")[0]);
		var playQueue = playem.getQueue();
		if (isShuffle && playQueue && playQueue.length)
			shuffleArray(playQueue);
		//console.log("shuffled?", isShuffle, playQueue.length, playQueue.map(function(a){return a.index;}));
		return playQueue;
	}

	var $post = null;

	function highlightTrack(track) {
		$(".post").removeClass("playing");
		$post = $(track.metadata.post || (".post:visible[data-pid="+track.metadata.pid+"]")).addClass("playing");
		$body.toggleClass("reduced", $post.length == 0 || $post.is(':hidden'));
		return $post;
	}

	function playTrack(index){
		playem.play(index);
	}

	function logTrackPlay(){
		if (currentTrack.yetToPublish) {
			currentTrack.yetToPublish = false;
			// ajax increment play counter
			var data = {
				action: "incrPlayCounter",
				pId: currentTrack.metadata.pid,
				eId: currentTrack.metadata.eid,
				duration: currentTrack.trackDuration
			};
			if (currentTrack.metadata.logData) { // error and fallback data
				data.logData = currentTrack.metadata.logData;
				if (typeof document.hasFocus === 'function') {
					data.logData.foc = document.hasFocus();
				}
				delete currentTrack.metadata.logData;
			}
			$.ajax({
				type: "POST",
				url: "/api/post",
				contentType: "application/json; charset=utf-8", // otherwise, jquery sends `prop[prop]` url-encoded entries that are not recognized by openwhyd's server
				data: JSON.stringify(data),
				success: function() {
					var $nbPlays = $post.find(".nbPlays");
					$nbPlays.text((parseInt($nbPlays.text()) || 0) + 1).show();
				}
			});
			//fbAction("listen", "/c/" + currentTrack.metadata.pid, "track");
			currentTrack.metadata.tStart = new Date();
			// also send to google analytics
			window.Whyd.tracking.logTrackPlay(currentTrack.metadata.pid);
		}
	}

	function replaceTrackWith(currentIndex, eId, cb){
		addTrackByEid(eId, currentTrack.metadata);
		var queue = playem.getQueue();
		var altTrack = queue[currentIndex] = queue.pop();
		altTrack.index = currentIndex;
		cb(altTrack);
	}

	function playTrackFromAlternativeSource(eId){
		var currentIndex = currentTrack.index;
		console.log("switching to", eId, "...");
		replaceTrackWith(currentIndex, eId, function(altTrack){
			/*
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
			*/
			playTrack(currentIndex); // logData will be submitted when onPlay or onError is received
		});
	}

	function fetchTrackMetadata(eId, cb, complete){
		console.log("fetching metadata and alternatives for eId", eId, "...");
		$.getJSON((complete ? "/api/metadataExtractor" : "/api/track") + eId, cb);
	}

	function playTrackFromFirstAlternativeSource(eId){
		fetchTrackMetadata(eId, function(track){
			console.log("found", track.alt || 0, "alternatives");
			for(var i in track.alt){
				var newEid = track.alt[i];
				if (newEid != eId && shortcuts[newEid.substr(0, 4)])
					return playTrackFromAlternativeSource(newEid);
				else
					console.log("skipping", newEid, "...");
			}
		});
	}

	// handlers for events coming from Playem

	var playemEventHandlers = {
		onError: function(e) {
			if (currentTrack.metadata.logData)
				logTrackPlay();

			// will try to fallback failing tracks to deezer player

			window.showMessage && showMessage('Oops, we could not play'
			+ ' <a href="'+currentTrack.metadata.url+' target="_blank">this track</a>...'
			+ ' Please try with <a href="https://openwhyd.org/download"'
			+ ' target="_blank">Openwhyd Desktop App</a> 👌', true);
			if (e && e.track) {
				console.log("cleaning track metadata before logging", e.track)
				// to prevent circular object
				e.eId = e.track.metadata.eid;
				e.pId = e.track.metadata.pid;
				e.trackUrl = e.track.url;
				delete e.track;
			}
			currentTrack.metadata.logData = {
				err: e || {} // TODO: check that format is correct
			};
			logTrackPlay();
			if (playem.getQueue().length > 1)
				playem.next();
			else
				playem.stop();
		},
		onReady: function() {
			// hide the player after init
			//$(playerContainer.parentNode).addClass("reduced");
			//populateTracksFromPosts();
		},
		onTrackChange: function(track) {
			currentTrack = track;
			currentTrack.yetToPublish = true;

			// display the play bar and the player
			$(div).show();
			$("#contentPane").addClass("withPlayer");
			setProgress();

			// update the current track title
			$trackTitle.html(track.metadata.title);
			$trackNumber.text((track.index + 1) + ". ");
			try {$trackTitle.ajaxify();} catch(e) {}
			$("#trackThumb").css("background-image", "url('" + track.metadata.img + "')");
			$("#btnLike").toggleClass("loved", track.metadata.isLoved);
			
			// highlight the post being played
			$post = highlightTrack(track);
			setState("loading", $post);
		},
		onPlay: function() {
			setState("playing", $post);
			setPageTitlePrefix("▶");
			$("#btnPlay").addClass("playing");

			self.emit("play", currentTrack);
			logTrackPlay();
		},
		onEnd: function() {
			if (window.user && window.user.lastFm)
				$.post("/api/post", {
					action: "scrobble",
					pId: currentTrack.metadata.pid,
					trackDuration: currentTrack.trackDuration,
					timestamp: Math.floor(currentTrack.metadata.tStart.getTime() / 1000)
				}, function(res) {
					console.log("scrobbled to last.fm, baby!", res);
				});				
		},
		onPause: function() {
			setState("paused", $post);
			setPageTitlePrefix("❚❚");
			$("#btnPlay").removeClass("playing");
			self.emit("pause", currentTrack);
		},
		// todo: call from whydPlayer.onTrackChange() instead of exposing this function to playem
		loadMore: function(params, cb) {
			if (params || cb)
				return loadMore(params, cb);
			else if (!isShuffle) {
				var $btnLoadMore = $(".btnLoadMore:visible");
				if ($btnLoadMore.length)
					$btnLoadMore.click();
			}
		},
		onTrackInfo: function(info) {
			setProgress(Number(info.trackPosition) / Number(info.trackDuration));
		}
	};

	var wrapLogger = (function(){
		var lastLog = null;
		return function(evtName, handler){
			return function(){
				//console.log.apply(console, [ Date.now(), evtName ].concat(Array.prototype.slice.call(arguments)));
				var playerName;
				try { playerName = arguments[0].playerName; } catch(e){};
				var log = evtName + (playerName ? " (" + playerName + ")" : "");
				if (log != lastLog) {
					console.log("%cevt: " + log, "color:#888");
					lastLog = log;
				}
				handler.apply(null, arguments);
			};
		};
	})();

	// init whydPlayer DOM elements

	var playerContainer = document.getElementById("playerContainerSub");
	if (!playerContainer) {
		playerContainer = document.createElement('div');
		$(playerContainer).append('<div id="playBtnOverlay" onclick="window.whydPlayer.playPause();">');

		var $containerParent = $("#contentPane");
		if (!$containerParent.length)
			$containerParent = $body;

		$containerParent.prepend($('<div id="playerContainer">').append(playerContainer));
	}
	$("body").addClass("reduced");

	// init playem object, based on DOM elements

	for(var i in playemEventHandlers)
		playem.on(i, wrapLogger(i, playemEventHandlers[i]));

	var genericHolder = document.createElement('div');
	genericHolder.id = "genericholder";
	playerContainer.appendChild(genericHolder);

	var defaultDefaultParams = {
		playerId: "genericplayer",
		origin: window.location.host || window.location.hostname || "openwhyd.org",
		playerContainer: genericHolder
	};

	var inProduction = window.location.href.indexOf("//openwhyd.org") > -1;
	var inTest = window.location.href.indexOf("//whyd.fr") > -1; // pre-production

	var PLAYERS = {
		// yt: inProduction ? 'YoutubeIframePlayer' : (inTest?'YoutubeIframePlayer':'YoutubeIframePlayer'),
		yt: 'YoutubeIframePlayer' ,
		sc: 'SoundCloudPlayer',
		dm: 'DailymotionPlayer',
		vi: 'VimeoPlayer',
		dz: 'DeezerPlayer',
		ja: 'JamendoPlayer',
		bc: 'BandcampPlayer',
		fi: 'AudioFilePlayer',
		sp: 'SpotifyPlayer',
	}, players = [];

	for(var prefix in PLAYERS)
		players[prefix] = playem.addPlayer(window[PLAYERS[prefix]], defaultDefaultParams);

	// http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
	function shuffleArray(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
		while (0 !== currentIndex) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[currentIndex].index = currentIndex;
			array[randomIndex] = temporaryValue;
		}
		return array;
	}

	// ui-bound handlers

	var exports = {
		detectTrackByUrl: function(url){
			for (var i in players) {
				var player = players[i];
				var eId = player.getEid(url);
				if (eId)
					return eId;
			}
		},
		fetchTrackByUrl: function(url, cb){
			for (var playerId in players) {
				var player = players[playerId];
				var eId = player.getEid(url);
				if (eId) {
					function returnTrack(track){
						track = track || {};
						track.playerLabel = player.label;
						track.eId = track.eId || ("/" + playerId + "/" + (track.id || eId));
						cb(track);
					};
					if (!player.fetchMetadata){
						returnTrack();
					}else{
						player.fetchMetadata(url, returnTrack);
					}
					return;
				}
			}
			cb();
		},
		playFirstAlt: function(){
			var eId = $(currentTrack.metadata.post).find("[data-eid]").attr("data-eid");
			playTrackFromFirstAlternativeSource(eId);
		},
		switchSource: function(sourceId){
			var eId = $(currentTrack.metadata.post).find("[data-eid]").attr("data-eid");
			fetchTrackMetadata(eId, function(res){
				if (sourceId)
					playTrackFromAlternativeSource("/"+sourceId+"/"+res.mappings[sourceId].id);
				else if (res && res.mappings) {
					console.log("found the following mappings:");
					for(var src in res.mappings)
						console.log("-", src, ":", Math.floor(res.mappings[src].c * 100) + "%");
				}
			}, true);
		},
		toggleShuffle: function(value) {
			if (value != undefined && value == isShuffle)
				return isShuffle;
			isShuffle = !isShuffle;
			$body.toggleClass("isShuffle", isShuffle);
			if (isShuffle)
				loadMore({limit: MAX_POSTS_TO_SHUFFLE}, function(){
					populateTracksFromPosts();
				});
			else
				populateTracksFromPosts(); // will shuffle the tracks
			if (isShuffle) {
				if (!isPlaying)
					playTrack(0);
			}
			return isShuffle;
		},
		getCurrentTrack: function() {
			return currentTrack;
		},
		pause: function() {
			if (currentTrack && isPlaying)
				playem.pause();
		},
		playPause: function() {
			if (!currentTrack)
				self.playAll();
			else if (isPlaying)
				self.pause();
			else
				playem.resume();
		},
		next: function() {
			playem.next();
		},
		prev: function() {
			playem.prev();
		},
		playAll: function(postNode) {
			isShuffle = false;
			$body.removeClass("isShuffle");
			var trackList = populateTracksFromPosts();
			var trackNumber = 0;
			if (postNode)
				for (var i in trackList)
					if (trackList[i].metadata.post == postNode)
						trackNumber = i;
			if (currentTrack && currentTrack.metadata.post == postNode)
				self.playPause();
			else
				playTrack(trackNumber);
		},        
		updateTracks: function() {
			populateTracksFromPosts();
		},
		like: function() {
			if (currentTrack.metadata)
				toggleLovePost(currentTrack.metadata.post.dataset.pid);
		},
		repost: function() {
			if (currentTrack.metadata)
				publishPost(currentTrack.metadata.post.dataset.pid);
		},
		comment: function() {
			if (currentTrack.metadata)
				goToPage("/c/" + currentTrack.metadata.post.dataset.pid);
		},
		refresh: function() {
			if (currentTrack) {
				/*var $post =*/ highlightTrack(currentTrack);
				setState(isPlaying ? "playing" : "loading", $post);
				$body.toggleClass("isShuffle", isShuffle);
			}
		},
		toggleFullscreen: function(toggle) {
			$body.removeClass("reduced").toggleClass("fullscreenVideo", toggle);
		},
		populateTracks: function() {
			populateTracksFromPosts();
			self.refresh();
		},
		setVolume: function(vol) {
			playem.setVolume(vol);
		}
	};

	for (var f in exports)
		self[f] = exports[f];

	//populateTracksFromPosts();
	return self; //exports;
}

/*loader.whenReady*/(function() {
	console.log("Loading Playem...");
	window.whydPlayer = new WhydPlayer();
	window.playTrack = USING_IOS ? function() {return true;} : function (embedLink) {
		setTimeout(function(){
			window.whydPlayer.playAll(embedLink.parentNode);
		},10);
		return false;
	}
	if (window.location.href.indexOf("#autoplay") != -1)
		window.whydPlayer.playAll();

	console.log("Playem is ready!");

	// enable media keys for controlling the player, using sway.fm chrome extension
	/*
	// disabled this code, as the URL does not exist anymore and the chrome extension
	// does not seem to work either: https://chrome.google.com/webstore/detail/media-keys-by-swayfm/icckhjgjjompfgoiidainoapgjepncej/reviews
	loader.includeJS("https://s3.amazonaws.com/SwayFM/UnityShim.js", function() {
		console.log("Loading sway.fm...")
		var unity = UnityMusicShim();
		unity.setSupports({
		  playpause: true,
		  next: true,
		  previous: true
		  //favorite: true
		});
		unity.setCallbackObject({
		  pause: window.whydPlayer.playPause,
		  next: window.whydPlayer.next,
		  previous: window.whydPlayer.prev
		  //favorite: window.whydPlayer.like()
		});
		function makeStateProxy(props){
			props = props || {};
			return function(track) {
				var trackMeta = extractTrackMetaFromTitle($("<p>" + track.metadata.title + "</p>").text());
				unity.sendState({
				  playing: props.playing,
				  title: trackMeta.title,
				  artist: trackMeta.artist,
				  //favorite: false,
				  albumArt: track.metadata.img
				});
			};
		}
		window.whydPlayer.on("play", makeStateProxy({playing: true}));
		window.whydPlayer.on("pause", makeStateProxy({playing: false}));
	});
	*/
})();
