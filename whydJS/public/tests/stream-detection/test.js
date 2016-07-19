/**
 * tests for playemjs
 * @author adrienjoly
 **/

 // DEPRECATED => TEST SUITE HAS MOVED AND IS MAINTAINED BY PLAYEMJS PROJECT

 var PlayemWrapper = new (function(){
	window.SOUNDCLOUD_CLIENT_ID = "eb257e698774349c22b0b727df0238ad";
	var PLAY_TIMEOUT = 6000,
		timeout,
		players = [ // defined in /js/playem-all.js (loaded in index.html)
			new BandcampPlayer({}),
			new SoundCloudPlayer({}),
			new YoutubePlayer({}, {playerContainer: document.getElementById("videocontainer")}),
		];
	function reset(){
		clearTimeout(timeout);
		for (var i in players) {
			var player = players[i];
			delete player.eventHandlers.onError;
			delete player.eventHandlers.onPlaying;
		}
	}
	function getPlayer(url){
		for (var i in players) {
			var player = players[i];
			var eId = player.getEid(url);
			if (eId)
				return player;
		}
	}
	this.detect = function(url, cb){
		var player = getPlayer(url);
		cb(player && player.getEid(url));
	};
	this.fetch = function(url, cb){
		var player = getPlayer(url);
		if (!player || !player.fetchMetadata)
			return cb();
		player.fetchMetadata(url, function(track){
			cb((track || {}).id);
		});
	};
	this.play = function(url, cb){
		reset();
		var player = getPlayer(url);
		var id = player && player.getEid(url);
		if (!id)
			return cb();
		var streamUrlPos = url.indexOf("#") + 1;
		if (streamUrlPos)
			id += "#" + url.substr(streamUrlPos);
		player.eventHandlers.onPlaying = function(player){
			reset();
			player.setTrackPosition(20);
			setTimeout(function(){
				player.stop();
				cb(true);
			}, 1000);
		}
		player.eventHandlers.onError = function(player){
			reset();
			console.log(player ? "error" : "timeout");
			setTimeout(cb);
		}
		window.soundManager.onready(function(){
			timeout = setTimeout(player.eventHandlers.onError, PLAY_TIMEOUT);
			player.play(id);
		});
	};
})();

var parseDetectors = function(jsCode){
	var FCT_DETECTOR = /function\s+(\w+)\s*\([^\)]*\)/g, scope = {
		urlPrefix: "",
	};
	function compileFct(fct){
		var fct = "" + fct; // make a copy
		for (var symbol in scope)
			fct = fct.replace(new RegExp(symbol, "g"), "__scope." + symbol);
		return new Function("__scope", "return " + fct)(scope);
	}
	function parseFunctionImpl(str){
		var start = str.indexOf("{"),
			level = 1, levelIncr = { "{": 1, "}": -1 };
		for(var i = start + 1; level > 0 && i < str.length; ++i)
			level += levelIncr[str.charAt(i)] || 0;
		return str.substring(start, i);
	}
	var parseFunctions = function(jsCode){
		var functions = {}, match;
		while(match = FCT_DETECTOR.exec(jsCode)){
			var fctDef = match[0], fctName = match[1];
			functions[fctName] = fctDef + parseFunctionImpl(jsCode.substr(match.index));
		}
		return functions;
	}
	return (function(){
		var fcts = {}, all = parseFunctions(jsCode);
		for (var fctName in all){
			if (fctName == "include")
				scope.include = compileFct(all[fctName]);
			else if (fctName.indexOf("Detector") != -1)
				fcts[fctName] = compileFct(all[fctName]);
		}
		return fcts;
	})();
};

function BookmarkletWrapper(srcElementId){
	var detectors = (function(){
		console.info("parsing detectors from bookmarklet_old.js...");
		var codeEl = document.getElementById(srcElementId).contentDocument.childNodes[0];
		return parseDetectors(codeEl.innerText || codeEl.textContent);
	})();
	return function(url, cb){
		var detNames = Object.keys(detectors);
		(function next(){
			var detName = detNames.shift();
			if (!detName)
				cb();
			else
				(new detectors[detName]())(url, function(embed){
					if (embed)
						cb(embed);
					else
						next();
				});
		})();
	};
}

function readFileLines(fileUrl, cb){
	$.get(fileUrl, function(txt){
		cb(txt.split("\n"));
	});
}

function detectStream(url, detectors, handler){
	(function next(i){
		var detector = detectors[i];
		if (!detector)
			return handler(); // no more detectors to check for this url
		handler(i, 2); // loading (2)
		detector.fct(url, function(result){
			handler(i, 0 + !!result); // error (0) or ok (1)
			next(i + 1);
		});
	})(0);
}

function detectStreams(urls, detectors, handler){
	(function nextUrl(i){
		if (i == urls.length)
			return handler();
		var url = urls[i].length && urls[i][0] != "#" && urls[i].split(/\s/)[0];
		if (!url)
			nextUrl(i + 1);
		else {
			console.info("url:", url);
			//handler(i, detectorIndex, 1); // loading
			detectStream(url, detectors, function(detectorIndex, state){
				//handler(i, detectorIndex, 0); // clear
				if (arguments.length)
					handler(i, detectorIndex, state);
				else
					nextUrl(i + 1);
			});
		}
	})(0);
}

function HtmlTable(id, rows, columns){
	var table = document.getElementById(id);
	table.innerHTML = Array.apply(null, Array(rows)).map(function(){
		return "<tr>" + Array.apply(null, Array(columns)).map(function(){
			return "<td></td>";
		}).join("") + "</tr>";
	}).join("");
	this.getCell = function(row, col){
		return table.getElementsByTagName("td")[arguments.length == 2 ? row * columns + col : row];
	}
}

console.log("Waiting for bookmarklet code to load...");
document.getElementById("bookmarkletCode").onload = function(){
	var detectors = [
	/*
		{ name: "ContentEmbed detect()",
		  fct: (function(){
			var detect = new ContentEmbed().extractEmbedRef; // defined in ContentEmbed.js (loaded in index.html)
			return function(url, cb){
				detect(url, function(track){
					cb(!!track.name);
				})
			};
		  })()
		},
		{ name: "Old Bookmarklet",
		  fct: new BookmarkletWrapper("bookmarkletCode") // new SoundCloudDetector()
		},
	*/
		{ name: "playemJS getEid()",
		  fct: PlayemWrapper.detect
		},
		{ name: "playemJS fetchMetadata()",
		  fct: PlayemWrapper.fetch
		},
		{ name: "playemJS2 play()",
		  fct: PlayemWrapper.play
		},
	];
	readFileLines("urls.txt", function parseFileLines(lines){
		var urls = 0;
		for(var i in lines)
			urls += (lines[i].length && lines[i][0] != "#");
		console.log("read", urls, "stream URLs from urls.txt");
		// table and headers
		var table = new HtmlTable("results", lines.length + 1, detectors.length + 1);
		[{name:"URL"}].concat(detectors).map(function(col, i){
			table.getCell(0, i).innerHTML = "<p style='background:lightgray;'>" + col.name;
		});
		lines.map(function(url, i){
			table.getCell(i + 1, 0).innerHTML = (url.charAt(0) == "#" ? "<b>" : "") + url;
		});
		// main process
		var SYMBOLS = ["&times;", "&check;", '<img src="/images/loader.gif">'];
		detectStreams(lines, detectors, function(r, c, result){
			if (arguments.length)
				table.getCell(r + 1, c + 1).innerHTML = SYMBOLS[result];
			else
				console.log("done.");
		});
	});
}
