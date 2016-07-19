function YoutubeIframePlayer(){
	return YoutubeIframePlayer.super_.apply(this, arguments);
}

(function() {
		console.log("_____----_________----_________----_________----_________----____", embedVars);

	var //IFRAME_HOST = "http://box.jie.fr", IFRAME_PATH = "/track.html",
		//IFRAME_HOST = "http://bestofmusics.tumblr.com", IFRAME_PATH = "",
		//IFRAME_HOST =  window.location.protocol + "//discman2k.appspot.com", IFRAME_PATH = "/prod.html",
		IFRAME_HOST =  window.location.protocol + "//d3gnsloen4jask.cloudfront.net",
		IFRAME_PATH = "/html/YoutubePlayerIframe.html";

	function Player(eventHandlers, embedVars) {

		var that = this;
		this.iframeReady = false;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Youtube";
		window.addEventListener('message', function(e) {
			if (e.origin === IFRAME_HOST) {
				var message = JSON.parse(e.data);
				var param = message.data[0];
				that.iframeReady = true;
		        //for (var i in message.data)
		        //	if (message.data[i] == "(object)")
		        //    message.data[i] = that;
		        if (param == "(player)")
		        	param = that;
				//console.log("[youtube-iframe-player] iframe says:", message.code, param);
				if (message.code == "onApiReady")
					that.safeCall("play", that.embedVars.videoId);
				else
					that.safeClientCall(message.code, param);
			}
		});
		this.isReady = true;
		this.safeClientCall("onApiReady", this);
	}

	Player.prototype.safeCall = function(fctName, param) {
		if (!this.iframeReady)
			return console.warn("YT-iframe not ready => ignoring call to", fctName);
		try {
			var args = Array.apply(null, arguments).slice(1); // exclude first arg (fctName)
			this.iframe.contentWindow.postMessage(
				JSON.stringify({code: fctName, data: args}), IFRAME_HOST + IFRAME_PATH
			);
		}
		catch(e) {
			console.error("YT safecall error", e, e.stack);
		}
	}

	Player.prototype.safeClientCall = function(fctName, param) {
		try {
			if (this.eventHandlers[fctName])
				this.eventHandlers[fctName](param);
		}
		catch(e) {
			console.error("YT safeclientcall error", e.stack);
		}
	}

	Player.prototype.getEid = function(url) {
		if (
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(url)
			|| /\/yt\/([a-zA-Z0-9_\-]+)/.test(url)
			|| /youtube\.com\/attribution_link\?.*v\%3D([^ \%]+)/.test(url)
		)
			return RegExp.lastParen;
	}

	Player.prototype.play = function(id) {
		var that = this;
		this.iframeReady = false;
		this.embedVars.videoId = id;
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.iframe = document.createElement('iframe');
		this.iframe.id = this.embedVars.playerId;
		var settings = {
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			//origin: this.embedVars.origin
		};
		this.iframe.style.border = "0";
		this.iframe.style.width = "100%";
		this.iframe.style.height = "100%";
		this.iframe.onload = function(){
			that.iframeReady = true;
		};
		this.iframe.setAttribute("src", IFRAME_HOST + IFRAME_PATH + "?" + Object.keys(settings).map(function(p){
			return p + "=" + encodeURIComponent(settings[p]);
		}).join("&"));
		this.embedVars.playerContainer.appendChild(this.iframe);
	}

	Player.prototype.pause = function() {
		this.safeCall('pause');
	}

	Player.prototype.resume = function() {
		this.safeCall('resume');
	}
	
	Player.prototype.stop = function() {
		this.iframeReady = false;
		this.safeCall("stop");
		this.iframe.setAttribute("src", "");
		this.embedVars.playerContainer.removeChild(this.iframe);
	}
	
	Player.prototype.getTrackPosition = function(callback) {
		this.safeCall('getTrackPosition'); // -> will call onTrackInfo()
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("setTrackPosition", pos);
	};
	
	Player.prototype.setVolume = function(vol) {
		this.safeCall('setVolume', vol);
	};

	//return Player;
	//inherits(YoutubeIframePlayer, Player);
	YoutubeIframePlayer.prototype = Player.prototype;
	YoutubeIframePlayer.super_ = Player;
})();
