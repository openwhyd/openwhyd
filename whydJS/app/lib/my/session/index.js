var crypto = require('crypto')
var SessionCache = require('./session-cache')
var SessionMongo = require('./session-mongo')

module.exports = function (options) {
  options || (options = {})

  var SECRET = options.secret || fs.readFileSync(options.secretFile, 'utf8')
  var DOMAIN = options.domain
  var PATH = options.path || '/'
  var MAX_AGE = options.maxAge
  var SECURE = !!options.secure
  var HTTP_ONLY = options.httpOnly !== false
  var DB = options.db || options.mongo ? new SessionMongo(options.mongo) : null
  var CACHE = !DB || options.cache ? new SessionCache(options.cache) : null
  var KEY = options.key || 'sid'
  var SID_REG = new RegExp(KEY + '=([^\\s,;]+)')

  switch (MAX_AGE) {
    case 'hour': MAX_AGE = 60 * 60; break
    case 'day': MAX_AGE = 24 * 60 * 60; break
    case 'week': MAX_AGE = 7 * 24 * 60 * 60; break
    case 'month': MAX_AGE = 30 * 7 * 24 * 60 * 60; break
  }

  //= ===========================================================================
  function createSessionCookie (req) {
    var cookie = {sid: sessionId(req)}
    DOMAIN && (cookie.domain = DOMAIN)
    PATH && (cookie.path = PATH)
    MAX_AGE && (cookie.maxAge = MAX_AGE)
    SECURE && (cookie.secure = true)
    HTTP_ONLY && (cookie.httpOnly = true)
    return cookie
  }

  //= ===========================================================================
  function getSession (req, cb) {
    var cookie = parseSessionCookie(req)
    var session
    if (cookie && signature(cookie.value, SECRET) === cookie.signature) {
      session = CACHE ? CACHE.get(cookie.value) : null
      if (session) {
        cb(session)
      } else if (DB) {
        DB.get(cookie.value, cb)
      } else {
        cb()
      }
    } else {
      cb()
    }
  }

  //= ===========================================================================
  function writeSessionCookie (session, req, res) {
    var cookie = session.cookie || (session.cookie = createSessionCookie(req))
    var now = Date.now()
    var expires = cookie.maxAge ? now + cookie.maxAge * 1000 : null
    var cookieString =
      KEY + '=' + cookie.sid + signature(cookie.sid, SECRET) + ';' +
      (expires ? ' expires=' + new Date(expires).toGMTString() + ';' : '') +
      (cookie.domain ? ' domain=' + cookie.domain + ';' : '') +
      (cookie.path ? ' path=' + cookie.path + ';' : '') +
      (cookie.secure ? ' secure;' : '') +
      (cookie.httpOnly ? ' httpOnly;' : '')
    var setCookieHeaderValue = res.getHeader('Set-Cookie')
    if (typeof setCookieHeaderValue === 'string') { setCookieHeaderValue = [setCookieHeaderValue, cookieString] } else if (Array.isArray(setCookieHeaderValue)) { setCookieHeaderValue.push(cookieString) } else { setCookieHeaderValue = cookieString }
    res.setHeader('Set-Cookie', setCookieHeaderValue)
  }

  //= ===========================================================================
  function parseSessionCookie (req) {
    var split, i, len
    if (req.headers.cookie) {
      split = req.headers.cookie.split(';')
      for (i = 0, len = split.length; i < len; i++) {
        if (SID_REG.test(split[i])) {
          return {
            value: RegExp.$1.substr(0, 22),
            signature: RegExp.$1.substr(22, 43)
          }
        }
      }
    }
    return null
  }

  //= ===========================================================================
  return function (req, res, cb) {
    var end = res.end
    var writeHead = res.writeHead
    res.writeHead = function (statusCode, reasonPhrase, headers) {
      if (req.session) { writeSessionCookie(req.session, req, res) }
      writeHead.call(this, statusCode, reasonPhrase, headers)
    }
    res.end = function (data, encoding) {
      var cookie
      if (req.session) {
        cookie = req.session.cookie || createSessionCookie(req)
        req.session.cookie = cookie
        CACHE && CACHE.set(cookie.sid, req.session)
        DB && DB.set(cookie.sid, req.session)
      }
      if (!req.session && req.sessionId) {
        CACHE && CACHE.remove(req.sessionId)
        DB && DB.remove(req.sessionId)
      }
      end.call(this, data, encoding)
    }
    getSession(req, function (session) {
      if (session) {
        req.session = session
        req.sessionId = session.cookie.sid
      }
      cb(req, res)
    })
  }
}

//= =============================================================================
function sessionId (req) {
  return crypto
    .createHash('md5')
    .update(crypto.randomBytes(4).toString('hex') + req.connection.remoteAddress + Date.now())
    .digest('base64')
    .replace(/==$/, '')
}

//= =============================================================================
function signature (str, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(str)
    .digest('base64')
    .replace(/=$/, '')
}
