/**
 * whyd bookmarklet
 * @author adrienjoly, whyd
 **/

// prevents bug in firefox 3
if (undefined == window.console) 
	console = {log:function(){}};

console.log("-= whyd bookmarklet =-");

(function(){

	window.onkeydownBackup = window.onkeydownBackup || window.document.onkeydown;

	window.closeWhydBk = function() {
		document.body.removeChild(document.getElementById('whydBookmarklet'));
		window.document.onkeydown = window.onkeydownBackup;
		delete window.onkeydownBackup;
		delete window.closeWhydBk;
	};
	
	window.document.onkeydown = function(e){
		if ((e || event).keyCode == 27)
			closeWhydBk();
	};

	function forEachElement (elementName, handler) {
		var els = document.getElementsByTagName(elementName);
		var l = 0 + els.length;
		var count = 0;
		for(var i = 0; i < l; i++)
			count += handler(els[i]);
		return count;
	}
	
	function findScriptHost(scriptPathName) {
		var host = null;
		forEachElement("script", function(element) {
			var whydPathPos = element.src.indexOf(scriptPathName);
			if(whydPathPos > -1)
				host = element.src.substr(0, whydPathPos);
		});
		return host;
	}
	
	// PARAMETERS
	
	var urlPrefix = findScriptHost("/js/bookmarklet.js") || "https://whyd.com";
	var urlSuffix = "?" + (new Date()).getTime();
	var minH = 90;
	var minW = 90;
	
	var div = document.getElementById("whydBookmarklet");
	if (!div) {
		document.body.appendChild(document.createElement('div')).id = "whydBookmarklet";
		div = document.getElementById("whydBookmarklet");
	}
	div.innerHTML = [
		'<div id="whydHeader">',
			'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/images/logo-s.png"></a>',
			'<div onclick="closeWhydBk();"><img src="'+urlPrefix+'/images/btn-close.png"></div>',
		'</div>',
		'<div id="whydContent">',
			'<div id="whydLoading">',
				'<p>Extracting tracks,</p>',
				'<p>please wait...</p>',
				'<img src="'+urlPrefix+'/images/loader.gif" style="display:inline;">',
			'</div>',
		'</div>'
	].join('\n');

	function include(src, callback) {
		var ext = src.split(/[\#\?]/)[0].split(".").pop().toLowerCase();
		var inc;
		if (ext == "css") {
			inc = document.createElement("link");
			inc.rel = "stylesheet";
			inc.type = "text/css";
			inc.media = "screen";
			try {
				inc.href = src;
				document.getElementsByTagName("head")[0].appendChild(inc);
				callback && callback({loaded: true});
			}
			catch (exception) {
				callback ? callback(exception) : console.log(src + " include exception: ", exception);
			}
		}
		else {
			inc = document.createElement("script");
			var timer, interval = 500, retries = 10;
			function check() {
				var loaded = inc.readyState && (inc.readyState == "loaded" || inc.readyState == "complete" || inc.readyState == 4);
				//console.log("check timer", loaded, retries)
				if (loaded || --retries <= 0) {
					timer = timer ? clearInterval(timer) : null;
					callback && callback({loaded:loaded});
				}
			}
			timer = callback ? setInterval(check, interval) : undefined;
			inc.onload = inc.onreadystatechange = check;
			try {
				inc.src = src;
				document.getElementsByTagName("head")[0].appendChild(inc);
			}
			catch (exception) {
				timer = timer ? clearInterval(timer) : null;
				callback ? callback(exception) : console.log(src + " include exception: ", exception);
			}
		}
	};
	
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

	function makeTrackUrl(thumb) {
		var text = getSelText();
		return urlPrefix+'/post?embed=' + encodeURIComponent(thumb.url)
			+ (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '')
			+ '&refUrl=' + encodeURIComponent(window.location.href)
			+ '&refTtl=' + encodeURIComponent(document.title)
			+ (text ? '&text=' + encodeURIComponent(text) : '');
	}
	
	function showForm(thumb) {
		var href = makeTrackUrl(thumb);
		//div.removeChild(contentDiv);
		//div.innerHTML += '<iframe id="whydContent" src="'+href+'"></iframe>';
		var whydPop = window.open(href, "whydPop", "height=330,width=510,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no");
	}
	
	function renderThumb(thumb) {
		var divThumb = document.createElement("div");
		divThumb.setAttribute("id", thumb.id);
		divThumb.setAttribute("class", "whydThumb");
		divThumb.setAttribute("title", thumb.title);
		var divCont = document.createElement("div");
		divCont.setAttribute("class", "whydCont");
		divCont.appendChild(thumb.element);
		var textNode = document.createTextNode(thumb.title);
		var title = document.createElement("p");
		//title.setAttribute("title", thumb.title);
		title.appendChild(textNode);
		divThumb.appendChild(divCont);
		divThumb.appendChild(title);
		var btnShareIt = document.createElement("img");
		btnShareIt.setAttribute("src", urlPrefix + "/images/btn-shareit.png");
		divThumb.appendChild(btnShareIt);
		return divThumb;
	}

	var thumbCounter = 0;
	var eidSet = {}; // to prevent duplicates
	var lastThumb = null;
	var contentDiv;

	function addThumb(thumb) {
		thumb.id = 'whydThumb' + (thumbCounter++);
		thumb.element = document.createElement("img");
		thumb.element.src = thumb.img;
		var divThumb = renderThumb(thumb);
		divThumb.onclick = function() {
			showForm(thumb);
		};
		contentDiv.appendChild(divThumb);
	}
	
	var pagePrefix = window.location.href.split(/[#\?]/).shift();
	var posPrefix = pagePrefix.lastIndexOf("/");
	pagePrefix = pagePrefix.substr(0, posPrefix) + "/";
	var pageRoot = pagePrefix.substr(0, pagePrefix.indexOf("/", 10));
	
	function getUrl(path) {
		if (path && path.length > 0 && path.indexOf("://") == -1)
			return (path[0] == "/" ? pageRoot : pagePrefix) + path;
		else
			return path;
	}

	function YoutubeDetector() {
		//console.log("Initializing Youtube Detector");
		var regex = ///https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/; //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
    	            /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;
		// HACK to skip non-video youtube links that are detected by the regex
		var toSkip = {"user":1, "videos":1, "movies":1, "my_videos":1, "my_subscriptions":1, "inbox":1, "account":1, "analytics":1, "my_videos_edit":1, "enhance":1, "audio":1, "music":1, "creators":1, "t":1, "dev":1, "testtube":1, "view_all_playlists":1};
		return function (url, cb) {
			//console.log("youtube url", url)
			var id = url.match(regex);
			//console.log("youtube url 2", id)
			if (id) {
				id = id.pop();
				if (!id || toSkip[id])
					return cb();
				var embed = {
					eid: id,
					url: url,
					img: "https://i.ytimg.com/vi/" + id + "/0.jpg",
					title: "Youtube video" // by default
				}
				var handlerId = 'youtubeHandler' + (new Date()).getTime();
				window[handlerId] = function(data) {
					//console.log("youtube api response", data);
					if (data && data.data)
						embed.title = data.data.title;
					cb(embed);
				};
				include("https://gdata.youtube.com/feeds/api/videos/"+id+"?v=2&alt=jsonc&callback="+handlerId);
			}
			else
				cb();
		};
	}

	function SoundCloudDetector() {
		//console.log("Initializing SoundCloud Detector");
		var regex = /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_]+\/[\w-_]+)/;
		// TODO: also support http://snd.sc/yp6VMo urls
		var scClientId = "eb257e698774349c22b0b727df0238ad";
		return function (url, cb) {
			var embed = {
				url: url,
				img: urlPrefix + "/images/cover-soundcloud.jpg",
				title: "SoundCloud Track" // by default
			};
			var timeout = null;
			function addMetadata(data) {
				if (timeout && data && embed && data.kind == "track") {
					clearTimeout(timeout);
					timeout = null;
					embed.eid = "" + data.id;
					embed.img = data.artwork_url || embed.img;
					embed.title = data.title || embed.title;
					if (embed.title.indexOf(" - ") == -1 && (data.user || {}).username)
						embed.title = data.user.username + " - " + embed.title;
					cb(embed);
				}
				else
					cb();
			}
			var id = url.match(regex);
			if (id) {
				id = id.pop();
				if (id.split("/").pop() == "sets")
					return cb();
				//console.log("detected sc id", id);
				embed.eid = id;
				var callbackFct = "scCallback_" + id.replace(/[-\/]/g, "__");
				window[callbackFct] = addMetadata;
				var url = encodeURIComponent("https://soundcloud.com/"+id);
				timeout = setTimeout(addMetadata, 2000);
				include('https://api.soundcloud.com/resolve.json?url='+url+'&client_id='+scClientId+'&callback=' + callbackFct);
			}
			else if (url.indexOf("soundcloud.com/player") != -1) {
				var url = decodeURIComponent(url.match(/url=([^\&\?]*)/).pop());
				//console.log("detected sc embed url", url);
				var splitted = url.split("?");
				var params = splitted.length > 1 ? splitted[1] + "&" : ""; // might include a secret_token
				var trackId = splitted[0].split("/").pop();
				//console.log("extracted sc embed id", trackId);
				var callbackFct = "scCallback_" + trackId.replace(/[-\/]/g, "__");
				window[callbackFct] = addMetadata;
				timeout = setTimeout(addMetadata, 2000);
				include("https://api.soundcloud.com/tracks/" + trackId + ".json?"+params+"client_id="+scClientId+"&callback="+callbackFct);
			}
			else
				cb();
		};
	}

	function VimeoDetector() {
		//console.log("Initializing Vimeo Detector");
		var regex = /https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/;
		return function (url, cb) {
			var embed = {
				url: url,
				title: "Vimeo video"
			};
			var id = url.match(regex);
			if (id) {
				embed.eid = id = id.pop();
				var callbackFct = "viCallback_" + id;
				window[callbackFct] = function(data) {
					if (data && data.length) {
						embed.title = embed.name = data[0].title;
						embed.img = data[0].thumbnail_medium;
						cb(embed);
					}
					else
						cb();
				};
				include("https://vimeo.com/api/v2/video/" + id + ".json?callback="+callbackFct);
			}
			else
				cb();
		};
	}

	function DailymotionDetector() {
		//console.log("Initializing Dailymotion Detector");
		var regex = /https?:\/\/(?:www\.)?dailymotion.com\/video\/([\w-_]+)/; // /https?:\/\/(?:www\.)?dailymotion.com\/embed\/video\/([\w-_]+)/,
		return function (url, cb) {
			var embed = {
				url: url,
				title: "Dailymotion video",
				id: (url.match(regex) || []).pop()
			};
			if (embed.id) {
				var callbackFct = "dmCallback_" + embed.id.replace(/[-\/]/g, "__");
				window[callbackFct] = function(data) {
					if (data) {
						embed.title = embed.name = data.title;
						embed.img = data.thumbnail_url; // "http://www.dailymotion.com/thumbnail/video/" + embed.id
					}
					cb(embed);
				};
				// specifying a HTTP/HTTPS protocol in the url provided as a parameter is mandatory
				var url = encodeURIComponent("http://www.dailymotion.com/embed/video/" + embed.id); // "k7lToiW4PjB0Rx2Pqxt";
				include("//www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
			}
			else
				cb();
		};
	}

	function DeezerDetector() {
		//console.log("Initializing Deezer Detector");
		var regex = /https?:\/\/(?:www\.)?deezer.com\/track\/([\w-_]+)/;
		return function (url, cb) {
			var embed = {
				url: url,
				title: "Deezer track",
				id: (url.match(regex) || []).pop()
			};
			if (embed.id) {
				var callbackFct = "dzCallback_" + embed.id.replace(/[-\/]/g, "__");
				window[callbackFct] = function(data) {
					if (data && !data.error) {
						embed.title = embed.name = data.artist.name + ' - ' + data.title;
						embed.img = data.album.cover;
					}
					cb(embed);
				};
				include('//api.deezer.com/track/' + embed.id + "?output=jsonp&callback=" + callbackFct);
			}
			else
				cb();
		};
	}

	function BandcampDetector() {
		//console.log("Initializing Bandcamp Detector");
		var regex = /([a-zA-Z0-9_\-]+).bandcamp\.com\/track\/([a-zA-Z0-9_\-]+)/;
		return function (url, cb) {
			var match = url.match(regex);
			cb((match || []).length < 3 ? null : {
				url: url,
				eid: match[1] + "/" + match[2],
				img: "//s0.bcbits.com/img/bclogo.png",
				title: match[1].replace(/[\-_]+/g, " ") + " - " + match[2].replace(/[\-_]+/g, " ")
			});
		};
	}

	function JamendoDetector() {
		//console.log("Initializing Jamendo Detector");
		var JAMENDO_CLIENT_ID = "2c9a11b9";
		return function (url, cb) {
			var embed = {
				url: url,
				title: "Jamendo",
				id: /jamendo.com\/.*track\/(\d+)/.test(url) ? RegExp.$1 : null,
			};
			if (embed.id) {
				var callbackFct = "jaCallback_" + embed.id.replace(/[-\/]/g, "__");
				window[callbackFct] = function(data) {
					data = data.results[0];
					embed.title = data.artist_name + ' - ' + data.name;
					embed.img = data.album_image;
					cb(embed);
				};
				include('//api.jamendo.com/v3.0/tracks?client_id=' + JAMENDO_CLIENT_ID + '&id=' + embed.id + '&callback=' + callbackFct);
			}
			else
				cb();
		};
	}

	var Mp3Detector = (function() {
		//console.log("Initializing Mp3 Detector");    
		var reg = /([^\/]+)\.(?:mp3|ogg)$/;
		var cover = urlPrefix + '/images/cover-audiofile.png';        
		return function(url, cb, e) {
			var title = (url.match(reg) || []).pop();
			title = !title ? "" : e.title || e.innerText || e.textContent || title;
			cb(title.length < 5 ? null : {
				eid: url,
				url: url,
				img: cover,
				title: title
			});
		};
	})();

  //============================================================================

	var prov = [
		new YoutubeDetector(),
		new SoundCloudDetector(),
		new VimeoDetector(),
		new DailymotionDetector(),
		new DeezerDetector(),
		new BandcampDetector(),
		new JamendoDetector(),
		Mp3Detector
	];

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
	
	function addEmbedThumb(e, p, callback) {
		var src = e.href || e.src || e.data;
		if (src) {
			src = unwrapFacebookLink(src);
			p(src, function(embed){
				if (embed) {
					embed.title = embed.title || e.textNode || e.title || e.alt || p.label;
					console.log("added", src, embed.title);
				}
				callback && callback(embed);
			}, e);
		}
		else
			callback && callback();
	}

	function initWhydBookmarklet() {

		console.log("initWhydBookmarklet...");

		var elementNames = ["iframe", "object", "embed", "a", "audio", "source"];
		var nEmbeds = 0;
		contentDiv = document.getElementById("whydContent");

		function whenDone(html) {
			document.getElementById("whydLoading").innerHTML = nEmbeds ? ""
				: "No tracks were detected on this page, sorry..." + (html || "");
			//if (nEmbeds == 1)
			//	showForm(lastThumb);
		}

		function detectEmbed(e, callback) {
			console.log("testing URL", e.href || e.src || e.data, "...");
			var remaining = prov.length;
			var detected = null;
			for (var p=0; p<prov.length; ++p)
				addEmbedThumb(e, prov[p], function(embed) {
					nEmbeds += embed ? 1: 0;
					var eid = embed && (embed.eid || embed.id);
					if (eid && !eidSet[eid])
						addThumb(detected = lastThumb = eidSet[eid] = embed);
					if (0 == --remaining)
						callback && callback(detected);
				});
		}

		function detectAllEmbeds() {
			detectEmbed({src:window.location.href}, function(found) {
				console.log("content page", found);
				/*if (found)
					showForm(lastThumb);
				else*/ {
					var toDetect = [];
					// list Bandcamp track URLs
					var bandcampPageUrl = document.querySelector && document.querySelector('meta[property="og:url"]');
					if (bandcampPageUrl){
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
					}
					// TODO: document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
					// list URLs found on the page
					for (var i in elementNames) {
						var elts = document.getElementsByTagName(elementNames[i]);
						for (var j=0; j<elts.length; ++j)
							elts[j] && toDetect.push(elts[j]);
					}
					// detect tracks from URLs
					(function processNext() {
						if (!toDetect.length)
							whenDone();
						else
							detectEmbed(toDetect.shift(), processNext);
					})()
				}	
			});
		}

		function getNodeText(node){
			return node.innerText || node.textContent;
		}

		function genSearchLink(title){
			return '<p style="margin-top:15px;">Search for '
				+ '<a href="http://whyd.com/search?q=' + encodeURIComponent(title) + '" target="_blank">'
				+ title + '</a> on Whyd</p>';
		}

		function detectFromTitle() {
			var title = document.title.replace(/[▶\<\>\"\']+/g, " ").replace(/[ ]+/g, " ");
			var titleParts = [" - Spotify", " | www.deezer.com"];
			for(var i in titleParts)
				if (title.indexOf(titleParts[i]) > -1)
					return genSearchLink(title.replace(titleParts[i], ""));
			return null;
		}

		function detectPandoraTrack(){
			if (window.location.href.indexOf("pandora.com") == -1)
				return null;
			console.log("detecting pandora track...");
			var artist = getNodeText(document.getElementsByClassName("playerBarArtist")[0] || {}),
				title = getNodeText(document.getElementsByClassName("playerBarSong")[0] || {});
			console.log("artist:", artist, ", title:", title);
			return artist && title ? genSearchLink(artist + " - " + title) : null;
		}

		var html = detectFromTitle() || detectPandoraTrack();

		var dzTrackId = (window.deezerAudioJSPlayer || {}).songId;
		if (dzTrackId)
			//showForm({url: "https://www.deezer.com/track/" + dzTrackId});
			detectEmbed({src:"https://www.deezer.com/track/" + dzTrackId});

		if(html && !dzTrackId)
			whenDone(html);
		else
			detectAllEmbeds();
	}
	/*
	(function loadNext(){
		if (toInclude.length)
			include(urlPrefix + toInclude.shift() + urlSuffix, loadNext);
		else initWhydBookmarklet();
	})();
	*/
	include(urlPrefix + "/css/bookmarklet.css" + urlSuffix, initWhydBookmarklet);
})();