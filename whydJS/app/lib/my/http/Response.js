var fs = require('fs')
var path = require('path')
var extend = require('../util/index').extend

var Headers = require('./mime-types.js')

exports.extend = function (response, buffer) {
  response.buffer = buffer
  extend(response, ResponseExtension)
}

var ResponseExtension = {

  render: function (view, data, headers, statusCode) {
    headers = headers || {}
    headers['Cache-Control'] = 'max-age=0,no-cache,no-store,post-check=0,pre-check=0'
    if (typeof view === 'function') {
      if (!headers['content-type']) { headers['content-type'] = 'text/html' }
      this.writeHead(statusCode || 200, headers)
      view(data).writeIn(this)
      this.flush()
      this.end()
    } else if (typeof view === 'string') {
      if (!headers['content-type']) { headers['content-type'] = 'text/plain' }
      this.writeHead(statusCode || 200, headers)
      this.end(view)
    } else {
      if (!headers['content-type']) { headers['content-type'] = 'application/json' }
      this.writeHead(statusCode || 200, headers)
      this.end(JSON.stringify(view))
    }
    this.logRequest && this.logRequest(this) // AJ
  },

  renderFile: function (file, bufferSize, headers, errorHandler) {
    var self = this
    if (typeof headers === 'function') {
      errorHandler = headers
      headers = null
    }
    fs.stat(file, function (error, stats) {
      if (error || !stats.isFile()) {
        errorHandler
          ? errorHandler.call(self, error)
          : self.render('invalid file')
        return
      }
      var fileExtension = path.extname(file)
      var headers = headers || Headers[fileExtension] || Headers['default']
      self.writeHead(200, headers)
      fs.createReadStream(file, {bufferSize: bufferSize || DEFAULT_BUFFER_SIZE})
        .on('data', function (data) { self.write(data) })
        .on('end', function () { self.end() })
    })
  },

  bufferedWrite: function (data) {
    var nbWritten
    if (typeof data === 'string') {
      nbWritten = this.buffer.append(data)
      if (nbWritten < Buffer.byteLength(data)) {
        this.flush()
        this.bufferedWrite(new Buffer(data).slice(nbWritten))
      }
    } else if (Buffer.isBuffer(data)) {
      nbWritten = this.buffer.append(data)
      if (nbWritten < data.length) {
        this.flush()
        this.bufferedWrite(data.slice(nbWritten))
      }
    } else {
      throw new Error('Response.bufferedWrite: invalid data')
    }
  },

  flush: function () {
    this.write(this.buffer.sliceData())
    this.buffer.position = 0
  }

}

var DEFAULT_BUFFER_SIZE = 4096
