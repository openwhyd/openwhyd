//= =============================================================================
function SessionCache (options) {
  typeof options === 'object' || (options = {})
  this.map = {}
  this.size = 0
  this.maxSize = options.maxSize === 'number' ? options.maxSize : 65536
  this.resizeFactor = options.resizeFactor || 0.75
}

//= =============================================================================
SessionCache.prototype.get = function (id) {
  return this.map[id]
}

//= =============================================================================
SessionCache.prototype.set = function (id, session) {
  if (id) {
    if (this.map[id]) {
      this.map[id] = session
    } else {
      if (this.size >= this.maxSize) { resize(this) }
      this.map[id] = session
      this.size++
    }
  }
}

//= =============================================================================
SessionCache.prototype.remove = function (id) {
  var session
  if (id) {
    session = this.map[id]
    if (session) {
      delete this.map[id]
      this.size--
    }
  }
}

//= =============================================================================
function resize (cache) {
  var refactorSize = Math.floor(cache.maxSize * cache.resizeFactor)
  var array = []
  var now = Date.now()
  for (var i in cache.map) { array.push(cache.map[i]) }
  array.sort(compareSessions)
  cache.map = {}
  cache.size = 0
  for (i = 0; i < refactorSize && array[i].cookie.expires > now; i++) {
    cache.map[array[i].cookie.sid] = array[i]
    cache.size++
  }
}

function compareSessions (a, b) {
  return b.cookie.expires - a.cookie.expires
}

//= =============================================================================
module.exports = SessionCache
