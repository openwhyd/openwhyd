/* playemjs 0.1.8, commit: 5746dfd6bc3f12a4411f924f19808122284d918f */

// configuration

var USE_SWFOBJECT = window.USE_SWFOBJECT = true, //!!window.swfobject; // ... to embed youtube flash player
  PLAY_TIMEOUT = 10000;

window.$ = window.$ || function(){return window.$};
//$.html = $.html || function(){return $};
//$.remove = $.remove || function(){return $};

// utility functions

if (undefined == window.console) 
  window.console = {log:function(){}};

loader = new (function Loader() {
  var FINAL_STATES = {"loaded": true, "complete": true, 4: true},
    head = document.getElementsByTagName("head")[0],
    pending = {}, counter = 0;
  return {
    loadJSON: function(src, cb){
      //if (pending[src]) return cb && cb();
      //pending[src] = true;
      // cross-domain ajax call
      var xdr = new XMLHttpRequest();
      xdr.onload = function() {
        var data = xdr.responseText;
        try{
          data = JSON.parse(data);
        } catch(e){};
        cb(data);
        //delete pending[src];
      }
      xdr.open("GET", src, true);
      xdr.send();
    },
    includeJS: function(src, cb){
      var inc, nt;
      if (pending[src]) {
        if (cb) {
          nt = setInterval(function(){
            if (pending[src])
              return console.log("still loading", src, "...");
            clearInterval(nt);
            cb();
          }, 50);
        }
        return;
      }
      pending[src] = true;
      inc = document.createElement("script");
      //inc.async = "async";
      inc.onload = function(){
        if (!pending[src])
          return;
        delete pending[src];
        cb && setTimeout(cb, 1);
        delete inc.onload;
      };
      inc.onerror = function(e){
        e.preventDefault();
        inc.onload(e);
      };
      inc.onreadystatechange = function() {
        if (!inc.readyState || FINAL_STATES[inc.readyState])
          inc.onload();
      };
      try {
        inc.src = src;
        head.appendChild(inc);
      }
      catch(e){
        console.error("Error while including", src, e);
        cb(e);
      }
    },
    loadJSONP: function(src, cb){
      var callbackFct = "__loadjsonp__" + (counter++);
      window[callbackFct] = function(){
        cb.apply(window, arguments);
        delete window[callbackFct];
      };
      this.includeJS(src + (src.indexOf("?") == -1 ? "?" : "&") + "callback=" + callbackFct, function(){
        // if http request fails (e.g. 404 error / no content)
        setTimeout(window[callbackFct], 10);
      });
    },
  };
});

// EventEmitter

function EventEmitter() {
  this._eventListeners = {};
}

EventEmitter.prototype.on = function(eventName, handler){
  this._eventListeners[eventName] = (this._eventListeners[eventName] || []).concat(handler);
}

EventEmitter.prototype.emit = function(eventName){
  var i, args = Array.prototype.slice.call(arguments, 1), // remove eventName from arguments, and make it an array
    listeners = this._eventListeners[eventName];
  for (i in listeners)
    listeners[i].apply(null, args);
}

/**
 * Inherit the prototype methods from one constructor into another. (from Node.js)
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

/**
 * Plays a sequence of streamed audio/video tracks by embedding the corresponding players
 *
 * Events:
 * - "onError", {code,source}
 * - "onReady"
 * - "onPlay"
 * - "onPause"
 * - "onEnd"
 * - "onTrackInfo", track{}
 * - "onTrackChange", track{}
 * - "loadMore"
 */

function Playem(playemPrefs) {

  function Playem(playemPrefs) {

    EventEmitter.call(this);

    playemPrefs = playemPrefs || {};
    playemPrefs.loop = playemPrefs.hasOwnProperty("loop") ? playemPrefs.loop : true;

    var players = [], // instanciated Player classes, added by client
      i,
      exportedMethods,
      currentTrack = null,
      trackList = [],
      whenReady = null,
      playersToLoad = 0,
      progress = null,
      that = this,
      playTimeout = null,
      volume = 1;

    this.setPref = function(key, val){
      playemPrefs[key] = val;
    }

    function doWhenReady(player, fct) {
      var interval = null;
      function poll(){
        if (player.isReady && interval) {
          clearInterval(interval);
          fct();
        }
        else
          console.warn("PLAYEM waiting for", player.label, "...");
      }
      if (player.isReady)
        setTimeout(fct);
      else
        interval = setInterval(poll, 1000);
    }

    function addTrack(metadata, url) {
      var track = {
        index: trackList.length,
        metadata: metadata || {}
      };
      if (url)
        track.url = url;
      trackList.push(track);
      return track;
    }

    function addTrackById(id, player, metadata) {
      if (id) {
        var track = addTrack(metadata);
        track.trackId = id;
        track.player = player;
        track.playerName = player.label.replace(/ /g, "_");
        return track;
        //console.log("added:", player.label, "track", id, track/*, metadata*/);
      }
      else
        throw new Error("no id provided");
    }

    function searchTracks(query, handleResult){
      var expected = 0, i, currentPlayer;
      for (i = 0; i < players.length; i++) {
        currentPlayer = players[i];
        //Search for player extending the "searchTracks" method.
        if (typeof currentPlayer.searchTracks == 'function') {
          expected ++;
          currentPlayer.searchTracks(query, 5, function(results) {
            for (var i in results){
              handleResult(results[i]);
            }
            if (--expected === 0)
              handleResult(); // means: "i have no (more) results to provide for this request"
          });
        };
      };
    };

    function setVolume(vol) {
      volume = vol;
      callPlayerFct("setVolume", vol);
    }

    function stopTrack() {
      if (progress)
        clearInterval(progress);
      for (var i in players) {
        if (players[i].stop)
          players[i].stop();
        else
          players[i].pause();
      }
      try {
        soundManager.stopAll();
      } catch(e) {
        console.error("playem tried to stop all soundManager sounds =>", e);
      }
    }

    function playTrack(track) {
      //console.log("playTrack", track);
      stopTrack();
      currentTrack = track;
      delete currentTrack.trackPosition; // = null;
      delete currentTrack.trackDuration; // = null;
      that.emit("onTrackChange", track);
      if (!track.player)
        return that.emit("onError", {code:"unrecognized_track", source:"Playem", track:track});
      doWhenReady(track.player, function() {
        //console.log("playTrack #" + track.index + " (" + track.playerName+ ")", track);
        callPlayerFct("play", track.trackId);
        setVolume(volume);
        if (currentTrack.index == trackList.length-1)
          that.emit("loadMore");
        // if the track does not start playing within 7 seconds, skip to next track
        setPlayTimeout(function() {
          console.warn("PLAYEM TIMEOUT"); // => skipping to next song
          that.emit("onError", {code:"timeout", source:"Playem"});
          //exportedMethods.next();
        });
      });
    }

    function setPlayTimeout(handler) {
      if (playTimeout)
        clearTimeout(playTimeout);
      playTimeout = !handler ? null : setTimeout(handler, PLAY_TIMEOUT);
    }

    function callPlayerFct(fctName, param){
      try {
        return currentTrack.player[fctName](param);
      }
      catch(e) {
        console.warn("Player call error", fctName, e, e.stack);
      }
    }

    // functions that are called by players => to propagate to client
    function createEventHandlers (playemFunctions) {
      var eventHandlers = {
        onApiReady: function(player){
          //console.log(player.label + " api ready");
          if (whenReady && player == whenReady.player)
            whenReady.fct();
          if (0 == --playersToLoad)
            that.emit("onReady");
        },
        onEmbedReady: function(player) {
          //console.log("embed ready");
          setVolume(volume);
        },
        onBuffering: function(player) {
          setTimeout(function() {
            setPlayTimeout();
            that.emit("onBuffering");
          });
        },
        onPlaying: function(player) {
          //console.log(player.label + ".onPlaying");
          //setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
          setVolume(volume);
          setTimeout(function() {
            that.emit("onPlay");
          }, 1);
          if (player.trackInfo && player.trackInfo.duration)
            eventHandlers.onTrackInfo({
              position: player.trackInfo.position || 0,
              duration: player.trackInfo.duration
            });

          if (progress)
            clearInterval(progress);

          if (player.getTrackPosition) {
            //var that = eventHandlers; //this;
            progress = setInterval(function(){
              player.getTrackPosition(function(trackPos) {
                eventHandlers.onTrackInfo({
                  position: trackPos,
                  duration: player.trackInfo.duration || currentTrack.trackDuration
                });
              });
            }, 1000);
          }
        },
        onTrackInfo: function(trackInfo) {
          //console.log("ontrackinfo", trackInfo, currentTrack);
          if (currentTrack && trackInfo) {
            if (trackInfo.duration) {
              currentTrack.trackDuration = trackInfo.duration;
              setPlayTimeout();
            }
            if (trackInfo.position)
              currentTrack.trackPosition = trackInfo.position;          
          }
          that.emit("onTrackInfo", currentTrack);
        },
        onPaused: function(player) {
          //console.log(player.label + ".onPaused");
          setPlayTimeout();
          if (progress)
            clearInterval(progress);
          progress = null;
          //if (!avoidPauseEventPropagation)
          //  that.emit("onPause");
          //avoidPauseEventPropagation = false;
        },
        onEnded: function(player) {
          //console.log(player.label + ".onEnded");
          stopTrack();
          that.emit("onEnd");
          playemFunctions.next();
        },
        onError: function(player, error) {
          console.error(player.label + " error:", ((error || {}).exception || error || {}).stack || error);
          setPlayTimeout();
          that.emit("onError", error);
        }
      };
      // handlers will only be triggered is their associated player is currently active
      ["onEmbedReady", "onBuffering", "onPlaying", "onPaused", "onEnded", "onError"].map(function (evt){
        var fct = eventHandlers[evt];
        eventHandlers[evt] = function(player, x){
          if (currentTrack && player == currentTrack.player)
            return fct(player, x);
          /*
          else if (evt != "onEmbedReady")
            console.warn("ignore event:", evt, "from", player, "instead of:", currentTrack.player);
          */
        };
      });
      return eventHandlers;
    }

    // exported methods, mostly wrappers to Players' methods
    exportedMethods = {
      addPlayer: function (playerClass, vars) {
        playersToLoad++;
        var player = new playerClass(createEventHandlers(this, vars), vars);
        players.push(player);
        return player;
      },
      getPlayers: function(){
        return players;
      },
      getQueue: function() {
        return trackList;
      },
      clearQueue: function() {
        trackList = [];
      },
      addTrackByUrl: function(url, metadata) {
        var p, player, eid;
        for (p=0; p<players.length; ++p) {
          player = players[p];
          //console.log("test ", player.label, eid);
          eid = player.getEid(url);
          if (eid)
            return addTrackById(eid, player, metadata);
        }
        return addTrack(metadata, url);
      },
      play: function(i) {
        playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
      },
      pause: function() {
        callPlayerFct("pause");
        that.emit("onPause");
      },
      stop: stopTrack,
      resume: function() {
        callPlayerFct("resume");
      },
      next: function() {
        if (playemPrefs.loop || currentTrack.index + 1 < trackList.length)
          playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
      },
      prev: function() {
        playTrack(trackList[(trackList.length + currentTrack.index - 1) % trackList.length]);
      },
      seekTo: function(pos) {
        if ((currentTrack || {}).trackDuration)
          callPlayerFct("setTrackPosition", pos * currentTrack.trackDuration);
      },
      setVolume: setVolume,
      searchTracks : searchTracks
    };
    //return exportedMethods;
    for (i in exportedMethods)
      this[i] = exportedMethods[i];
  }

  inherits(Playem, EventEmitter);

  return new Playem();
};

