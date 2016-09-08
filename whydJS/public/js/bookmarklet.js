/**
 * openwhyd bookmarklet v2.2
 * @author adrienjoly, whyd
 **/

// prevents bug in firefox 3
if (undefined == window.console) 
	console = {log:function(){}, info:function(){}, error:function(){}, warn:function(){}};

console.log("-= openwhyd bookmarklet v2.2 =-");
var	YOUTUBE_API_KEY = "AIzaSyADm2ekf-_KONB3cSGm1fnuPSXx3br4fvI"; 

(window._initWhydBk = function(){

	var FILENAME = "/js/bookmarklet.js";
	var CSS_FILEPATH = "/css/bookmarklet.css";

	// close the bookmarklet by pressing ESC

	window.onkeydownBackup = window.onkeydownBackup || window.document.onkeydown;

	var overflowBackup = document.body.style.overflow;
	document.body.style.overflow = "hidden";

	window.closeWhydBk = function() {
		document.body.removeChild(document.getElementById('whydBookmarklet'));
		window.document.onkeydown = window.onkeydownBackup;
		document.body.style.overflow = overflowBackup;
		delete window.onkeydownBackup;
		delete window.closeWhydBk;
	};
	
	window.document.onkeydown = function(e){
		if ((e || event).keyCode == 27)
			closeWhydBk();
	};

	// utility functions

	function findScriptHost(scriptPathName) {
		// TODO: use document.currentScript.src when IE becomes completely forgotten by humans
		var els = document.getElementsByTagName("script");
		for(var i = els.length - 1; i > -1; --i) {
			var whydPathPos = els[i].src.indexOf(scriptPathName);
			if(whydPathPos > -1)
				return els[i].src.substr(0, whydPathPos);
		}
	}

	function getSelText() {
		var SelText = '';
		if (window.getSelection) {
			SelText = window.getSelection();
		} else if (document.getSelection) {
			SelText = document.getSelection();
		} else if (document.selection) {
			SelText = document.selection.createRange().text;
		}
		return SelText;
	}

	function getNodeText(node){
		return node.innerText || node.textContent;
	}

	function unwrapFacebookLink(src) {
		// e.g. http://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
		var fbLink = src.split("facebook.com/l.php?u=");
		if (fbLink.length>1) {
			fbLink = decodeURIComponent(fbLink.pop().split("&").shift());
			var result = fbLink.indexOf("//www.facebook.com/") == -1 ? fbLink : src;
			return result;
		}
		return src;
	}

	function include(src, cb) {
		var inc, timer;
		if (src.split(/[\#\?]/)[0].split(".").pop().toLowerCase() == "css") {
			inc = document.createElement("link");
			inc.rel = "stylesheet";
			inc.type = "text/css";
			inc.media = "screen";
			inc.href = src;
		}
		else {
			inc = document.createElement("script");
			inc.onload = function(loaded) {
				timer = timer ? clearInterval(timer) : null;
				cb && cb();
			}
			function check() {
				if (inc.readyState && (inc.readyState == "loaded" || inc.readyState == "complete" || inc.readyState == 4))
					inc.onload();
			}
			timer = cb ? setInterval(check, 500) : undefined;
			inc.onreadystatechange = check;
			inc.type = "text/javascript";
			inc.src = src;
		}
		document.getElementsByTagName("head")[0].appendChild(inc);
	};
	
	// PARAMETERS
	
	var urlPrefix = findScriptHost(FILENAME) || "https://openwhyd.org",
		urlSuffix = "?" + (new Date()).getTime();

	// user interface

	function BkUi(){

		this.nbTracks = 0;

		var div = document.getElementById("whydBookmarklet");
		if (!div) {
			document.body.appendChild(document.createElement('div')).id = "whydBookmarklet";
			div = document.getElementById("whydBookmarklet");
		}

		div.innerHTML = [
			'<div id="whydOverlay"></div>',
			'<div id="whydHeader">',
				'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/images/logo-s.png"></a>',
				'<div onclick="closeWhydBk();" style="background-image:url('+urlPrefix+'/images/bookmarklet_ic_close_Normal.png)"></div>',
			'</div>',
			'<div id="whydContent">',
				'<div id="whydLoading"></div>',
			'</div>'
		].join('\n');

		function showForm() {
			var thumb = this;
			var text = getSelText();
			var href = urlPrefix + '/post?v=2&'
				+ 'embed=' + (thumb.eId ? "1&eId=" + encodeURIComponent(thumb.eId) : encodeURIComponent(thumb.url))
				+ (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '')
				+ '&refUrl=' + encodeURIComponent(window.location.href)
				+ '&refTtl=' + encodeURIComponent(document.title)
				+ (text ? '&text=' + encodeURIComponent(text) : '');
			var whydPop = window.open(href, "whydPop", "height=460,width=780,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no");
			whydPop.focus();
			window.closeWhydBk();
		}

		function showSearch() {
			var searchQuery = this;
			var whydPop = window.open(urlPrefix + "/search?q=" + encodeURIComponent(searchQuery), "whydSearch");
			whydPop.focus();
			window.closeWhydBk();
		}

		function elt(attrs, children){

			var div = document.createElement(attrs.tagName || "div");
			if (attrs.tagName)
				delete attrs.tagName;
			if (attrs.img) {
				div.style.backgroundImage = "url(" + attrs.img + ")";
				delete attrs.img;
			}
			for (var i in attrs)
				div.setAttribute(i, attrs[i]);
			for (var i=0; i<(children||[]).length; ++i)
				div.appendChild(children[i]);
			return div;
		}

		function selectThumb(e){
			var tpn = this.parentNode;
			var selected = tpn.className.indexOf(' selected') >- 1;
			tpn.className = tpn.className.replace(' selected','') + (selected ? '' : ' selected');
			e.preventDefault();
		}

		function renderThumb(thumb) {
			var addBtn = elt({class: "whydCont"}, [
				elt({class: "whydContOvr"}),
				elt({class: "whydAdd", img: urlPrefix + "/images/bookmarklet_ic_add_normal.png"})
			]);
			addBtn.onclick = thumb.onclick;
			var checkBox = elt({class: "whydSelect"}); //onclick: "var tpn=this.parentNode;tpn.className=tpn.className.replace(' selected','')+(tpn.className.indexOf(' selected')>-1?'':' selected');e.preventDefault();"
			checkBox.onclick = selectThumb;
			return elt({
				id: thumb.id,
				class: "whydThumb",
				img: thumb.img || urlPrefix + "/images/cover-track.png"
			}, [
				elt({class: "whydGrad"}),
				elt({tagName: "p"}, [ document.createTextNode(thumb.title) ]),
				elt({class: "whydSrcLogo", img: thumb.sourceLogo}),
				addBtn,
				checkBox
			]);
			return div;
		}

		var contentDiv = document.getElementById("whydContent");

		this.addThumb = function(thumb) {
			thumb.id = 'whydThumb' + (this.nbTracks++);
			thumb = imageToHD(thumb);
			thumb.onclick = thumb.onclick || showForm.bind(thumb);
			contentDiv.appendChild(renderThumb(thumb));
		}

		this.addSearchThumb = function(track) {
			var searchQuery = track.searchQuery || track.name || track.title;
			this.addThumb({
				title: searchQuery || "Search Whyd",
				sourceLogo: urlPrefix + "/images/icon-search-from-bk.png",
				onclick: showSearch.bind(searchQuery)
			});
		}
		
		this.finish = function(html) {
			document.getElementById("whydLoading").style.display = "none";
		}

		return this;
	}


	function imageToHD(track){
		if(track.img){
			if(track.eId.substr(1, 2) == "yt"){
				var img = "http://img.youtube.com/vi/"+ track.eId.substr(4).split('?')[0] + "/hqdefault.jpg";
				var i = new Image();
				i.onload = function(){
					if (i.height >= 120) {	
						document.getElementById(track.id).style.backgroundImage='url('+img+')';
					}
				}
				i.src = img;
			}
			else if(track.eId.substr(1, 2) == "sc")
				track.img = track.img.replace('-large','-t300x300');
			else if (track.eId.indexOf("/dz/") == 0)
				track.img = track.img.replace(/\/image$/, "/image?size=480x640");
			else if (track.eId.indexOf("/ja/") == 0)
				track.img = track.img.replace(/\/covers\/1\.200\.jpg$/, "/covers/1.600.jpg");
		}
		return track;
	}
	// Track detectors
	
	function makeFileDetector(eidSet){
		var eidSet = {}; // to prevent duplicates
		return function detectMusicFiles(url, cb, e) {
			var title = decodeURIComponent((url.match(/([^\/]+)\.(?:mp3|ogg)$/) || []).pop() || ""),
				alt = [e.title, e.innerText, e.textContent];
			if (eidSet[url] || !title)
				return cb();
			for (var i = 0; i < alt.length; ++i) {
				var trimmed = e.title.replace(/^\s+|\s+$/g, '');
				if (trimmed) {
					title = trimmed;
					break;
				}
			}
			eidSet[url] = true;
			cb({
				id: url,
				title: title,
				img: urlPrefix + '/images/cover-audiofile.png',
			});
		};
	}

	function makePlayemStreamDetector(eidSet){
		window.SOUNDCLOUD_CLIENT_ID = "eb257e698774349c22b0b727df0238ad";
		window.DEEZER_APP_ID = 190482;
		window.DEEZER_CHANNEL_URL = urlPrefix + "/html/deezer.channel.html";
		window.JAMENDO_CLIENT_ID = "c9cb2a0a";	
		var players = { // playem-all.js must be loaded at that point
				yt: new YoutubePlayer({}, {playerContainer: document.getElementById("videocontainer")}),
				sc: new SoundCloudPlayer({}),
				vi: new VimeoPlayer({}),
				dm: new DailymotionPlayer({}),
				dz: new DeezerPlayer({}),
				bc: new BandcampPlayer({}),
				ja: new JamendoPlayer({}),
			}, eidSet = {}; // to prevent duplicates
		function getPlayerId(url){
			for (var i in players) {
				var player = players[i];
				var eId = player.getEid(url);
				if (eId)
					return i;
			}
		}
		function detect(url, cb){
			var playerId = getPlayerId(url);
			var player = playerId && players[playerId];
			cb(player && ("/" + playerId + "/" + player.getEid(url)), player, playerId);
		}
		return function detectPlayemStreams(url, cb){
			detect(url, function(eid, player, playerId){
				if (!eid || eidSet[eid])
					return cb();
				var parts = eid.split("#");
				var streamUrl = /^https?\:\/\//.test(parts[1] || "") && parts[1];
				if (eidSet[parts[0]] && !streamUrl) // i.e. store if new, overwrite if new occurence contains a streamUrl
					return cb();
				eidSet[parts[0]] = true;
				eidSet[eid] = true;
				if (!player || !player.fetchMetadata)
					return cb({eId: eid});
				else
					player.fetchMetadata(url, function(track){
						if (track) {
							track = track || {};
							track.eId = track.eId || eid.substr(0, 4) + track.id; // || eid;
							track.sourceId = playerId;
							track.sourceLabel = player.label;
							cb(track);
						}else{
							cb();
						}

					});
			});
		};
	}

	// each detector is called once, without parameters, and returns a list of element objects
	// (with fields {searchQuery:}, {href:} or {src:}) to extract streams from.
	var DETECTORS = [
		function detectPandoraTrack(){
			if (window.location.href.indexOf("pandora.com") == -1)
				return null;
			var artist = getNodeText(document.getElementsByClassName("playerBarArtist")[0] || {}),
				title = getNodeText(document.getElementsByClassName("playerBarSong")[0] || {});
			return artist && title ? [{ searchQuery: artist + " - " + title }] : [];
		},
		function detectDeezerTrack(){
			var dzTrackId = window.dzPlayer && window.dzPlayer.getSongId();
			return dzTrackId ? [{ src: "https://www.deezer.com/track/" + dzTrackId }] : [];
		},
		function detectTrackFromTitle() {
			var title = document.title.replace(/[▶\<\>\"\']+/g, " ").replace(/[ ]+/g, " ");
			var titleParts = [" - Spotify", " | www.deezer.com", " - Xbox Music", " - Royalty Free Music - Jamendo"];
			for(var i=0; i<titleParts.length; ++i)
				if (title.indexOf(titleParts[i]) > -1)
					return [{searchQuery: title.replace(titleParts[i], "")}];
		},
		function extractBandcampTracks(){
			var toDetect = [];
			var bc = window.TralbumData;
			if (bc) {
				var bcPrefix = "/bc/" + bc.url.split("//")[1].split(".")[0] + "/";
				toDetect = bc.trackinfo.map(function(tr){
					if(tr.file){
						console.log("-------------FILE! =>", tr.file);

						var streamUrl = tr.file[Object.keys(tr.file)[0]];
						return {
							href: streamUrl,
							eId: bcPrefix + tr.title_link.split("/").pop() + "#" + streamUrl,
							name: bc.artist + " - " + tr.title,
							img: bc.artFullsizeUrl || bc.artThumbURL,
							artist: bc.artist,
							title: tr.title,
						};
					}
					
				});
				if (toDetect.length)
					return toDetect;
			}
			// list Bandcamp track URLs
			var bandcampPageUrl = document.querySelector && document.querySelector('meta[property="og:url"]');
			if (!bandcampPageUrl)
				return [];
			bandcampPageUrl = bandcampPageUrl.getAttribute("content");
			if (bandcampPageUrl.indexOf("bandcamp.com/track/") != -1)
				toDetect.push({src: bandcampPageUrl});
			else {
				var pathPos = bandcampPageUrl.indexOf("/", 10);
				if (pathPos != -1)
					bandcampPageUrl = bandcampPageUrl.substr(0, pathPos); // remove path
				var elts = document.querySelectorAll('a[href^="/track/"]');
				for (var j=0; j<elts.length; ++j)
					toDetect.push({href: bandcampPageUrl + elts[j].getAttribute("href")});
			}

			return toDetect;
			// TODO: document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
		},
		function parseDomElements(){
			var results = [];
			["iframe", "object", "embed", "a", "audio", "source"].map(function(elName){
				results = results.concat(Array.prototype.slice.call(document.getElementsByTagName(elName)));
			});
			return results;
		},
	];

	function detectTracks(ui) {

		// an url-based detector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
		var URL_DETECTORS = [
			makeFileDetector(),
			makePlayemStreamDetector(),
		];

		function detectTrack(url, cb, element) {
			var urlDetectors = URL_DETECTORS.slice();
			(function processNext() {
				if (!urlDetectors.length){
					cb();
				}else{

					urlDetectors.shift()(url, function(track){

						if (track && track.id)
							cb(track);
						else
							processNext();
					}, element);
				}
			})()
		}

		function detectEmbed(e, cb){
			var url = e.eId || unwrapFacebookLink(e.href || e.src || e.data || "");
			if (!url)
				return cb && cb();
			detectTrack(url, function(track){
				track = track || {};
				if (track.title){
					track.url = url;
					//track.title = track.title || e.textNode || e.title || e.alt || track.eId || url; // || p.label;
					if (track.sourceLabel)
						track.sourceLogo = urlPrefix + "/images/icon-" + track.sourceLabel.split(' ')[0].toLowerCase() + ".png";

					ui.addThumb(track);
				}
				cb();
			}, e);
		}

		function whenDone(){
			console.info("finished detecting tracks!");
			if (!ui.nbTracks)
				ui.addSearchThumb({name: document.title});
			ui.finish();
		}

		var toDetect = new (function ElementStack(){
			// this class holds a collections of elements that potentially reference streamable tracks
			var set = {};
			this.push = function(elt){
				var url = elt && (elt.eId || unwrapFacebookLink(elt.href || elt.src || elt.data || "")).split("#")[0];
				if (url && url.indexOf("javascript:") != 0)
					set[url] = elt;
			};
			this.getSortedArray = function(){
				var eIds = [], urls = [], keys = Object.keys(set);
				for (var i=0; i<keys.length; ++i)
					(/\/..\//.test(keys[i]) ? eIds : urls).push(set[keys[i]]);
				return eIds.concat(urls);
			};
		})();

		console.info("1/2 parse page...");
		toDetect.push({ src: window.location.href });

		DETECTORS.map(function(detectFct){
			var results = detectFct() || [];
			console.info("-----" + detectFct.name, "=>", results);
			results.map(function(result){
				if ((result || {}).searchQuery)
					ui.addSearchThumb(result);
				else
					toDetect.push(result);
			});
		});

		console.info("2/2 list streamable tracks...");
		var eltArray = toDetect.getSortedArray();
		(function processNext() {
			var elt = eltArray.shift();
			if (!elt)
				whenDone();
			else
				detectEmbed(elt, processNext);
		})();
	}

	console.info("initWhydBookmarklet...");
	include(urlPrefix + CSS_FILEPATH + urlSuffix);
	var ui = new BkUi();
	console.info("loading PlayemJS...");
	var playemFile = (urlPrefix.indexOf("openwhyd.org") > 0)?"playem-min.js":"playem-all.js";
	include(urlPrefix + "/js/"+ playemFile + urlSuffix, function(){
		detectTracks(ui);
	});
})();