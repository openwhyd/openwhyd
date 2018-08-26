/** @license
 *
 * SoundManager 2: JavaScript Sound for the Web
 * ----------------------------------------------
 * http://schillmania.com/projects/soundmanager2/
 *
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code provided under the BSD License:
 * http://schillmania.com/projects/soundmanager2/license.txt
 *
 * V2.97a.20120624
 */
(function (ea) {
  function Q (Q, da) {
    function R (a) { return c.preferFlash && t && !c.ignoreFlash && typeof c.flash[a] !== 'undefined' && c.flash[a] } function m (a) { return function (c) { var d = this._t; return !d || !d._a ? null : a.call(this, c) } } this.setupOptions = {url: Q || null,
      flashVersion: 8,
      debugMode: !0,
      debugFlash: !1,
      useConsole: !0,
      consoleOnly: !0,
      waitForWindowLoad: !1,
      bgColor: '#ffffff',
      useHighPerformance: !1,
      flashPollingInterval: null,
      html5PollingInterval: null,
      flashLoadTimeout: 1E3,
      wmode: null,
      allowScriptAccess: 'always',
      useFlashBlock: !1,
      useHTML5Audio: !0,
      html5Test: /^(probably|maybe)$/i,
      preferFlash: !0,
      noSWFCache: !1}; this.defaultOptions = {autoLoad: !1, autoPlay: !1, from: null, loops: 1, onid3: null, onload: null, whileloading: null, onplay: null, onpause: null, onresume: null, whileplaying: null, onposition: null, onstop: null, onfailure: null, onfinish: null, multiShot: !0, multiShotEvents: !1, position: null, pan: 0, stream: !0, to: null, type: null, usePolicyFile: !1, volume: 100}; this.flash9Options = {isMovieStar: null,
      usePeakData: !1,
      useWaveformData: !1,
      useEQData: !1,
      onbufferchange: null,
      ondataerror: null}; this.movieStarOptions = {bufferTime: 3, serverURL: null, onconnect: null, duration: null}; this.audioFormats = {mp3: {type: ['audio/mpeg; codecs="mp3"', 'audio/mpeg', 'audio/mp3', 'audio/MPA', 'audio/mpa-robust'], required: !0}, mp4: {related: ['aac', 'm4a'], type: ['audio/mp4; codecs="mp4a.40.2"', 'audio/aac', 'audio/x-m4a', 'audio/MP4A-LATM', 'audio/mpeg4-generic'], required: !1}, ogg: {type: ['audio/ogg; codecs=vorbis'], required: !1}, wav: {type: ['audio/wav; codecs="1"', 'audio/wav', 'audio/wave', 'audio/x-wav'], required: !1}}
    this.movieID = 'sm2-container'; this.id = da || 'sm2movie'; this.debugID = 'soundmanager-debug'; this.debugURLParam = /([#?&])debug=1/i; this.versionNumber = 'V2.97a.20120624'; this.altURL = this.movieURL = this.version = null; this.enabled = this.swfLoaded = !1; this.oMC = null; this.sounds = {}; this.soundIDs = []; this.didFlashBlock = this.muted = !1; this.filePattern = null; this.filePatterns = {flash8: /\.mp3(\?.*)?$/i, flash9: /\.mp3(\?.*)?$/i}; this.features = {buffering: !1, peakData: !1, waveformData: !1, eqData: !1, movieStar: !1}; this.sandbox = {}; var fa
    try { fa = typeof Audio !== 'undefined' && typeof (new Audio()).canPlayType !== 'undefined' } catch (Za) { fa = !1 } this.hasHTML5 = fa; this.html5 = {usingFlash: null}; this.flash = {}; this.ignoreFlash = this.html5Only = !1; var Ca, c = this, i = null, S, q = navigator.userAgent, h = ea, ga = h.location.href.toString(), l = document, ha, Da, ia, j, w = [], J = !1, K = !1, k = !1, s = !1, ja = !1, L, r, ka, T, la, B, C, D, Ea, ma, U, V, E, na, oa, pa, W, F, Fa, qa, Ga, X, Ha, M = null, ra = null, u, sa, G, Y, Z, H, p, N = !1, ta = !1, Ia, Ja, Ka, $ = 0, O = null, aa, n = null, La, ba, P, x, ua, va, Ma, o, Wa = Array.prototype.slice, z = !1,
      t, wa, Na, v, Oa, xa = q.match(/(ipad|iphone|ipod)/i), y = q.match(/msie/i), Xa = q.match(/webkit/i), ya = q.match(/safari/i) && !q.match(/chrome/i), Pa = q.match(/opera/i), za = q.match(/(mobile|pre\/|xoom)/i) || xa, Qa = !ga.match(/usehtml5audio/i) && !ga.match(/sm2\-ignorebadua/i) && ya && !q.match(/silk/i) && q.match(/OS X 10_6_([3-7])/i), Aa = typeof l.hasFocus !== 'undefined' ? l.hasFocus() : null, ca = ya && (typeof l.hasFocus === 'undefined' || !l.hasFocus()), Ra = !ca, Sa = /(mp3|mp4|mpa|m4a)/i, Ba = l.location ? l.location.protocol.match(/http/i) : null,
      Ta = !Ba ? 'http://' : '', Ua = /^\s*audio\/(?:x-)?(?:mpeg4|aac|flv|mov|mp4||m4v|m4a|mp4v|3gp|3g2)\s*(?:$|;)/i, Va = 'mpeg4,aac,flv,mov,mp4,m4v,f4v,m4a,mp4v,3gp,3g2'.split(','), Ya = RegExp('\\.(' + Va.join('|') + ')(\\?.*)?$', 'i'); this.mimePattern = /^\s*audio\/(?:x-)?(?:mp(?:eg|3))\s*(?:$|;)/i; this.useAltURL = !Ba; this._global_a = null; if (za && (c.useHTML5Audio = !0, c.preferFlash = !1, xa))z = c.ignoreFlash = !0; this.setup = function (a) {
      typeof a !== 'undefined' && k && n && c.ok() && (typeof a.flashVersion !== 'undefined' || typeof a.url !== 'undefined') &&
H(u('setupLate')); ka(a); return c
    }; this.supported = this.ok = function () { return n ? k && !s : c.useHTML5Audio && c.hasHTML5 }; this.getMovie = function (a) { return S(a) || l[a] || h[a] }; this.createSound = function (a, e) {
      function d () { b = Y(b); c.sounds[f.id] = new Ca(f); c.soundIDs.push(f.id); return c.sounds[f.id] } var b = null, g = null, f = null; if (!k || !c.ok()) return H(void 0), !1; typeof e !== 'undefined' && (a = {id: a, url: e}); b = r(a); b.url = aa(b.url); f = b; if (p(f.id, !0)) return c.sounds[f.id]; if (ba(f))g = d(), g._setup_html5(f); else {
        if (j > 8 && f.isMovieStar === null) {
          f.isMovieStar =
!(!f.serverURL && !(f.type && f.type.match(Ua) || f.url.match(Ya)))
        }f = Z(f, void 0); g = d(); if (j === 8)i._createSound(f.id, f.loops || 1, f.usePolicyFile); else if (i._createSound(f.id, f.url, f.usePeakData, f.useWaveformData, f.useEQData, f.isMovieStar, f.isMovieStar ? f.bufferTime : !1, f.loops || 1, f.serverURL, f.duration || null, f.autoPlay, !0, f.autoLoad, f.usePolicyFile), !f.serverURL)g.connected = !0, f.onconnect && f.onconnect.apply(g); !f.serverURL && (f.autoLoad || f.autoPlay) && g.load(f)
      }!f.serverURL && f.autoPlay && g.play(); return g
    }; this.destroySound =
function (a, e) { if (!p(a)) return !1; var d = c.sounds[a], b; d._iO = {}; d.stop(); d.unload(); for (b = 0; b < c.soundIDs.length; b++) if (c.soundIDs[b] === a) { c.soundIDs.splice(b, 1); break }e || d.destruct(!0); delete c.sounds[a]; return !0 }; this.load = function (a, e) { return !p(a) ? !1 : c.sounds[a].load(e) }; this.unload = function (a) { return !p(a) ? !1 : c.sounds[a].unload() }; this.onposition = this.onPosition = function (a, e, d, b) { return !p(a) ? !1 : c.sounds[a].onposition(e, d, b) }; this.clearOnPosition = function (a, e, d) {
      return !p(a) ? !1 : c.sounds[a].clearOnPosition(e,
        d)
    }; this.start = this.play = function (a, e) { var d = !1; if (!k || !c.ok()) return H('soundManager.play(): ' + u(!k ? 'notReady' : 'notOK')), d; if (!p(a)) { e instanceof Object || (e = {url: e}); if (e && e.url)e.id = a, d = c.createSound(e).play(); return d } return c.sounds[a].play(e) }; this.setPosition = function (a, e) { return !p(a) ? !1 : c.sounds[a].setPosition(e) }; this.stop = function (a) { return !p(a) ? !1 : c.sounds[a].stop() }; this.stopAll = function () { for (var a in c.sounds)c.sounds.hasOwnProperty(a) && c.sounds[a].stop() }; this.pause = function (a) {
      return !p(a)
        ? !1 : c.sounds[a].pause()
    }; this.pauseAll = function () { var a; for (a = c.soundIDs.length - 1; a >= 0; a--)c.sounds[c.soundIDs[a]].pause() }; this.resume = function (a) { return !p(a) ? !1 : c.sounds[a].resume() }; this.resumeAll = function () { var a; for (a = c.soundIDs.length - 1; a >= 0; a--)c.sounds[c.soundIDs[a]].resume() }; this.togglePause = function (a) { return !p(a) ? !1 : c.sounds[a].togglePause() }; this.setPan = function (a, e) { return !p(a) ? !1 : c.sounds[a].setPan(e) }; this.setVolume = function (a, e) { return !p(a) ? !1 : c.sounds[a].setVolume(e) }; this.mute = function (a) {
      var e =
0; typeof a !== 'string' && (a = null); if (a) return !p(a) ? !1 : c.sounds[a].mute(); for (e = c.soundIDs.length - 1; e >= 0; e--)c.sounds[c.soundIDs[e]].mute(); return c.muted = !0
    }; this.muteAll = function () { c.mute() }; this.unmute = function (a) { typeof a !== 'string' && (a = null); if (a) return !p(a) ? !1 : c.sounds[a].unmute(); for (a = c.soundIDs.length - 1; a >= 0; a--)c.sounds[c.soundIDs[a]].unmute(); c.muted = !1; return !0 }; this.unmuteAll = function () { c.unmute() }; this.toggleMute = function (a) { return !p(a) ? !1 : c.sounds[a].toggleMute() }; this.getMemoryUse = function () {
      var a =
0; i && j !== 8 && (a = parseInt(i._getMemoryUse(), 10)); return a
    }; this.disable = function (a) { var e; typeof a === 'undefined' && (a = !1); if (s) return !1; s = !0; for (e = c.soundIDs.length - 1; e >= 0; e--)Ga(c.sounds[c.soundIDs[e]]); L(a); o.remove(h, 'load', C); return !0 }; this.canPlayMIME = function (a) { var e; c.hasHTML5 && (e = P({type: a})); !e && n && (e = a && c.ok() ? !!(j > 8 && a.match(Ua) || a.match(c.mimePattern)) : null); return e }; this.canPlayURL = function (a) { var e; c.hasHTML5 && (e = P({url: a})); !e && n && (e = a && c.ok() ? !!a.match(c.filePattern) : null); return e }
    this.canPlayLink = function (a) { return typeof a.type !== 'undefined' && a.type && c.canPlayMIME(a.type) ? !0 : c.canPlayURL(a.href) }; this.getSoundById = function (a) { if (!a) throw Error('soundManager.getSoundById(): sID is null/undefined'); return c.sounds[a] }; this.onready = function (a, c) { var d = !1; if (typeof a === 'function')c || (c = h), la('onready', a, c), B(); else throw u('needFunction', 'onready'); return !0 }; this.ontimeout = function (a, c) {
      var d = !1; if (typeof a === 'function')c || (c = h), la('ontimeout', a, c), B({type: 'ontimeout'}); else {
        throw u('needFunction',
          'ontimeout')
      } return !0
    }; this._wD = this._writeDebug = function () { return !0 }; this._debug = function () {}; this.reboot = function () { var a, e; for (a = c.soundIDs.length - 1; a >= 0; a--)c.sounds[c.soundIDs[a]].destruct(); if (i) try { if (y)ra = i.innerHTML; M = i.parentNode.removeChild(i) } catch (d) {}ra = M = n = null; c.enabled = oa = k = N = ta = J = K = s = c.swfLoaded = !1; c.soundIDs = []; c.sounds = {}; i = null; for (a in w) if (w.hasOwnProperty(a)) for (e = w[a].length - 1; e >= 0; e--)w[a][e].fired = !1; h.setTimeout(c.beginDelayedInit, 20) }; this.getMoviePercent = function () {
      return i &&
typeof i.PercentLoaded !== 'undefined' ? i.PercentLoaded() : null
    }; this.beginDelayedInit = function () { ja = !0; E(); setTimeout(function () { if (ta) return !1; W(); V(); return ta = !0 }, 20); D() }; this.destruct = function () { c.disable(!0) }; Ca = function (a) {
      var e, d, b = this, g, f, A, I, h, l, m = !1, k = [], o = 0, q, s, n = null; e = null; d = null; this.sID = this.id = a.id; this.url = a.url; this._iO = this.instanceOptions = this.options = r(a); this.pan = this.options.pan; this.volume = this.options.volume; this.isHTML5 = !1; this._a = null; this.id3 = {}; this._debug = function () {}
      this.load = function (a) {
        var c = null; if (typeof a !== 'undefined')b._iO = r(a, b.options), b.instanceOptions = b._iO; else if (a = b.options, b._iO = a, b.instanceOptions = b._iO, n && n !== b.url)b._iO.url = b.url, b.url = null; if (!b._iO.url)b._iO.url = b.url; b._iO.url = aa(b._iO.url); if (b._iO.url === b.url && b.readyState !== 0 && b.readyState !== 2) return b.readyState === 3 && b._iO.onload && b._iO.onload.apply(b, [!!b.duration]), b; a = b._iO; n = b.url; b.loaded = !1; b.readyState = 1; b.playState = 0; b.id3 = {}; if (ba(a)) {
          if (c = b._setup_html5(a), !c._called_load) {
            b._html5_canplay =
!1; if (b._a.src !== a.url)b._a.src = a.url, b.setPosition(0); b._a.autobuffer = 'auto'; b._a.preload = 'auto'; c._called_load = !0; a.autoPlay && b.play()
          }
        } else try { b.isHTML5 = !1, b._iO = Z(Y(a)), a = b._iO, j === 8 ? i._load(b.id, a.url, a.stream, a.autoPlay, a.whileloading ? 1 : 0, a.loops || 1, a.usePolicyFile) : i._load(b.id, a.url, !!a.stream, !!a.autoPlay, a.loops || 1, !!a.autoLoad, a.usePolicyFile) } catch (e) { F({type: 'SMSOUND_LOAD_JS_EXCEPTION', fatal: !0}) } return b
      }; this.unload = function () {
        if (b.readyState !== 0) {
          if (b.isHTML5) {
            if (I(), b._a) {
              b._a.pause(),
              ua(b._a, 'about:blank'), b.url = 'about:blank'
            }
          } else j === 8 ? i._unload(b.id, 'about:blank') : i._unload(b.id); g()
        } return b
      }; this.destruct = function (a) { if (b.isHTML5) { if (I(), b._a)b._a.pause(), ua(b._a), z || A(), b._a._t = null, b._a = null } else b._iO.onfailure = null, i._destroySound(b.id); a || c.destroySound(b.id, !0) }; this.start = this.play = function (a, c) {
        var e, d; d = !0; d = null; c = typeof c === 'undefined' ? !0 : c; a || (a = {}); b._iO = r(a, b._iO); b._iO = r(b._iO, b.options); b._iO.url = aa(b._iO.url); b.instanceOptions = b._iO; if (b._iO.serverURL && !b.connected) {
          return b.getAutoPlay() ||
b.setAutoPlay(!0), b
        } ba(b._iO) && (b._setup_html5(b._iO), h()); if (b.playState === 1 && !b.paused)(e = b._iO.multiShot) || (d = b); if (d !== null) return d; if (!b.loaded) if (b.readyState === 0) { if (!b.isHTML5)b._iO.autoPlay = !0; b.load(b._iO) } else b.readyState === 2 && (d = b); if (d !== null) return d; if (!b.isHTML5 && j === 9 && b.position > 0 && b.position === b.duration)a.position = 0; if (b.paused && b.position && b.position > 0)b.resume(); else {
          b._iO = r(a, b._iO); if (b._iO.from !== null && b._iO.to !== null && b.instanceCount === 0 && b.playState === 0 && !b._iO.serverURL) {
            e =
function () { b._iO = r(a, b._iO); b.play(b._iO) }; if (b.isHTML5 && !b._html5_canplay)b.load({_oncanplay: e}), d = !1; else if (!b.isHTML5 && !b.loaded && (!b.readyState || b.readyState !== 2))b.load({onload: e}), d = !1; if (d !== null) return d; b._iO = s()
          }(!b.instanceCount || b._iO.multiShotEvents || !b.isHTML5 && j > 8 && !b.getAutoPlay()) && b.instanceCount++; b._iO.onposition && b.playState === 0 && l(b); b.playState = 1; b.paused = !1; b.position = typeof b._iO.position !== 'undefined' && !isNaN(b._iO.position) ? b._iO.position : 0; if (!b.isHTML5)b._iO = Z(Y(b._iO))
          b._iO.onplay && c && (b._iO.onplay.apply(b), m = !0); b.setVolume(b._iO.volume, !0); b.setPan(b._iO.pan, !0); b.isHTML5 ? (h(), d = b._setup_html5(), b.setPosition(b._iO.position), d.play()) : (d = i._start(b.id, b._iO.loops || 1, j === 9 ? b._iO.position : b._iO.position / 1E3, b._iO.multiShot), j === 9 && !d && b._iO.onplayerror && b._iO.onplayerror.apply(b))
        } return b
      }; this.stop = function (a) {
        var c = b._iO; if (b.playState === 1) {
          b._onbufferchange(0); b._resetOnPosition(0); b.paused = !1; if (!b.isHTML5)b.playState = 0; q(); c.to && b.clearOnPosition(c.to); if (b.isHTML5) {
            if (b._a) {
              a =
b.position, b.setPosition(0), b.position = a, b._a.pause(), b.playState = 0, b._onTimer(), I()
            }
          } else i._stop(b.id, a), c.serverURL && b.unload(); b.instanceCount = 0; b._iO = {}; c.onstop && c.onstop.apply(b)
        } return b
      }; this.setAutoPlay = function (a) { b._iO.autoPlay = a; b.isHTML5 || (i._setAutoPlay(b.id, a), a && !b.instanceCount && b.readyState === 1 && b.instanceCount++) }; this.getAutoPlay = function () { return b._iO.autoPlay }; this.setPosition = function (a) {
        typeof a === 'undefined' && (a = 0); var c = b.isHTML5 ? Math.max(a, 0) : Math.min(b.duration || b._iO.duration,
          Math.max(a, 0)); b.position = c; a = b.position / 1E3; b._resetOnPosition(b.position); b._iO.position = c; if (b.isHTML5) { if (b._a && b._html5_canplay && b._a.currentTime !== a) try { b._a.currentTime = a, (b.playState === 0 || b.paused) && b._a.pause() } catch (e) {} } else a = j === 9 ? b.position : a, b.readyState && b.readyState !== 2 && i._setPosition(b.id, a, b.paused || !b.playState, b._iO.multiShot); b.isHTML5 && b.paused && b._onTimer(!0); return b
      }; this.pause = function (a) {
        if (b.paused || b.playState === 0 && b.readyState !== 1) return b; b.paused = !0; b.isHTML5 ? (b._setup_html5().pause(),
          I()) : (a || typeof a === 'undefined') && i._pause(b.id, b._iO.multiShot); b._iO.onpause && b._iO.onpause.apply(b); return b
      }; this.resume = function () { var a = b._iO; if (!b.paused) return b; b.paused = !1; b.playState = 1; b.isHTML5 ? (b._setup_html5().play(), h()) : (a.isMovieStar && !a.serverURL && b.setPosition(b.position), i._pause(b.id, a.multiShot)); !m && a.onplay ? (a.onplay.apply(b), m = !0) : a.onresume && a.onresume.apply(b); return b }; this.togglePause = function () {
        if (b.playState === 0) {
          return b.play({position: j === 9 && !b.isHTML5 ? b.position : b.position /
1E3}), b
        } b.paused ? b.resume() : b.pause(); return b
      }; this.setPan = function (a, c) { typeof a === 'undefined' && (a = 0); typeof c === 'undefined' && (c = !1); b.isHTML5 || i._setPan(b.id, a); b._iO.pan = a; if (!c)b.pan = a, b.options.pan = a; return b }; this.setVolume = function (a, e) { typeof a === 'undefined' && (a = 100); typeof e === 'undefined' && (e = !1); if (b.isHTML5) { if (b._a)b._a.volume = Math.max(0, Math.min(1, a / 100)) } else i._setVolume(b.id, c.muted && !b.muted || b.muted ? 0 : a); b._iO.volume = a; if (!e)b.volume = a, b.options.volume = a; return b }; this.mute = function () {
        b.muted =
!0; if (b.isHTML5) { if (b._a)b._a.muted = !0 } else i._setVolume(b.id, 0); return b
      }; this.unmute = function () { b.muted = !1; var a = typeof b._iO.volume !== 'undefined'; if (b.isHTML5) { if (b._a)b._a.muted = !1 } else i._setVolume(b.id, a ? b._iO.volume : b.options.volume); return b }; this.toggleMute = function () { return b.muted ? b.unmute() : b.mute() }; this.onposition = this.onPosition = function (a, c, e) { k.push({position: parseInt(a, 10), method: c, scope: typeof e !== 'undefined' ? e : b, fired: !1}); return b }; this.clearOnPosition = function (b, a) {
        var c, b = parseInt(b,
          10); if (isNaN(b)) return !1; for (c = 0; c < k.length; c++) if (b === k[c].position && (!a || a === k[c].method))k[c].fired && o--, k.splice(c, 1)
      }; this._processOnPosition = function () { var a, c; a = k.length; if (!a || !b.playState || o >= a) return !1; for (a -= 1; a >= 0; a--) if (c = k[a], !c.fired && b.position >= c.position)c.fired = !0, o++, c.method.apply(c.scope, [c.position]); return !0 }; this._resetOnPosition = function (b) { var a, c; a = k.length; if (!a) return !1; for (a -= 1; a >= 0; a--) if (c = k[a], c.fired && b <= c.position)c.fired = !1, o--; return !0 }; s = function () {
        var a = b._iO,
          c = a.from, e = a.to, d, f; f = function () { b.clearOnPosition(e, f); b.stop() }; d = function () { if (e !== null && !isNaN(e))b.onPosition(e, f) }; if (c !== null && !isNaN(c))a.position = c, a.multiShot = !1, d(); return a
      }; l = function () { var a, c = b._iO.onposition; if (c) for (a in c) if (c.hasOwnProperty(a))b.onPosition(parseInt(a, 10), c[a]) }; q = function () { var a, c = b._iO.onposition; if (c) for (a in c)c.hasOwnProperty(a) && b.clearOnPosition(parseInt(a, 10)) }; h = function () { b.isHTML5 && Ia(b) }; I = function () { b.isHTML5 && Ja(b) }; g = function (a) {
        a || (k = [], o = 0); m = !1
        b._hasTimer = null; b._a = null; b._html5_canplay = !1; b.bytesLoaded = null; b.bytesTotal = null; b.duration = b._iO && b._iO.duration ? b._iO.duration : null; b.durationEstimate = null; b.buffered = []; b.eqData = []; b.eqData.left = []; b.eqData.right = []; b.failures = 0; b.isBuffering = !1; b.instanceOptions = {}; b.instanceCount = 0; b.loaded = !1; b.metadata = {}; b.readyState = 0; b.muted = !1; b.paused = !1; b.peakData = {left: 0, right: 0}; b.waveformData = {left: [], right: []}; b.playState = 0; b.position = null; b.id3 = {}
      }; g(); this._onTimer = function (a) {
        var c, f = !1, g = {}
        if (b._hasTimer || a) { if (b._a && (a || (b.playState > 0 || b.readyState === 1) && !b.paused)) { c = b._get_html5_duration(); if (c !== e)e = c, b.duration = c, f = !0; b.durationEstimate = b.duration; c = 1E3 * b._a.currentTime || 0; c !== d && (d = c, f = !0); (f || a) && b._whileplaying(c, g, g, g, g) } return f }
      }; this._get_html5_duration = function () { var a = b._iO, c = b._a ? 1E3 * b._a.duration : a ? a.duration : void 0; return c && !isNaN(c) && Infinity !== c ? c : a ? a.duration : null }; this._apply_loop = function (b, a) { b.loop = a > 1 ? 'loop' : '' }; this._setup_html5 = function (a) {
        var a = r(b._iO,
            a), e = decodeURI, d = z ? c._global_a : b._a, i = e(a.url), h = d && d._t ? d._t.instanceOptions : null, A; if (d) { if (d._t) { if (!z && i === e(n))A = d; else if (z && h.url === a.url && (!n || n === h.url))A = d; if (A) return b._apply_loop(d, a.loops), A }z && d._t && d._t.playState && a.url !== h.url && d._t.stop(); g(h && h.url ? a.url === h.url : n ? n === a.url : !1); d.src = a.url; n = b.url = a.url; d._called_load = !1 } else if (b._a = a.autoLoad || a.autoPlay ? new Audio(a.url) : Pa ? new Audio(null) : new Audio(), d = b._a, d._called_load = !1, z)c._global_a = d; b.isHTML5 = !0; b._a = d; d._t = b; f(); b._apply_loop(d,
          a.loops); a.autoLoad || a.autoPlay ? b.load() : (d.autobuffer = !1, d.preload = 'auto'); return d
      }; f = function () { if (b._a._added_events) return !1; var a; b._a._added_events = !0; for (a in v)v.hasOwnProperty(a) && b._a && b._a.addEventListener(a, v[a], !1); return !0 }; A = function () { var a; b._a._added_events = !1; for (a in v)v.hasOwnProperty(a) && b._a && b._a.removeEventListener(a, v[a], !1) }; this._onload = function (a) {
        a = !!a || !b.isHTML5 && j === 8 && b.duration; b.loaded = a; b.readyState = a ? 3 : 2; b._onbufferchange(0); b._iO.onload && b._iO.onload.apply(b,
          [a]); return !0
      }; this._onbufferchange = function (a) { if (b.playState === 0 || a && b.isBuffering || !a && !b.isBuffering) return !1; b.isBuffering = a === 1; b._iO.onbufferchange && b._iO.onbufferchange.apply(b); return !0 }; this._onsuspend = function () { b._iO.onsuspend && b._iO.onsuspend.apply(b); return !0 }; this._onfailure = function (a, c, e) { b.failures++; if (b._iO.onfailure && b.failures === 1)b._iO.onfailure(b, a, c, e) }; this._onfinish = function () {
        var a = b._iO.onfinish; b._onbufferchange(0); b._resetOnPosition(0); if (b.instanceCount) {
          b.instanceCount--
          if (!b.instanceCount && (q(), b.playState = 0, b.paused = !1, b.instanceCount = 0, b.instanceOptions = {}, b._iO = {}, I(), b.isHTML5))b.position = 0; (!b.instanceCount || b._iO.multiShotEvents) && a && a.apply(b)
        }
      }; this._whileloading = function (a, c, e, d) {
        var f = b._iO; b.bytesLoaded = a; b.bytesTotal = c; b.duration = Math.floor(e); b.bufferLength = d; if (f.isMovieStar)b.durationEstimate = b.duration; else if (b.durationEstimate = f.duration ? b.duration > f.duration ? b.duration : f.duration : parseInt(b.bytesTotal / b.bytesLoaded * b.duration, 10), typeof b.durationEstimate ===
'undefined')b.durationEstimate = b.duration; if (!b.isHTML5)b.buffered = [{start: 0, end: b.duration}]; (b.readyState !== 3 || b.isHTML5) && f.whileloading && f.whileloading.apply(b)
      }; this._whileplaying = function (a, c, e, d, f) {
        var g = b._iO; if (isNaN(a) || a === null) return !1; b.position = Math.max(0, a); b._processOnPosition(); if (!b.isHTML5 && j > 8) {
          if (g.usePeakData && typeof c !== 'undefined' && c)b.peakData = {left: c.leftPeak, right: c.rightPeak}; if (g.useWaveformData && typeof e !== 'undefined' && e) {
            b.waveformData = {left: e.split(','),
              right: d.split(',')}
          } if (g.useEQData && typeof f !== 'undefined' && f && f.leftEQ && (a = f.leftEQ.split(','), b.eqData = a, b.eqData.left = a, typeof f.rightEQ !== 'undefined' && f.rightEQ))b.eqData.right = f.rightEQ.split(',')
        }b.playState === 1 && (!b.isHTML5 && j === 8 && !b.position && b.isBuffering && b._onbufferchange(0), g.whileplaying && g.whileplaying.apply(b)); return !0
      }; this._oncaptiondata = function (a) { b.captiondata = a; b._iO.oncaptiondata && b._iO.oncaptiondata.apply(b) }; this._onmetadata = function (a, c) {
        var e = {}, d, f; for (d = 0, f = a.length; d <
f; d++)e[a[d]] = c[d]; b.metadata = e; b._iO.onmetadata && b._iO.onmetadata.apply(b)
      }; this._onid3 = function (a, c) { var e = [], d, f; for (d = 0, f = a.length; d < f; d++)e[a[d]] = c[d]; b.id3 = r(b.id3, e); b._iO.onid3 && b._iO.onid3.apply(b) }; this._onconnect = function (a) { a = a === 1; if (b.connected = a)b.failures = 0, p(b.id) && (b.getAutoPlay() ? b.play(void 0, b.getAutoPlay()) : b._iO.autoLoad && b.load()), b._iO.onconnect && b._iO.onconnect.apply(b, [a]) }; this._ondataerror = function () { b.playState > 0 && b._iO.ondataerror && b._iO.ondataerror.apply(b) }
    }; pa = function () {
      return l.body ||
l._docElement || l.getElementsByTagName('div')[0]
    }; S = function (a) { return l.getElementById(a) }; r = function (a, e) { var d = a || {}, b, g; b = typeof e === 'undefined' ? c.defaultOptions : e; for (g in b)b.hasOwnProperty(g) && typeof d[g] === 'undefined' && (d[g] = typeof b[g] !== 'object' || b[g] === null ? b[g] : r(d[g], b[g])); return d }; T = {onready: 1, ontimeout: 1, defaultOptions: 1, flash9Options: 1, movieStarOptions: 1}; ka = function (a, e) {
      var d, b = !0, g = typeof e !== 'undefined', f = c.setupOptions; for (d in a) {
        if (a.hasOwnProperty(d)) {
          if (typeof a[d] !== 'object' ||
a[d] === null || a[d] instanceof Array)g && typeof T[e] !== 'undefined' ? c[e][d] = a[d] : typeof f[d] !== 'undefined' ? (c.setupOptions[d] = a[d], c[d] = a[d]) : typeof T[d] === 'undefined' ? (H(u(typeof c[d] === 'undefined' ? 'setupUndef' : 'setupError', d), 2), b = !1) : c[d] instanceof Function ? c[d].apply(c, a[d] instanceof Array ? a[d] : [a[d]]) : c[d] = a[d]; else if (typeof T[d] === 'undefined')H(u(typeof c[d] === 'undefined' ? 'setupUndef' : 'setupError', d), 2), b = !1; else return ka(a[d], d)
        }
      } return b
    }; o = (function () {
      function a (a) {
        var a = Wa.call(a), b = a.length
        d ? (a[1] = 'on' + a[1], b > 3 && a.pop()) : b === 3 && a.push(!1); return a
      } function c (a, e) { var h = a.shift(), i = [b[e]]; if (d)h[i](a[0], a[1]); else h[i].apply(h, a) } var d = h.attachEvent, b = {add: d ? 'attachEvent' : 'addEventListener', remove: d ? 'detachEvent' : 'removeEventListener'}; return {add: function () { c(a(arguments), 'add') }, remove: function () { c(a(arguments), 'remove') }}
    }()); v = {abort: m(function () {}),
      canplay: m(function () {
        var a = this._t, c; if (a._html5_canplay) return !0; a._html5_canplay = !0; a._onbufferchange(0); c = typeof a._iO.position !== 'undefined' &&
!isNaN(a._iO.position) ? a._iO.position / 1E3 : null; if (a.position && this.currentTime !== c) try { this.currentTime = c } catch (d) {}a._iO._oncanplay && a._iO._oncanplay()
      }),
      canplaythrough: m(function () { var a = this._t; a.loaded || (a._onbufferchange(0), a._whileloading(a.bytesLoaded, a.bytesTotal, a._get_html5_duration()), a._onload(!0)) }),
      ended: m(function () { this._t._onfinish() }),
      error: m(function () { this._t._onload(!1) }),
      loadeddata: m(function () { var a = this._t; if (!a._loaded && !ya)a.duration = a._get_html5_duration() }),
      loadedmetadata: m(function () {}),
      loadstart: m(function () { this._t._onbufferchange(1) }),
      play: m(function () { this._t._onbufferchange(0) }),
      playing: m(function () { this._t._onbufferchange(0) }),
      progress: m(function (a) {
        var c = this._t, d, b, g = 0, g = a.target.buffered; d = a.loaded || 0; var f = a.total || 1; c.buffered = []; if (g && g.length) { for (d = 0, b = g.length; d < b; d++)c.buffered.push({start: g.start(d), end: g.end(d)}); g = g.end(0) - g.start(0); d = g / a.target.duration }isNaN(d) || (c._onbufferchange(0), c._whileloading(d, f, c._get_html5_duration()), d && f && d === f && v.canplaythrough.call(this,
          a))
      }),
      ratechange: m(function () {}),
      suspend: m(function (a) { var c = this._t; v.progress.call(this, a); c._onsuspend() }),
      stalled: m(function () {}),
      timeupdate: m(function () { this._t._onTimer() }),
      waiting: m(function () { this._t._onbufferchange(1) })}; ba = function (a) { return a.serverURL || a.type && R(a.type) ? !1 : a.type ? P({type: a.type}) : P({url: a.url}) || c.html5Only }; ua = function (a, c) { if (a)a.src = c }; P = function (a) {
      if (!c.useHTML5Audio || !c.hasHTML5) return !1; var e = a.url || null, a = a.type || null, d = c.audioFormats, b; if (a && typeof c.html5[a] !== 'undefined') {
        return c.html5[a] &&
!R(a)
      } if (!x) { x = []; for (b in d)d.hasOwnProperty(b) && (x.push(b), d[b].related && (x = x.concat(d[b].related))); x = RegExp('\\.(' + x.join('|') + ')(\\?.*)?$', 'i') }b = e ? e.toLowerCase().match(x) : null; !b || !b.length ? a && (e = a.indexOf(';'), b = (e !== -1 ? a.substr(0, e) : a).substr(6)) : b = b[1]; b && typeof c.html5[b] !== 'undefined' ? e = c.html5[b] && !R(b) : (a = 'audio/' + b, e = c.html5.canPlayType({type: a}), e = (c.html5[b] = e) && c.html5[a] && !R(a)); return e
    }; Ma = function () {
      function a (a) {
        var b, d, f = b = !1; if (!e || typeof e.canPlayType !== 'function') return b
        if (a instanceof Array) { for (b = 0, d = a.length; b < d && !f; b++) if (c.html5[a[b]] || e.canPlayType(a[b]).match(c.html5Test))f = !0, c.html5[a[b]] = !0, c.flash[a[b]] = !!a[b].match(Sa); b = f } else a = e && typeof e.canPlayType === 'function' ? e.canPlayType(a) : !1, b = !(!a || !a.match(c.html5Test)); return b
      } if (!c.useHTML5Audio || typeof Audio === 'undefined') return !1; var e = typeof Audio !== 'undefined' ? Pa ? new Audio(null) : new Audio() : null, d, b, g = {}, f; f = c.audioFormats; for (d in f) {
        if (f.hasOwnProperty(d) && (b = 'audio/' + d, g[d] = a(f[d].type), g[b] = g[d],
          d.match(Sa) ? (c.flash[d] = !0, c.flash[b] = !0) : (c.flash[d] = !1, c.flash[b] = !1), f[d] && f[d].related)) for (b = f[d].related.length - 1; b >= 0; b--)g['audio/' + f[d].related[b]] = g[d], c.html5[f[d].related[b]] = g[d], c.flash[f[d].related[b]] = g[d]
      } g.canPlayType = e ? a : null; c.html5 = r(c.html5, g); return !0
    }; u = function () {}; Y = function (a) { if (j === 8 && a.loops > 1 && a.stream)a.stream = !1; return a }; Z = function (a) { if (a && !a.usePolicyFile && (a.onid3 || a.usePeakData || a.useWaveformData || a.useEQData))a.usePolicyFile = !0; return a }; H = function () {}; ha = function () { return !1 }
    Ga = function (a) { for (var c in a)a.hasOwnProperty(c) && typeof a[c] === 'function' && (a[c] = ha) }; X = function (a) { typeof a === 'undefined' && (a = !1); (s || a) && c.disable(a) }; Ha = function (a) { var e = null; if (a) if (a.match(/\.swf(\?.*)?$/i)) { if (e = a.substr(a.toLowerCase().lastIndexOf('.swf?') + 4)) return a } else a.lastIndexOf('/') !== a.length - 1 && (a += '/'); a = (a && a.lastIndexOf('/') !== -1 ? a.substr(0, a.lastIndexOf('/') + 1) : './') + c.movieURL; c.noSWFCache && (a += '?ts=' + (new Date()).getTime()); return a }; ma = function () {
      j = parseInt(c.flashVersion,
        10); if (j !== 8 && j !== 9)c.flashVersion = j = 8; var a = c.debugMode || c.debugFlash ? '_debug.swf' : '.swf'; if (c.useHTML5Audio && !c.html5Only && c.audioFormats.mp4.required && j < 9)c.flashVersion = j = 9; c.version = c.versionNumber + (c.html5Only ? ' (HTML5-only mode)' : j === 9 ? ' (AS3/Flash 9)' : ' (AS2/Flash 8)'); j > 8 ? (c.defaultOptions = r(c.defaultOptions, c.flash9Options), c.features.buffering = !0, c.defaultOptions = r(c.defaultOptions, c.movieStarOptions), c.filePatterns.flash9 = RegExp('\\.(mp3|' + Va.join('|') + ')(\\?.*)?$', 'i'), c.features.movieStar =
!0) : c.features.movieStar = !1; c.filePattern = c.filePatterns[j !== 8 ? 'flash9' : 'flash8']; c.movieURL = (j === 8 ? 'soundmanager2.swf' : 'soundmanager2_flash9.swf').replace('.swf', a); c.features.peakData = c.features.waveformData = c.features.eqData = j > 8
    }; Fa = function (a, c) { if (!i) return !1; i._setPolling(a, c) }; qa = function () { if (c.debugURLParam.test(ga))c.debugMode = !0 }; p = this.getSoundById; G = function () {
      var a = []; c.debugMode && a.push('sm2_debug'); c.debugFlash && a.push('flash_debug'); c.useHighPerformance && a.push('high_performance')
      return a.join(' ')
    }; sa = function () { u('fbHandler'); var a = c.getMoviePercent(), e = {type: 'FLASHBLOCK'}; if (c.html5Only) return !1; if (c.ok()) { if (c.oMC)c.oMC.className = [G(), 'movieContainer', 'swf_loaded' + (c.didFlashBlock ? ' swf_unblocked' : '')].join(' ') } else { if (n)c.oMC.className = G() + ' movieContainer ' + (a === null ? 'swf_timedout' : 'swf_error'); c.didFlashBlock = !0; B({type: 'ontimeout', ignoreInit: !0, error: e}); F(e) } }; la = function (a, c, d) { typeof w[a] === 'undefined' && (w[a] = []); w[a].push({method: c, scope: d || null, fired: !1}) }; B =
function (a) { a || (a = {type: c.ok() ? 'onready' : 'ontimeout'}); if (!k && a && !a.ignoreInit || a.type === 'ontimeout' && (c.ok() || s && !a.ignoreInit)) return !1; var e = {success: a && a.ignoreInit ? c.ok() : !s}, d = a && a.type ? w[a.type] || [] : [], b = [], g, e = [e], f = n && c.useFlashBlock && !c.ok(); if (a.error)e[0].error = a.error; for (a = 0, g = d.length; a < g; a++)!0 !== d[a].fired && b.push(d[a]); if (b.length) for (a = 0, g = b.length; a < g; a++) if (b[a].scope ? b[a].method.apply(b[a].scope, e) : b[a].method.apply(this, e), !f)b[a].fired = !0; return !0 }; C = function () {
      h.setTimeout(function () {
        c.useFlashBlock &&
sa(); B(); typeof c.onload === 'function' && c.onload.apply(h); c.waitForWindowLoad && o.add(h, 'load', C)
      }, 1)
    }; wa = function () { if (typeof t !== 'undefined') return t; var a = !1, c = navigator, d = c.plugins, b, g = h.ActiveXObject; if (d && d.length)(c = c.mimeTypes) && c['application/x-shockwave-flash'] && c['application/x-shockwave-flash'].enabledPlugin && c['application/x-shockwave-flash'].enabledPlugin.description && (a = !0); else if (typeof g !== 'undefined') { try { b = new g('ShockwaveFlash.ShockwaveFlash') } catch (f) {}a = !!b } return t = a }; La = function () {
      var a,
        e, d = c.audioFormats; if (xa && q.match(/os (1|2|3_0|3_1)/i)) { if (c.hasHTML5 = !1, c.html5Only = !0, c.oMC)c.oMC.style.display = 'none' } else if (c.useHTML5Audio)c.hasHTML5 = !c.html5 || !c.html5.canPlayType ? !1 : !0; if (c.useHTML5Audio && c.hasHTML5) for (e in d) if (d.hasOwnProperty(e) && (d[e].required && !c.html5.canPlayType(d[e].type) || c.preferFlash && (c.flash[e] || c.flash[d[e].type])))a = !0; c.ignoreFlash && (a = !1); c.html5Only = c.hasHTML5 && c.useHTML5Audio && !a; return !c.html5Only
    }; aa = function (a) {
      var e, d, b = 0; if (a instanceof Array) {
        for (e =
0, d = a.length; e < d; e++) if (a[e] instanceof Object) { if (c.canPlayMIME(a[e].type)) { b = e; break } } else if (c.canPlayURL(a[e])) { b = e; break } if (a[b].url)a[b] = a[b].url; a = a[b]
      } return a
    }; Ia = function (a) { if (!a._hasTimer)a._hasTimer = !0, !za && c.html5PollingInterval && (O === null && $ === 0 && (O = h.setInterval(Ka, c.html5PollingInterval)), $++) }; Ja = function (a) { if (a._hasTimer)a._hasTimer = !1, !za && c.html5PollingInterval && $-- }; Ka = function () {
      var a; if (O !== null && !$) return h.clearInterval(O), O = null, !1; for (a = c.soundIDs.length - 1; a >= 0; a--) {
        c.sounds[c.soundIDs[a]].isHTML5 &&
c.sounds[c.soundIDs[a]]._hasTimer && c.sounds[c.soundIDs[a]]._onTimer()
      }
    }; F = function (a) { a = typeof a !== 'undefined' ? a : {}; typeof c.onerror === 'function' && c.onerror.apply(h, [{type: typeof a.type !== 'undefined' ? a.type : null}]); typeof a.fatal !== 'undefined' && a.fatal && c.disable() }; Na = function () { if (!Qa || !wa()) return !1; var a = c.audioFormats, e, d; for (d in a) if (a.hasOwnProperty(d) && (d === 'mp3' || d === 'mp4')) if (c.html5[d] = !1, a[d] && a[d].related) for (e = a[d].related.length - 1; e >= 0; e--)c.html5[a[d].related[e]] = !1 }; this._setSandboxType =
function () {}; this._externalInterfaceOK = function () { if (c.swfLoaded) return !1; (new Date()).getTime(); c.swfLoaded = !0; ca = !1; Qa && Na(); setTimeout(ia, y ? 100 : 1) }; W = function (a, e) {
      function d (a, b) { return '<param name="' + a + '" value="' + b + '" />' } if (J && K) return !1; if (c.html5Only) return ma(), c.oMC = S(c.movieID), ia(), K = J = !0, !1; var b = e || c.url, g = c.altURL || b, f; f = pa(); var h, i, j = G(), k, m = null, m = (m = l.getElementsByTagName('html')[0]) && m.dir && m.dir.match(/rtl/i), a = typeof a === 'undefined' ? c.id : a; ma(); c.url = Ha(Ba ? b : g); e = c.url; c.wmode =
!c.wmode && c.useHighPerformance ? 'transparent' : c.wmode; if (c.wmode !== null && (q.match(/msie 8/i) || !y && !c.useHighPerformance) && navigator.platform.match(/win32|win64/i))c.wmode = null; f = {name: a, id: a, src: e, quality: 'high', allowScriptAccess: c.allowScriptAccess, bgcolor: c.bgColor, pluginspage: Ta + 'www.macromedia.com/go/getflashplayer', title: 'JS/Flash audio component (SoundManager 2)', type: 'application/x-shockwave-flash', wmode: c.wmode, hasPriority: 'true'}; if (c.debugFlash)f.FlashVars = 'debug=1'; c.wmode || delete f.wmode
      if (y)b = l.createElement('div'), i = ['<object id="' + a + '" data="' + e + '" type="' + f.type + '" title="' + f.title + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="' + Ta + 'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">', d('movie', e), d('AllowScriptAccess', c.allowScriptAccess), d('quality', f.quality), c.wmode ? d('wmode', c.wmode) : '', d('bgcolor', c.bgColor), d('hasPriority', 'true'), c.debugFlash ? d('FlashVars', f.FlashVars) : '', '</object>'].join(''); else {
        for (h in b = l.createElement('embed'),
          f)f.hasOwnProperty(h) && b.setAttribute(h, f[h])
      }qa(); j = G(); if (f = pa()) {
        if (c.oMC = S(c.movieID) || l.createElement('div'), c.oMC.id) { k = c.oMC.className; c.oMC.className = (k ? k + ' ' : 'movieContainer') + (j ? ' ' + j : ''); c.oMC.appendChild(b); if (y)h = c.oMC.appendChild(l.createElement('div')), h.className = 'sm2-object-box', h.innerHTML = i; K = !0 } else {
          c.oMC.id = c.movieID; c.oMC.className = 'movieContainer ' + j; h = j = null; if (!c.useFlashBlock) {
            if (c.useHighPerformance)j = {position: 'fixed', width: '8px', height: '8px', bottom: '0px', left: '0px', overflow: 'hidden'}
            else if (j = {position: 'absolute', width: '6px', height: '6px', top: '-9999px', left: '-9999px'}, m)j.left = Math.abs(parseInt(j.left, 10)) + 'px'
          } if (Xa)c.oMC.style.zIndex = 1E4; if (!c.debugFlash) for (k in j)j.hasOwnProperty(k) && (c.oMC.style[k] = j[k]); try { y || c.oMC.appendChild(b); f.appendChild(c.oMC); if (y)h = c.oMC.appendChild(l.createElement('div')), h.className = 'sm2-object-box', h.innerHTML = i; K = !0 } catch (n) { throw Error(u('domError') + ' \n' + n.toString()) }
        }
      } return J = !0
    }; V = function () {
      if (c.html5Only) return W(), !1; if (i) return !1
      i = c.getMovie(c.id); if (!i)M ? (y ? c.oMC.innerHTML = ra : c.oMC.appendChild(M), M = null, J = !0) : W(c.id, c.url), i = c.getMovie(c.id); typeof c.oninitmovie === 'function' && setTimeout(c.oninitmovie, 1); return !0
    }; D = function () { setTimeout(Ea, 1E3) }; Ea = function () {
      var a, e = !1; if (N) return !1; N = !0; o.remove(h, 'load', D); if (ca && !Aa) return !1; k || (a = c.getMoviePercent(), a > 0 && a < 100 && (e = !0)); setTimeout(function () {
        a = c.getMoviePercent(); if (e) return N = !1, h.setTimeout(D, 1), !1; !k && Ra && (a === null ? c.useFlashBlock || c.flashLoadTimeout === 0 ? c.useFlashBlock &&
sa() : X(!0) : c.flashLoadTimeout !== 0 && X(!0))
      }, c.flashLoadTimeout)
    }; U = function () { if (Aa || !ca) return o.remove(h, 'focus', U), !0; Aa = Ra = !0; N = !1; D(); o.remove(h, 'focus', U); return !0 }; Oa = function () { var a, e = []; if (c.useHTML5Audio && c.hasHTML5) for (a in c.audioFormats)c.audioFormats.hasOwnProperty(a) && e.push(a + ': ' + c.html5[a] + (!c.html5[a] && t && c.flash[a] ? ' (using flash)' : c.preferFlash && c.flash[a] && t ? ' (preferring flash)' : !c.html5[a] ? ' (' + (c.audioFormats[a].required ? 'required, ' : '') + 'and no flash support)' : '')) }; L = function (a) {
      if (k) return !1
      if (c.html5Only) return k = !0, C(), !0; var e = !0, d; if (!c.useFlashBlock || !c.flashLoadTimeout || c.getMoviePercent())k = !0, s && (d = {type: !t && n ? 'NO_FLASH' : 'INIT_TIMEOUT'}); if (s || a) { if (c.useFlashBlock && c.oMC)c.oMC.className = G() + ' ' + (c.getMoviePercent() === null ? 'swf_timedout' : 'swf_error'); B({type: 'ontimeout', error: d, ignoreInit: !0}); F(d); e = !1 }s || (c.waitForWindowLoad && !ja ? o.add(h, 'load', C) : C()); return e
    }; Da = function () {
      var a, e = c.setupOptions; for (a in e) {
        e.hasOwnProperty(a) && (typeof c[a] === 'undefined' ? c[a] = e[a] : c[a] !==
e[a] && (c.setupOptions[a] = c[a]))
      }
    }; ia = function () { if (k) return !1; if (c.html5Only) { if (!k)o.remove(h, 'load', c.beginDelayedInit), c.enabled = !0, L(); return !0 }V(); try { i._externalInterfaceTest(!1), Fa(!0, c.flashPollingInterval || (c.useHighPerformance ? 10 : 50)), c.debugMode || i._disableDebug(), c.enabled = !0, c.html5Only || o.add(h, 'unload', ha) } catch (a) { return F({type: 'JS_TO_FLASH_EXCEPTION', fatal: !0}), X(!0), L(), !1 }L(); o.remove(h, 'load', c.beginDelayedInit); return !0 }; E = function () {
      if (oa) return !1; oa = !0; Da(); qa(); !t && c.hasHTML5 &&
c.setup({useHTML5Audio: !0, preferFlash: !1}); Ma(); c.html5.usingFlash = La(); n = c.html5.usingFlash; Oa(); !t && n && c.setup({flashLoadTimeout: 1}); l.removeEventListener && l.removeEventListener('DOMContentLoaded', E, !1); V(); return !0
    }; va = function () { l.readyState === 'complete' && (E(), l.detachEvent('onreadystatechange', va)); return !0 }; na = function () { ja = !0; o.remove(h, 'load', na) }; wa(); o.add(h, 'focus', U); o.add(h, 'load', D); o.add(h, 'load', na); l.addEventListener ? l.addEventListener('DOMContentLoaded', E, !1) : l.attachEvent ? l.attachEvent('onreadystatechange',
      va) : F({type: 'NO_DOM2_EVENTS', fatal: !0}); l.readyState === 'complete' && setTimeout(E, 100)
  } var da = null; if (typeof SM2_DEFER === 'undefined' || !SM2_DEFER)da = new Q(); ea.SoundManager = Q; ea.soundManager = da
})(window)