try{
  module.exports = Playem;
}catch(e){};
function AudioFilePlayer(){
  return AudioFilePlayer.super_.apply(this, arguments);
}

(function() {

  /*
  loader.includeJS("/js/soundmanager2.js", function() { //-nodebug-jsmin
    console.log("loaded mp3 player");
    soundManager.setup({
      url: '/swf/', //sound manager swf directory
      flashVersion: 9,
      onready: function() {
        console.log("mp3 player is ready");
        //that.isReady = true;
        soundManager.isReady = true;
        //eventHandlers.onApiReady && eventHandlers.onApiReady(that);
      }
    });
  });
  */

  var EVENT_MAP = {
    "onplay": "onPlaying",
    "onresume": "onPlaying",
    "onpause": "onPaused",
    "onstop": "onPaused",
    "onfinish": "onEnded"
  };

  function Player(eventHandlers, embedVars) {  
    this.label = 'Audio file';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.element = null;
    this.widget = null;
    this.isReady = false;
    this.trackInfo = {};
    var i, loading, that = this;

    this.soundOptions = {
      id: null,
      url: null,
      autoLoad: true,
      autoPlay: true,
      ontimeout: function(e) {
        //console.log("AudioFilePlayer timeout event:", e);
        that.eventHandlers.onError && that.eventHandlers.onError(that, {code:"timeout", source:"AudioFilePlayer"});
      }
    };

    for (i in EVENT_MAP)
      (function(i) {
        that.soundOptions[i] = function() {
          //console.log("event:", i, this);
          var handler = eventHandlers[EVENT_MAP[i]];
          handler && handler(that);
        }
      })(i);

    loading = setInterval(function(){
      try {
        if (window["soundManager"]) {
          clearInterval(loading);
          that.isReady = true;
          eventHandlers.onApiReady && eventHandlers.onApiReady(that);
        }
      }
      catch (e) {
        that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"AudioFilePlayer", exception:e});
      };
    }, 200);
  }

  Player.prototype.getEid = function(url) {
    url = (url || "").split("#").pop();
    if (!url)
      return null;
    var ext = url.split("?")[0].split(".").pop().toLowerCase();
    return (ext == "mp3" || ext == "ogg") ? url.replace(/^\/fi\//, "") : null;
  }
  
  Player.prototype.fetchMetadata = function(url, cb){
    url = this.getEid(url);
    if (!url)
      return cb();
    cb({
      id: url.replace(/^\/fi\//, ""),
      title: url.split("/").pop().split("?")[0]
    });
    // TODO : also use getTrackInfo()
  }

  Player.prototype.getTrackInfo = function(callback) {
    var that = this, i = setInterval(function() {
      //console.log("info", that.widget.duration)
      if (that.widget && that.widget.duration) {
        clearInterval(i);
        callback(that.trackInfo = {
          duration: that.widget.duration / 1000, // that.widget.durationEstimate / 1000
          position: that.widget.position / 1000
        });
        //that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.widget);
      }
    }, 500);
  }

  Player.prototype.getTrackPosition = function(callback) {
    var that = this;
    //console.log("position", that.widget.position)
    this.getTrackInfo(function(){
      callback(that.trackInfo.position);
      that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
    });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
  };
  
  Player.prototype.embed = function(vars) {
    if (!vars || !vars.trackId)
      return;
    //console.log("AudioFilePlayer embed vars:", vars);
    this.embedVars = vars = vars || {};
    this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
    this.soundOptions.url = vars.trackId.replace(/^\/fi\//, ""); // remove eId prefix /fi/ if necessary
    this.trackInfo = {};
    if (this.widget) {
      this.pause();
      this.widget = null;
      delete this.widget;
    }
    //console.log("-> soundManager parameters", this.soundOptions);
    this.widget = soundManager.createSound(this.soundOptions);
    //console.log("-> soundManager instance", !!this.widget);
    this.eventHandlers.onEmbedReady && this.eventHandlers.onEmbedReady(this);
    this.eventHandlers.onTrackInfo && this.getTrackInfo(this.eventHandlers.onTrackInfo);
    this.play();
  }

  Player.prototype.play = function(id) {
    //console.log("mp3 play", id)
    this.isReady && this.embed({trackId:id});
  }

  Player.prototype.resume = function() {
    this.isReady && this.widget && this.widget.resume();
  }

  Player.prototype.pause = function() {
    try {
      this.isReady && this.widget && this.widget.pause();
    }
    catch(e) {
      console.error(e.stack);
    }
  }

  Player.prototype.stop = function() {
    this.widget && this.widget.stop();
  }

  Player.prototype.setVolume = function(vol) {
    if (this.widget && this.widget.setVolume && this.soundOptions)
      /*this.widget*/soundManager.setVolume(this.soundOptions.id, 100 * vol);
  }

  //return Player;
  //inherits(AudioFilePlayer, Player);
  AudioFilePlayer.prototype = Player.prototype;
  AudioFilePlayer.super_ = Player;
})();

try{
  module.exports = AudioFilePlayer;
}catch(e){};
window.$ = window.$ || function(){return window.$};
$.getJSON = $.getJSON || function(url,cb){
  var cbName = "_cb_" + Date.now();
  url = url.replace("callback=?", "callback=" + cbName);
  window[cbName] = function(){
    //console.log(url, "ok");
    cb.apply(window, arguments);
    delete window[cbName];
  };
  //console.log(url, "...");
  loader.includeJS(url);
};

function BandcampPlayer(){
  return BandcampPlayer.super_.apply(this, arguments);
}

(function(API_KEY){

  var API_PREFIX = '//api.bandcamp.com/api',
      API_SUFFIX = '&key=' + API_KEY + '&callback=?';

  function isBandcampEid(url) {
    return url.indexOf("/bc/") == 0 && url.substr(4);
  }

  function extractArtistAndTrackFromUrl(url){
    var match = url.match(isBandcampEid(url) ? (/\/bc\/([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/) : /([a-zA-Z0-9_\-]+).bandcamp\.com\/track\/([a-zA-Z0-9_\-]+)/);
    return (match || []).length === 3 && match.slice(1);
  }

  function makeEidFromUrl(url){
    var match = extractArtistAndTrackFromUrl(url),
        streamUrl = url.split("#")[1];
    return match && (match[0] + "/" + match[1] + (streamUrl ? "#" + streamUrl : ""));
  }

  function isStreamUrl(url) {
    return url.indexOf("bandcamp.com/download/track") != -1;
  }

  function fetchStreamUrl(url, cb){
    url = "http://" + url.split("//").pop();
    $.getJSON(API_PREFIX + '/url/1/info?url=' + encodeURIComponent(url) + API_SUFFIX, function(data) {
      var trackId = (data || {}).track_id;
      if (!trackId) {
        //console.error("bandcamp: unexpected result from /url/1/info:", data);
        return cb(data);
      }
      $.getJSON(API_PREFIX + '/track/3/info?track_id=' + trackId + API_SUFFIX, function(data) {
        cb(null, (data || {}).streaming_url);
      });
    });
  }

  //============================================================================
  function Player(eventHandlers) {
    var self = this, loading = null;
    this.label = 'Bandcamp';
    this.eventHandlers = eventHandlers || {};
    this.currentTrack = {position: 0, duration: 0};
    this.sound = null;
    this.isReady = false;
    loading = setInterval(function(){
      if (!!window["soundManager"]) {
        clearInterval(loading);
        self.isReady = true;
        self.clientCall("onApiReady", self);
      }
    }, 200);
  }
  
  //============================================================================
  Player.prototype.clientCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    //try {
      return (this.eventHandlers[fctName] || function(){}).apply(null, args);
    //}
    //catch(e) {
    //  console.error(e.stack);
    //}
  }
  
  //============================================================================
  Player.prototype.soundCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    return ((this.sound || {})[fctName] || function(){}).apply(null, args);
  }
  
  //============================================================================
  Player.prototype.getEid = function(url) {
    return isBandcampEid(url) || makeEidFromUrl(url);
  }

  Player.prototype.fetchMetadata = function(url, cb) {
    var match = extractArtistAndTrackFromUrl(url);
    cb(!match ? null : {
      id: makeEidFromUrl(url),
      img: "//s0.bcbits.com/img/bclogo.png", // TODO: fetch actual cover art and other metadata
      title: match[0].replace(/[\-_]+/g, " ") + " - " + match[1].replace(/[\-_]+/g, " ")
    });
  };

  Player.prototype.playStreamUrl = function(url) {
    var self = this;
    if (!url)
      return self.clientCall("onError", self, {source:"BandcampPlayer", code:"no_stream"});
    url = "http://" + url.split("//").pop();
    self.sound = soundManager.createSound({
      id: '_playem_bc_' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,
      whileplaying: function() {
        self.clientCall("onTrackInfo", self.currentTrack = {
          position: self.sound.position / 1000,
          duration: self.sound.duration / 1000
        });
      },
      onplay: function(a) {
        self.clientCall("onPlaying", self);
      },
      onresume: function() {
        self.clientCall("onPlaying", self);
      }, 
      onfinish: function() {
        self.clientCall("onEnded", self);
      }
    });
  }

  //============================================================================
  Player.prototype.play = function(id) {
    var self = this;
    if (isStreamUrl(id))
      this.playStreamUrl(id);
    else
      fetchStreamUrl(id, function(err, url){
        if (err || !url)
          self.clientCall("onError", self, { source: "BandcampPlayer", error: (err || {}).error_message }); // e.g. "bad api key"
        else
          this.playStreamUrl(url);
      });
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    this.soundCall("pause");
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    this.soundCall("stop");
    this.soundCall("destruct");
    this.sound = null;
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    this.soundCall("resume");
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    this.soundCall("setPosition", Math.round(pos * 1000));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    this.soundCall("setVolume", Math.round(vol * 100));
  }
  
  //============================================================================
  //return Player;
  //inherits(BandcampPlayer, Player);
  BandcampPlayer.prototype = Player.prototype;
  BandcampPlayer.super_ = Player;
})('vatnajokull');

try{
  module.exports = BandcampPlayer;
}catch(e){};
function DailymotionPlayer(){
  return DailymotionPlayer.super_.apply(this, arguments);
}

(function() {

  var regex = /(dailymotion.com(?:\/embed)?\/video\/|\/dm\/)([\w-]+)/,
    ignoreEnded = 0;
    EVENT_MAP = {
      0: "onEnded",
      1: "onPlaying",
      2: "onPaused"
    };

  function Player(eventHandlers, embedVars) {
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.label = "Dailymotion";
    this.element = null;
    this.isReady = false;
    this.trackInfo = {};
    var that = this;

    window.onDailymotionStateChange = function(newState) {
      if (newState > 0 || !ignoreEnded)
        that.safeClientCall(EVENT_MAP[newState], that);
      else
        --ignoreEnded;
      /*if (newState == 1) {
        console.log("getduration", that.element.getDuration());
        that.trackInfo.duration = that.element.getDuration(); //that.safeCall("getDuration");
      }*/
    };

    window.onDailymotionError = function(error) {
      console.log("DM error", error)
      that.safeClientCall("onError", that, {source:"DailymotionPlayer", data: error});
    }

    window.onDailymotionAdStart = function(){
      that.safeClientCall("onBuffering", that);
    }

    /*window.onDailymotionVideoProgress = function(a) {
      console.log("progress", a)
    }*/

    window.onDailymotionPlayerReady = function(playerId) {
      that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
      that.element.addEventListener("onStateChange", "onDailymotionStateChange");
      that.element.addEventListener("onError", "onDailymotionError");
      that.element.addEventListener("onLinearAdStart", "onDailymotionAdStart");
      //that.element.addEventListener("onLinearAdComplete", "onDailymotionAdComplete");
      //that.element.addEventListener("onVideoProgress", "onDailymotionVideoProgress");
    }
    
    that.isReady = true;
    that.safeClientCall("onApiReady", that);
  }
  
  Player.prototype.safeCall = function(fctName, p1, p2) {
    //return (this.element || {})[fctName] && this.element[fctName](p1, p2);
    var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
      fct = (this.element || {})[fctName];
    return fct && fct.apply(this.element, args);
  }
  
  Player.prototype.safeClientCall = function(fctName, p1, p2) {
    try {
      return this.eventHandlers[fctName] && this.eventHandlers[fctName](p1, p2);
    }
    catch(e) {
      console.error("DM safeclientcall error", e.stack);
    }
  }

  Player.prototype.embed = function (vars) {
    this.embedVars = vars = vars || {};
    this.embedVars.playerId = this.embedVars.playerId || 'dmplayer';
    this.trackInfo = {};
    this.element = document.createElement("object");
    this.element.id = this.embedVars.playerId;
    this.embedVars.playerContainer.appendChild(this.element);

    var paramsQS,
      paramsHTML,
      embedAttrs, 
      params = {
        allowScriptAccess: "always"
      },
      atts = {
        id: this.embedVars.playerId
      },
      swfParams = {
        //api: "postMessage",
        info: 0,
        logo: 0,
        related: 0,
        autoplay: 1,
        enableApi: 1,
        showinfo: 0,
        hideInfos: 1,
        chromeless: 1,
        withLoading: 0,
        playerapiid: this.embedVars.playerId
      };

    paramsQS = Object.keys(swfParams).map(function(k){ // query string
      return k + "=" + encodeURIComponent(swfParams[k]);
    }).join("&");

    paramsHTML = Object.keys(params).map(function(k){
      return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
    }).join();

    embedAttrs = {
      id: this.embedVars.playerId,
      width: this.embedVars.width || '200',
      height: this.embedVars.height || '200',
      type: "application/x-shockwave-flash",
      data: window.location.protocol+'//www.dailymotion.com/swf/'+this.embedVars.videoId+'?'+paramsQS,
      innerHTML: paramsHTML
    };
    if (USE_SWFOBJECT) {
      swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/js/swfobject_expressInstall.swf", null, params, atts);
    }
    else {
      $(this.element).attr(embedAttrs);
    }
    $(this.element).show();
    this.safeClientCall("onEmbedReady");
  }

  Player.prototype.getEid = function(url) {
    return regex.test(url) && RegExp.lastParen;
  }

  function fetchMetadata(id, cb){
    // specifying a HTTP/HTTPS protocol in the url provided as a parameter is mandatory
    var url = encodeURIComponent("http://www.dailymotion.com/embed/video/" + id),
      callbackFct = "dmCallback_" + id.replace(/[-\/]/g, "__");
    window[callbackFct] = function(data) {
      cb(!data || !data.title ? null : {
        id: id,
        title: data.title,
        img: data.thumbnail_url,
      });
    };
    loader.includeJS("//www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var id = this.getEid(url);
    if (!id)
      return cb();
    fetchMetadata(id, cb);
  }

  Player.prototype.play = function(id) {
    if (!this.currentId || this.currentId != id) {
      this.embedVars.videoId = id;
      this.embed(this.embedVars);
    }
  }

  Player.prototype.pause = function(vol) {
    this.safeCall("pauseVideo");
  };

  Player.prototype.resume = function(vol) {
    this.safeCall("playVideo");
  };
  
  Player.prototype.stop = function(vol) {
    ++ignoreEnded;
    //this.element.stopVideo();
    this.safeCall("clearVideo");
    if ((this.element || {}).parentNode)
      this.element.parentNode.removeChild(this.element);
  };
  
  Player.prototype.getTrackPosition = function(callback) {
    this.trackInfo.duration = this.safeCall("getDuration");
    callback && callback(this.safeCall("getCurrentTime"));
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.safeCall("seekTo", pos);
  };
  
  Player.prototype.setVolume = function(vol) {
    this.safeCall("setVolume", vol * 100);
  };

  //return Player;
  //inherits(DailymotionPlayer, Player);
  DailymotionPlayer.prototype = Player.prototype;
  DailymotionPlayer.super_ = Player;
})();

try{
  module.exports = DailymotionPlayer;
}catch(e){};
// WARNING:
// The following global constants must be set before instantiation:
//             DEEZER_APP_ID and DEEZER_CHANNEL_URL

window.showMessage = window.showMessage || function(msg) {
  console.warn("[showMessage]", msg);
};

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};
$.append = $.append || function(html){document.write(html);};

function DeezerPlayer(){
  return DeezerPlayer.super_.apply(this, arguments);
}

(function(){

  // CONSTANTS
  var SDK_URL = 'https://cdns-files.deezer.com/js/min/dz.js',
      IS_LOGGED = false,
      URL_REG = /(deezer\.com\/track|\/dz)\/(\d+)/,
      EVENT_MAP = {
        player_play: 'onPlaying',
        player_paused: 'onPaused',
        track_end: 'onEnded'
      };

  //============================================================================
  function Player(eventHandlers) {
    
    var self = this;
    
    this.label = 'Deezer';
    this.eventHandlers = eventHandlers || {};    
    this.currentTrack = {position: 0, duration: 0};
        
    loadSDK(function() {
      self.isReady = true;
      try {
        eventHandlers.onApiReady(self);
      } catch(e) {};
    });
  }
  
  //============================================================================
  Player.prototype.isLogged = function() {
    return IS_LOGGED;
  }
  
  //============================================================================
  Player.prototype.getEid = function(url) {
    return URL_REG.test(url) && RegExp.lastParen;
  }

  function fetchMetadata(id, cb){
    var callbackFct = "dzCallback_" + id.replace(/[-\/]/g, "__");
    window[callbackFct] = function(data){
      delete window[callbackFct];
      cb(!data || !data.album ? null : {
        id: id,
        title: data.artist.name + ' - ' + data.title,
        img: data.album.cover,
      });
    }
    loader.includeJS("//api.deezer.com/track/" + id + "?output=jsonp&callback=" + callbackFct);
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var id = this.getEid(url);
    if (!id)
      return cb();
    fetchMetadata(id, cb);
  }

  //============================================================================
  Player.prototype.play = function(id) {
    var self = this;
    this.init(function() {
      if (IS_LOGGED) {
        DZ.player.playTracks([id], 0);
      } else {
        DZ.api('/track/' + id, function(data) {
          showMessage(
            'This is a 30 secs preview. ' + 
            '<a href="javascript:DeezerPlayer.login()">' +
            'Connect to Deezer</a> to listen to the full track.'
          );
          self.sound = createSound(self, data.preview)
        });
      }    
    });
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    if (this.sound) {
      this.sound.pause();
    } else {
      DZ.player.pause();
    }
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    console.log('DEEZER STOP');
    if (!this.isReady)
      return;
    if (this.sound) {
      this.sound.stop();
      this.sound.destruct();
      this.sound = null;
    } else {
      //DZ.player.pause();
      document.getElementById('dz-root').innerHTML = '';
    }    
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    if (this.sound) {
      this.sound.resume();
    } else {
      DZ.player.play();
    }
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    if (this.sound)
      this.sound.setPosition(Math.round(pos * 1000));
    else
      DZ.player.seek(Math.round(100 * pos / this.currentTrack.duration));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    if (this.sound)
      this.sound.setVolume(Math.round(vol * 100));
    else
      DZ.player.setVolume(Math.round(vol * 100));
  }
    
  //============================================================================  
  function loadSDK(cb) {
    var dz;
    if (window.DZ)
      return cb();
    if (!document.getElementById('dz-root')) {
      dz = document.createElement('div');
      dz.id = 'dz-root';
      document.getElementsByTagName("body")[0].appendChild(dz);
    }
    loader.includeJS(SDK_URL, cb);
  }

  //============================================================================
  Player.prototype.init = function(onload) {
    var self = this;
    DZ.init({
      appId: DEEZER_APP_ID,
      channelUrl: DEEZER_CHANNEL_URL,
      player: {
        onload: function(){
          if (window.location.protocol === "https:")
            DZ.override_https();
          DZ.getLoginStatus(function(response) {
            IS_LOGGED = response.userID;
            hookHandlers(self);
            onload.call(null, arguments);
          });
        }
      }
    });
  };
  
  //============================================================================
  function hookHandlers(self) {
    DZ.Event.subscribe('player_position', function(eventObject){
      var onTrackInfoHandler = self.eventHandlers.onTrackInfo, 
          onEndedHandler = self.eventHandlers.onEnded,
          position = eventObject[0],
          duration = eventObject[1];
      if (onTrackInfoHandler) {
        self.currentTrack = {position: position, duration: duration};
        onTrackInfoHandler(self.currentTrack);
      }
      if ((duration - position <= 1.5) && onEndedHandler)
        onEndedHandler(self);
    });
    function createHandler(e) {
      return function() {
        var handler = self.eventHandlers[EVENT_MAP[e]];
        handler && handler(self);
      };
    }
    for (var e in EVENT_MAP)
      DZ.Event.suscribe(e, createHandler(e));
  }
  
  //============================================================================
  function createSound(self, url) {
    return soundManager.createSound({
      id: 'deezerSound' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,
      whileplaying: function() {
        if (self.sound)
          self.currentTrack = {
            position: self.sound.position / 1000,
            duration: self.sound.duration / 1000
          };
        if (self.eventHandlers.onTrackInfo)
          self.eventHandlers.onTrackInfo(self.currentTrack);
      },
      onplay: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      },
      onresume: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      }, 
      onfinish: function() {
        if (self.eventHandlers.onEnded)
          self.eventHandlers.onEnded(self);
      }
    });    
  }
  
  //============================================================================  
  DeezerPlayer.login = function() {
    DZ.login(function(response) {
      if (response.userID) {
        IS_LOGGED = true;
        showMessage('Login successful. Your Deezer tracks will be full length from now on!');
      } else {
        showMessage('Deezer login unsuccesful.', true);
      }
    }, {perms: 'email'});
  }
  
  //============================================================================
  //return Player;
  //inherits(DeezerPlayer, Player);
  DeezerPlayer.prototype = Player.prototype;
  DeezerPlayer.super_ = Player;
})();

try{
  module.exports = DeezerPlayer;
}catch(e){};
// JamendoPlayer. JAMENDO_CLIENT_ID must be defined

function JamendoPlayer(){
  return JamendoPlayer.super_.apply(this, arguments);
}

(function() {

  var EVENT_MAP = {
    "onplay": "onPlaying",
    "onresume": "onPlaying",
    "onpause": "onPaused",
    "onstop": "onPaused",
    "onfinish": "onEnded"
  };

  function Player(eventHandlers, embedVars) {  
    this.label = 'Jamendo track';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.element = null;
    this.widget = null;
    this.isReady = false;
    this.trackInfo = {};
    var i, loading, that = this;

    this.soundOptions = {
      id: null,
      url: null,
      autoLoad: true,
      autoPlay: true,
      ontimeout: function(e) {
        //console.log("JamendoPlayer timeout event:", e);
        that.eventHandlers.onError && that.eventHandlers.onError(that, {code:"timeout", source:"JamendoPlayer"});
      }
    };

    for (i in EVENT_MAP)
      (function(i) {
        that.soundOptions[i] = function() {
          //console.log("event:", i, this);
          var handler = eventHandlers[EVENT_MAP[i]];
          handler && handler(that);
        }
      })(i);

    loading = setInterval(function(){
      try {
        if (window["soundManager"]) {
          clearInterval(loading);
          that.isReady = true;
          eventHandlers.onApiReady && eventHandlers.onApiReady(that);
        }
      }
      catch (e) {
        that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"JamendoFilePlayer", exception:e});
      };
    }, 200);
  }

  Player.prototype.getEid = function(url) {
    return /jamendo.com\/.*track\/(\d+)/.test(url) || /\/ja\/(\d+)/.test(url) ? RegExp.$1 : null;
  }

  function fetchMetadata(url, id, cb){
    var callbackFct = "jaCallback_" + id.replace(/[-\/]/g, "__");
    window[callbackFct] = function(data) {
      delete window[callbackFct];
      cb(!data || !data.results || !data.results.length ? null : {
        id: data.results[0].id,
        img: data.results[0].album_image,
        title: data.results[0].artist_name + ' - ' + data.results[0].name,
      });
    };
    loader.includeJS('//api.jamendo.com/v3.0/tracks?client_id=' + JAMENDO_CLIENT_ID + '&id=' + id + '&callback=' + callbackFct);
  }

  Player.prototype.fetchMetadata = function(url, cb) {
    var id = this.getEid(url);
    if (!id)
      return cb();
    fetchMetadata(url, id, cb);
  };
  
  Player.prototype.getTrackInfo = function(callback) {
    var that = this, i = setInterval(function() {
      if (that.widget && that.widget.duration) {
        clearInterval(i);
        callback(that.trackInfo = {
          duration: that.widget.duration / 1000,
          position: that.widget.position / 1000
        });
      }
    }, 500);
  }

  Player.prototype.getTrackPosition = function(callback) {
    var that = this;
    this.getTrackInfo(function(){
      callback(that.trackInfo.position);
      that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
    });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
  };

  Player.prototype.embed = function(vars) {
    if (!vars || !vars.trackId)
      return;
    this.embedVars = vars = vars || {};
    this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
    this.soundOptions.url = "//api.jamendo.com/v3.0/tracks/file?client_id=" + JAMENDO_CLIENT_ID + "&action=stream&audioformat=mp32&id=" + vars.trackId;
    this.trackInfo = {};
    if (this.widget) {
      this.pause();
      this.widget = null;
      delete this.widget;
    }
    this.widget = soundManager.createSound(this.soundOptions);
    this.eventHandlers.onEmbedReady && this.eventHandlers.onEmbedReady(this);
    this.eventHandlers.onTrackInfo && this.getTrackInfo(this.eventHandlers.onTrackInfo);
    this.play();
  }

  Player.prototype.play = function(id) {
    this.isReady && this.embed({trackId:id});
  }

  Player.prototype.resume = function() {
    this.isReady && this.widget && this.widget.resume();
  }

  Player.prototype.pause = function() {
    try {
      this.isReady && this.widget && this.widget.pause();
    }
    catch(e) {
      console.error("jamendo error:", e, e.stack);
    }
  }

  Player.prototype.stop = function() {
    this.widget && this.widget.stop();
  }

  Player.prototype.setVolume = function(vol) {
    if (this.widget && this.widget.setVolume && this.soundOptions)
      soundManager.setVolume(this.soundOptions.id, 100 * vol);
  }

  JamendoPlayer.prototype = Player.prototype;
  JamendoPlayer.super_ = Player;
})();

try{
  module.exports = JamendoPlayer;
}catch(e){};
//loader.includeJS("https://w.soundcloud.com/player/api.js");

//please set SOUNDCLOUD_CLIENT_ID before instanciation

function SoundCloudPlayer(){
  return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
  var EVENT_MAP = {
      "onplay": "onPlaying",
      "onresume": "onPlaying",
      "onpause": "onPaused",
      "onstop": "onPaused",
      "onfinish": "onEnded"
    },
    ERROR_EVENTS = [
      "onerror",
      "ontimeout",
      "onfailure",
      "ondataerror"
    ],
    RESOLVE_URL = "https://api.soundcloud.com/resolve.json";

  function Player(eventHandlers, embedVars) {  
    this.label = 'SoundCloud';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.element = null;
    this.widget = null;
    this.isReady = false;
    this.trackInfo = {};
    this.soundOptions = {autoPlay:true};

    var that = this;

    this.callHandler = function(name, params) {
      try {
        eventHandlers[name] && eventHandlers[name](params);//.apply(null, params);
      }
      catch (e) {
        console.error("SC error:", e, e.stack);
      }
    };

    function init() {
      for (var i in EVENT_MAP)
        (function(i) {
          that.soundOptions[i] = function() {
            //console.log("SC event:", i /*, this*/);
            var handler = eventHandlers[EVENT_MAP[i]];
            handler && handler(that);
          }
        })(i);
      ERROR_EVENTS.map(function(evt){
        that.soundOptions[evt] = function(e) {
          console.error("SC error:", evt, e, e.stack);
          that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
        };
      });
      that.isReady = true;
      try {
        window.soundManager.onready(function() {
          that.callHandler("onApiReady", that);
        });
      }
      catch(e){
        console.warn("warning: soundManager was not found => playem-soundcloud will not be able to stream music");
        that.callHandler("onApiReady", that);
      }
    }

    if (window.SC)
      init();
    else {
      loader.includeJS("https://connect.soundcloud.com/sdk.js", function(){
        window.SC.initialize({client_id: window.SOUNDCLOUD_CLIENT_ID});
        init();
      });
    }
  }

  Player.prototype.safeCall = function(fctName, param) {
    try {
      //console.log("SC safecall", fctName);
      if (this.widget && this.widget[fctName])
        this.widget[fctName](param);
    }
    catch(e) {
      console.error("SC safecall error", e.stack);
    }
  }

  function unwrapUrl(url){
    return /(soundcloud\.com)\/player\/?\?.*url\=([^\&\?]+)/.test(url) ? decodeURIComponent(RegExp.lastParen) : url.replace(/^\/sc\//, "http://soundcloud.com/");
  }

  Player.prototype.getEid = function(url) {
    url = unwrapUrl(url);
    if (/(soundcloud\.com)(\/[\w-_\/]+)/.test(url)) {
      var parts = RegExp.lastParen.split("/");
      return parts.length === 3 && /*parts[1] !== "pages" &&*/ RegExp.lastParen;
    }
    else if (/snd\.sc\/([\w-_]+)/.test(url))
      return RegExp.lastMatch;
    // => returns:
    // - /tracks/<number> (ready to stream)
    // - or /<artistname>/<tracktitle>
    // - or snd.sc/<hash>
    // or null / false (if not a track)
  }

  function searchTracks(query, limit, cb){
    function waitFor(objName, cb){
      setTimeout(function(){
        if (window[objName])
          cb(window[objName]);
        else
          waitFor(objName, cb);
      }, 200);
    }

    function translateResult(r){
      r.title = r.title || r.name;
      return {
        eId: "/sc" + r.permalink_url.substr(r.permalink_url.indexOf("/", 10)) + "#" + r.uri,
        img: r.img || r.artwork_url || "/images/cover-soundcloud.jpg",
        url: r.url || r.permalink_url + "#" + r.uri,
        title: (r.title.indexOf(" - ") == -1 ? r.user.username + " - " : "") + r.title,
        playerLabel: 'Soundcloud'
      };
    }

    waitFor("SC", function(SC){
      SC.get('/tracks', {q: query, limit: limit}, function(results) {
        if ( results instanceof Array) {
          var tracks = results.map(translateResult);
          cb(tracks);
        };
      });
    });
  }

  Player.prototype.searchTracks = function(query, limit, cb){
    searchTracks(query, limit, cb); 
  }

  function fetchMetadata(url, cb){
    var splitted, params, trackId, method;
    url = unwrapUrl(url);
    splitted = url.split("?");
    params = splitted.length > 1 ? splitted[1] + "&" : ""; // might include a secret_token
    trackId = /\/tracks\/(\d+)/.test(splitted[0]) ? RegExp.lastParen : null;
    method = (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) ? "loadJSONP" : "loadJSON";
    if (trackId)
      loader[method]("https://api.soundcloud.com/tracks/" + trackId + ".json?" + params
        + "client_id=" + SOUNDCLOUD_CLIENT_ID, cb);
    else
      loader[method](RESOLVE_URL + "?client_id=" + SOUNDCLOUD_CLIENT_ID
        + "&url=" + encodeURIComponent("http://" + url.replace(/^(https?\:)?\/\//, "")), cb);
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var embed = {};
    if (!this.getEid(url))
      return cb();
    fetchMetadata(url, function(data) {
      if (data && data.kind == "track") {
        embed.id = "" + data.id;
        embed.eId = "/sc/" + data.permalink_url.substr(data.permalink_url.indexOf("/", 10) + 1)
          + /*"/" + data.id +*/ "#" + data.stream_url;
        embed.img = data.artwork_url || embed.img;
        embed.title = data.title;
        if (embed.title.indexOf(" - ") == -1 && (data.user || {}).username)
          embed.title = data.user.username + " - " + embed.title;
      }
      cb(embed);
    });
  }

  Player.prototype.getTrackPosition = function(callback) {
    callback(this.trackInfo.position = this.widget.position / 1000);
    if (this.widget.durationEstimate)
      this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo({
        duration: this.widget.duration / 1000
      });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.safeCall("setPosition", pos * 1000);
  };

  Player.prototype.play = function(id) {
    //console.log("sc PLAY id:", id)
    this.trackInfo = {};
    var that = this;
    function playId(id){
      //console.log("=> sc PLAY id:", id)
      that.embedVars.trackId = id;
      //console.log("soundcloud play", this.embedVars);
      window.SC.stream(id, that.soundOptions, function(sound){
        that.widget = sound;
        that.callHandler("onEmbedReady", that);
        //that.safeCall("play");
      });
    }
    if (id.indexOf("/tracks/") == 0)
      return playId(id);
    id = "http://" + (!id.indexOf("/") ? "soundcloud.com" : "") + id;
    //console.log("sc resolve url:", id);
    fetchMetadata(id, function(data){
      playId((data || {}).id);
    });
  }

  Player.prototype.resume = function() {
    this.safeCall("play");
  }

  Player.prototype.pause = function() {
    this.safeCall("pause");
  }

  Player.prototype.stop = function() {
    this.safeCall("stop");
  }

  Player.prototype.setVolume = function(vol) {
    this.safeCall("setVolume", 100 * vol);
  }

  //inherits(SoundCloudPlayer, Player);
  SoundCloudPlayer.prototype = Player.prototype;
  SoundCloudPlayer.super_ = Player;
  // this method exports Player under the name "SoundCloudPlayer", even after minification
  // so that SoundCloudPlayer.name == "SoundCloudPlayer" instead of SoundCloudPlayer.name == "Player"
})();

try{
  module.exports = SoundCloudPlayer;
}catch(e){};
// SpotifyPlayer
// only plays 30-seconds previews (for now)

function SpotifyPlayer(){
  return SpotifyPlayer.super_.apply(this, arguments);
}

(function() {

  var EVENT_MAP = {
    "onplay": "onPlaying",
    "onresume": "onPlaying",
    "onpause": "onPaused",
    "onstop": "onPaused",
    "onfinish": "onEnded"
  };

  function Player(eventHandlers, embedVars) {  
    var that = this;
    this.label = 'Spotify track';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.widget = null;
    this.isReady = false;
    this.trackInfo = {};
    this.soundOptions = {
      id: null,
      url: null,
      autoLoad: true,
      autoPlay: true,
      ontimeout: function(e) {
        //console.log("SpotifyPlayer timeout event:", e);
        eventHandlers.onError && eventHandlers.onError(that, {code:"timeout", source:"SpotifyPlayer"});
      }
    };
    Object.keys(EVENT_MAP).map(function(i) {
      that.soundOptions[i] = function() {
        //console.log("event:", i, this);
        var handler = eventHandlers[EVENT_MAP[i]];
        handler && handler(that);
      }
    });
    window.soundManager.onready(function(){
      that.isReady = true;
      eventHandlers.onApiReady && eventHandlers.onApiReady(that);
    });
  }

  Player.prototype.getEid = function(url) {
    return /spotify.com\/track\/(\w+)/.test(url) ? RegExp.$1 : null;
  }
  
  Player.prototype.getTrackInfo = function(callback) {
    var that = this, i = setInterval(function() {
      if (that.widget && that.widget.duration) {
        clearInterval(i);
        callback(that.trackInfo = {
          duration: that.widget.duration / 1000,
          position: that.widget.position / 1000
        });
      }
    }, 500);
  }

  Player.prototype.getTrackPosition = function(callback) {
    var that = this;
    this.getTrackInfo(function(){
      callback(that.trackInfo.position);
      that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
    });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
  };

  Player.prototype.embed = function(vars) {
    var that = this;
    if (!vars || !vars.trackId)
      return;
    this.embedVars = vars = vars || {};
    this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
    //console.log("trackid", vars.trackId)
    loader.loadJSON("https://api.spotify.com/v1/tracks/" + vars.trackId, function(data){
      that.soundOptions.url = data.preview_url;
      that.trackInfo = {};
      if (that.widget) {
        that.pause();
        that.widget = null;
        delete that.widget;
      }
      that.widget = soundManager.createSound(that.soundOptions);
      that.eventHandlers.onEmbedReady && that.eventHandlers.onEmbedReady(that);
      that.eventHandlers.onTrackInfo && that.getTrackInfo(that.eventHandlers.onTrackInfo);
      that.play();
    });
  }

  Player.prototype.play = function(id) {
    this.isReady && this.embed({trackId:id});
  }

  Player.prototype.resume = function() {
    this.isReady && this.widget && this.widget.resume();
  }

  Player.prototype.pause = function() {
    try {
      this.isReady && this.widget && this.widget.pause();
    }
    catch(e) {
      console.error("spotify error:", e, e.stack);
    }
  }

  Player.prototype.stop = function() {
    this.widget && this.widget.stop();
  }

  Player.prototype.setVolume = function(vol) {
    if (this.widget && this.widget.setVolume && this.soundOptions)
      soundManager.setVolume(this.soundOptions.id, 100 * vol);
  }

  SpotifyPlayer.prototype = Player.prototype;
  SpotifyPlayer.super_ = Player;
})();

try{
  module.exports = SpotifyPlayer;
}catch(e){};
// "universal embed" / iframe version of Vimeo Player

function VimeoPlayer(){
  return VimeoPlayer.super_.apply(this, arguments);
}

(function() {

  var EVENT_MAP = {
    "playProgress": function(that, data){
      that.trackInfo.position = Number(data.seconds);
      that.trackInfo.duration = Number(data.duration);
      that.eventHandlers.onPlaying && that.eventHandlers.onPlaying(that);
      that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
    },
    "pause": "onPaused",
    "finish": "onEnded",
  };

  // utility function
  function param(obj){
    return Object.keys(obj).map(function(f){
      return encodeURIComponent(f) + "=" + encodeURIComponent(obj[f]);
    }).join("&");
  }

  function onMessageReceived(e) {
    if (e.origin.indexOf("vimeo.com") == -1)
      return;
    try {
      var that = this, data = {};
      if (e.data.charAt(0) === '{') {
        data = JSON.parse(e.data);
      } else {
        e.data.split("&").map(function(keyval){
          var s = keyval.split("=");
          data[s[0]] = s[1];
        });
      }
      data.params = (data.params || "").split(",");
      data.player_id = data.player_id || data.params.pop();
      if (data.player_id == this.embedVars.playerId) {
        if (data.method == "onLoad") {
          Object.keys(EVENT_MAP).map(this.post.bind(this, 'addEventListener'));
        }
        else
          setTimeout(function(){
            var eventHandler = that.eventHandlers[EVENT_MAP[data.event]] || EVENT_MAP[data.event];
            if (typeof eventHandler == "function")
              eventHandler.apply(that, [that].concat(data.data));
            else
              console.warn("vimeo missing handler for event", data.method);
          });
      }
    } catch (e) {
      console.log("VimeoPlayer error", e, e.stack);
      this.eventHandlers.onError && this.eventHandlers.onError(this, {source:"VimeoPlayer", exception: e});
    }
  }

  function Player(eventHandlers, embedVars) {  
    var that = this;
    this.label = 'Vimeo';
    this.element = null;
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.isReady = false;
    this.trackInfo = {};
    if (window.addEventListener)
      window.addEventListener('message', onMessageReceived.bind(this), false);
    else
      window.attachEvent('onmessage', onMessageReceived.bind(this), false);
    //loader.includeJS("http://a.vimeocdn.com/js/froogaloop2.min.js", function() {
      that.isReady = true;
      eventHandlers.onApiReady && eventHandlers.onApiReady(that);
    //});
  }

  Player.prototype.post = function(action, value) {
    var data = {method: action};
    if (value)
      data.value = value;
    try{
      return this.element.contentWindow.postMessage(JSON.stringify(data), this.element.src.split("?")[0]);
    } catch(e){
      console.log(e);
    }
  }

  Player.prototype.getEid = function(url) {
    return /(vimeo\.com\/(clip\:|video\/)?|\/vi\/)(\d+)/.test(url) && RegExp.lastParen;
  }

  function fetchMetadata(id, cb){
    loader.loadJSON("https://vimeo.com/api/v2/video/" + id + ".json", function(data) {
      cb(!data || !data.map ? null : {
        id: id,
        title: data[0].title,
        img: data[0].thumbnail_medium,
      });
    });
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var id = this.getEid(url);
    if (!id)
      return cb();
    fetchMetadata(id, cb);
  }

  Player.prototype.setTrackPosition = function(pos) {
    this.pause(); // hack to prevent freeze on firefox 31.0
    this.post("seekTo", pos);
    this.resume(); // hack to prevent freeze on firefox 31.0
  };
  
  Player.prototype.embed = function(vars) {
    //console.log("VimeoPlayer embed vars:", vars);
    this.embedVars = vars = vars || {};
    this.embedVars.playerId = this.embedVars.playerId || 'viplayer';
    this.trackInfo = {};
    this.element = document.createElement("iframe");
    var attributes = {
      id: this.embedVars.playerId,
      width: this.embedVars.width || '200',
      height: this.embedVars.height || '200',
      frameborder: "0",
      webkitAllowFullScreen: true,
      mozallowfullscreen: true,
      allowScriptAccess: "always",
      allowFullScreen: true,
      src: 'https://player.vimeo.com/video/' + vars.videoId + "?" + param({
        api: 1,
        js_api: 1,
        player_id: this.embedVars.playerId,
        title: 0,
        byline: 0,
        portrait: 0,
        autoplay: 1
      })
    };
    for (i in attributes)
      this.element.setAttribute(i, attributes[i]);
    this.embedVars.playerContainer.innerHTML = '';
    this.embedVars.playerContainer.appendChild(this.element);
    // TODO: wait for this.element.contentWindow.postMessage to be ready to be called
    if (this.eventHandlers.onEmbedReady)
      this.eventHandlers.onEmbedReady();
  }

  Player.prototype.play = function(id) {
    if (id && (!this.currentId || this.currentId != id)) {
      this.embedVars.videoId = id;
      this.embed(this.embedVars);
    }
  }

  Player.prototype.resume = function() {
    this.post("play");
  }

  Player.prototype.pause = function() {
    this.post("pause");
  }

  Player.prototype.stop = function() {
    if (this.element)
      this.post("unload");
    if ((this.element || {}).parentNode)
      this.element.parentNode.removeChild(this.element);
    if ((this.otherElement || {}).parentNode)
      this.otherElement.parentNode.removeChild(this.otherElement);
  }

  Player.prototype.setVolume = function(vol) {
    this.post("setVolume", 100 * vol);
  }

  //return Playem;
  //inherits(VimeoPlayer, Player);
  VimeoPlayer.prototype = Player.prototype;
  VimeoPlayer.super_ = Player;
})();

try{
  module.exports = VimeoPlayer;
}catch(e){};
window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.attr = $.attr || function(){return $};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};

function YoutubePlayer(){
  return YoutubePlayer.super_.apply(this, arguments);
}

(function() {
  //includeJS("https://www.youtube.com/player_api");
  var
    EVENT_MAP = {
      0: "onEnded",
      1: "onPlaying",
      2: "onPaused",
  //  3: "onBuffering", // youtube state: buffering
  //  5: "onBuffering", // youtube state: cued
    },
    SDK_URL = 'https://apis.google.com/js/client.js?onload=initYT',
    SDK_LOADED = false,
    PLAYER_API_SCRIPT = 'https://www.youtube.com/iframe_api',
    PLAYER_API_LOADED = false,
    YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=",
    apiReady = false,
    DEFAULT_PARAMS = {
      width: '200',
      height: '200',
      playerVars: {
        autoplay: 1,
        version: 3,
        enablejsapi: 1,
        controls: 0,
        modestbranding: 1,
        showinfo: 0,
        wmode: "opaque",
        iv_load_policy: 3,
        allowscriptaccess: "always"
      }
    };

  function whenApiReady(cb){
    setTimeout(function(){
      if (SDK_URL && apiReady && PLAYER_API_LOADED){
        cb();
      }else{
        whenApiReady(cb);
      }
    }, 200);
  }

  window.onYouTubeIframeAPIReady = function() {
    PLAYER_API_LOADED = true;
  };

  // called by $.getScript(SDK_URL)
  window.initYT = function() {
    gapi.client.setApiKey(YOUTUBE_API_KEY);
    gapi.client.load('youtube', 'v3', function() {
      apiReady = true;
      $.getScript(PLAYER_API_SCRIPT, function() {
        // will call window.onYouTubeIframeAPIReady()
      });
    });
  };

  if (!SDK_LOADED) {
    $.getScript(SDK_URL, function() {
      // will call window.initYT()
      SDK_LOADED = true;
    });
  } else if (!apiReady) {
    window.initYT();
  }

  function Player(eventHandlers, embedVars) {
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.label = "Youtube";
    this.isReady = false;
    this.trackInfo = {};
    this.player = {};
    var that = this;
    window.onYoutubeStateChange = function(newState) {
      if (newState.data == YT.PlayerState.PLAYING){
        that.trackInfo.duration = that.player.getDuration();
      }
      //console.log("------> YT newState:", newState, newState.data);
      var eventName = EVENT_MAP[newState.data];
      if (eventName && that.eventHandlers[eventName])
        that.eventHandlers[eventName](that);
    };

    window.onYoutubeError = function(error) {
      //console.log(that.embedVars.playerId + " error:", error);
      eventHandlers.onError && eventHandlers.onError(that, {source:"YoutubePlayer", code: error});
    }

    whenApiReady(function(){
      that.isReady = true;
      if (that.eventHandlers.onApiReady)
        that.eventHandlers.onApiReady(that);
    });
  }

  Player.prototype.safeCall = function(fctName, param) {
    try {
      var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
      fct = (this.element || {})[fctName];
      //console.log(fctName, args, this.element)
      fct && fct.apply(this.element, args);
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

  Player.prototype.embed = function (vars) {
    this.embedVars = vars = vars || {};
    this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
    this.trackInfo = {};
    this.embedVars.playerContainer.innerHTML = '';
    this.element = document.createElement("div");
    this.element.id = this.embedVars.playerId;
    this.embedVars.playerContainer.appendChild(this.element);
    $(this.element).show();

    var that = this;
    that.player = new YT.Player(that.embedVars.playerId || 'ytplayer', DEFAULT_PARAMS);
    that.player.addEventListener("onStateChange", "onYoutubeStateChange");
    that.player.addEventListener("onError", "onYoutubeError");
    that.element = that.player.getIframe();
    that.player.addEventListener('onReady', function(event) {
      that.safeClientCall("onEmbedReady");
      that.player.loadVideoById(that.embedVars.videoId);
    });
  }

  Player.prototype.getEid = function(url) {
    if (
      /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(url)
      || /^\/yt\/([a-zA-Z0-9_\-]+)/.test(url)
      || /youtube\.com\/attribution_link\?.*v\%3D([^ \%]+)/.test(url)
      || /youtube.googleapis.com\/v\/([a-zA-Z0-9_\-]+)/.test(url)
      )
      return RegExp.lastParen;
  }

  function searchTracks(query, limit, cb){
    function translateResult(r){
      var id = (typeof(r.id) !== 'string') ? r.id.videoId : r.id;
      return {
        id : id,
        eId: "/yt/" + id,
        img: r.snippet.thumbnails["default"].url,
        url: YOUTUBE_VIDEO_URL + id,
        title: r.snippet.title,
        playerLabel: 'Youtube'
      };
    }
    if (!cb) return;
    whenApiReady(function(){
      if (limit !== 1) {
        gapi.client.youtube.search.list({
          part: 'snippet',
          q: YOUTUBE_VIDEO_URL + query,
          type : "video",
          maxResults : limit,
        }).execute(function(res){
          results = res.items.map(translateResult);
          cb(results);
        });
      }
      else {
        gapi.client.youtube.videos.list({
          'id': query,
          'part': 'snippet,contentDetails,statistics'
        }).execute(function(res){
          results = res.items.map(translateResult);
          cb(results);
        });
      }
    });
  }

  Player.prototype.searchTracks = function(query, limit, cb){
    searchTracks(query, limit, cb);
  }

  function fetchMetadata(id, cb){
    searchTracks(id, 1, function(tracks) {
      cb(tracks[0]);
    });
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var id = this.getEid(url);
    if (!id)
      return cb();
    else
      fetchMetadata(id, cb);
  }

  function cleanId(id){
    return /([a-zA-Z0-9_\-]+)/.test(id) && RegExp.lastParen;
  }

  Player.prototype.play = function(id) {
    id = cleanId(id);
    //console.log("PLAY -> YoutubePlayer", this.currentId, id);
    if (!this.currentId || this.currentId != id) {
      this.embedVars.videoId = id;
      this.embed(this.embedVars);
    }
  }

  Player.prototype.pause = function() {
    //console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
    if (this.player && this.player.pauseVideo)
      this.player.pauseVideo();
  }

  Player.prototype.resume = function() {
    //console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
    if (this.player && this.player.playVideo)
      this.player.playVideo();
  }

  Player.prototype.stop = function() {
    try {
      this.player.stopVideo();
    } catch(e) {}
  }

  Player.prototype.getTrackPosition = function(callback) {
    if (callback && this.player && this.player.getCurrentTime)
      callback(this.player.getCurrentTime());
  };

  Player.prototype.setTrackPosition = function(pos) {
    // this.safeCall("seekTo", pos, true);
    if (this.player && this.player.seekTo)
      this.player.seekTo(pos);
  };

  Player.prototype.setVolume = function(vol) {
    if (this.player && this.player.setVolume)
      this.player.setVolume(vol * 100);
  };

  //return Player;
  //inherits(YoutubePlayer, Player);
  YoutubePlayer.prototype = Player.prototype;
  YoutubePlayer.super_ = Player;
})();

try{
  module.exports = YoutubePlayer;
}catch(e){};
