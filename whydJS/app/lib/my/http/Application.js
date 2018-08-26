var fs = require('fs')
var path = require('path')
var url = require('url')
var http = require('http')
var querystring = require('querystring')

var formidable = require('formidable')
var qset = require('q-set') // instead of body-parser, for form fields with brackets

var my = require('../')
var extendResponse = require('./Response').extend
var AppendBuffer = require('../util').Buffer

var Headers = require('./mime-types.js')

var LOG_TIMEOUT = 30000,
  LOG_THRESHOLD = 500,
  MAX_LEN_UA = 12

var lastAccessPerUA = process.lastAccessPerUA = {} // { user-agent -> { uid -> timestamp } }

//= ===========================================================================
// Class Application
var aa = exports.Application = my.Class(http.Server, {

  constructor: function (appDir, devMode, sessionMiddleware, options) {
    var self = this

    options || (options = {})

    // console.log("appDir", appDir); // AJ

    http.Server.call(this, function (request, response) {
      // called on each request

      // AJ: logging of requests (for performance diagnosis)
      var startDate = new Date(), path = request.url.split('?')[0]
      // var timeout = setTimeout(makeResponseLogger("TIMEOUT"), LOG_TIMEOUT);
      function makeResponseLogger (suffix) {
        return function (response) {
          // clearTimeout(timeout);
          var fields = {
            uid: (request.session || {}).whydUid,
            ua: (request.headers['user-agent'] || '').substr(0, MAX_LEN_UA)
          }
          if (fields.ua && fields.uid) { (lastAccessPerUA[fields.ua] = lastAccessPerUA[fields.ua] || {})[fields.uid] = startDate }
          var duration = Date.now() - startDate
          if (duration < LOG_THRESHOLD) { return }
          var logLine = [startDate.toUTCString(), request.method, path, '(' + duration + 'ms)']
          if (suffix) { logLine.push(suffix) }
          for (var i in fields) {
            if (fields[i]) { logLine.push(i + '=' + fields[i]) }
          }
          logLine = logLine.join(' ')
          fs.appendFile(self._accessLogFile, logLine + '\n')
        }
      }

      try {
        response.logRequest = makeResponseLogger() // AJ
        _checkRoutes(self, request, response)
      } catch (e) {
        response.logRequest = makeResponseLogger('FAIL') // AJ
        _processError(self, e, response)
      }
    })

    this.models = {}
    this.views = {}
    this.controllers = {}

    this._devMode = devMode
    this._errorHandler = options.errorHandler

    this._modelsDir = appDir + '/app/models'
    this._viewsDir = appDir + '/app/views'
    this._controllersDir = appDir + '/app/controllers'
    this._publicDir = appDir + '/public'

    this._configFile = appDir + '/config/app.conf'
    this._routeFile = appDir + '/config/app.route'
    this._accessLogFile = appDir + '/access.log'

    this._modulesModifyDates = {}
    this._routes = {
      GET: [],
      POST: [],
      HEAD: [],
      OPTIONS: [],
      CONNECT: [],
      TRACE: [],
      PUT: [],
      DELETE: []
    }

    this._port = null
    this._queryStringInJSON = null
    this._maxCacheSize = null
    this._readBufferMaxSize = null
    this._writeBuffer = null

    this.sessionMiddleware = sessionMiddleware

    this.bodyParser = function (request, response, callback) {
      var form = new formidable.IncomingForm()
      form.uploadDir = options.uploadDir
      form.keepExtensions = options.keepExtensions
      form.parse(request, function (err, postParams, files) {
        if (err) console.error('formidable parsing error:', err)
        // using qset to parse fields with brackets [] for url-encoded form data:
        // https://github.com/felixge/node-formidable/issues/386#issuecomment-274315370
        var parsedParams = {}
        for (var key in postParams) {
          qset.deep(parsedParams, key, postParams[key])
        }
        request.body = Object.assign({}, postParams, parsedParams)
        request.files = files
        callback(request, response)
      })
    }

    _configure(this)
    _updateModules(this)
    _updateRoutes(this)
  },

  start: function () {
    this._isRunning = true
    this.listen(this._port)
    console.log('Server running at http://127.0.0.1:' + this._port + '/')
  },

  stop: function () {
    if (this._isRunning) {
      this.close()
      this._isRunning = false
    }
  },

  route: function (request, controller) {
    var routes = this._routes.GET
    var route = {controller: controller, hasQuery: request.contains('?')}
    var regexp = /(GET|POST|HEAD|OPTIONS|CONNECT|TRACE|PUT|DELETE)\s*(\/\S+)/
    var requestParams, requestParam, requestParamSplit

    if (regexp.test(request)) {
      routes = this._routes[RegExp.$1]
      request = RegExp.$2
    }

    requestParams = request.match(/\{[\w\$]+(\:\w+)?\}/g)
    if (requestParams) {
      route.requestParamNames = []
      route.requestParamTypes = []
      for (var i = 0; i < requestParams.length; i++) {
        requestParam = requestParams[i]
        requestParamSplit = requestParam.substring(1, requestParam.length - 1)
        requestParamSplit = requestParamSplit.split(':')
        if (requestParamSplit.length > 1) {
          if (requestParamSplit[1] === 'int') { request = request.replace(requestParam, '(\\d+)') } else if (requestParamSplit[1] === 'boolean') { request = request.replace(requestParam, '(true|false)') } else { request = request.replace(requestParam, '([\\w\\-\\.]+)') }
        } else {
          request = request.replace(requestParam, '([\\w\\-\\.\\%]+)')
        }
        route.requestParamNames.push(requestParamSplit[0])
        route.requestParamTypes.push(requestParamSplit[1] || 'string')
      }
    }

    route.pattern = new RegExp('^' + request.replace(/[\/\.\?]/g, function (s) {
      return '\\' + s
    }) + '$')
    routes.push(route)

    return this
  }

})

//= =============================================================================
// private methods
function _configure (self) {
  var config = getConfigObject(self._configFile, '=')

  self._jsonFormatQueryString = config.jsonFormatQueryString === 'true'
  self._maxCacheSize = parseInt(config.maxCacheSize)
  self._readBufferMaxSize = parseInt(config.readBufferMaxSize)

  var port = (process.appParams || {}).port || parseInt(config.port)
  if (port !== self._port) {
    self._port = port
    if (self._isRunning) {
      self.stop()
      self.start()
    }
  }

  var writeBufferSize = parseInt(config.writeBufferSize)
  if (!self._writeBuffer || writeBufferSize !== self._writeBuffer.length) { self._writeBuffer = new AppendBuffer(writeBufferSize) }

  self.config = config
}

function _updateModules (self) {
  var modifyDates = self._modulesModifyDates
  loadModules(self._modelsDir, self.models, modifyDates, 'm')
  loadModules(self._viewsDir, self.views, modifyDates, 'v')
  loadModules(self._controllersDir, self.controllers, modifyDates, 'c')
}

function _updateRoutes (self) {
  for (var r in self._routes) { self._routes[r].length = 0 }
  var routes = getRouteArray(self._routeFile)
  for (var i = 0, route; route = routes[i]; i++) {
    self.route(route.pattern, getObjectFromPath(route.controller, self, '.'))
  }
}

function _renderFile (self, file, fileSize, response) {
  var fileExtension = path.extname(file)
  var bufferSize = Math.min(fileSize, self._readBufferMaxSize)
  response.writeHead(200, Headers[fileExtension] || Headers['default'])
  fs.createReadStream(file, {bufferSize: bufferSize})
    .on('data', function (data) { response.write(data) })
    .on('end', function () { response.end() })
}

function prepareResponse (self, request, response, callback) {
  extendResponse(response, self._writeBuffer)
  self.bodyParser(request, response, function () {
    if (self.sessionMiddleware) {
      self.sessionMiddleware(request, response, callback)
    } else {
      callback(request, response)
    }
  })
}

//= =============================================================================
// process request
function _checkRoutes (self, request, response) {
  if (self._devMode) {
    _updateModules(self)
    _updateRoutes(self)
  }

  var routes = self._routes[request.method]
  var urlObj = url.parse(request.url)
  var path = urlObj.pathname
  var query = urlObj.query
  var route, routeMatch, requestParams

  // AJ: moved up, so that route-based controllers could leverage requestParams
  if (query) {
    try {
      requestParams = self._jsonFormatQueryString
        ? JSON.parse(decodeURI(query))
        : querystring.parse(query)
    } catch (e) {
      console.log('error', e) // AJ
    }
  }

  if (routes) {
    for (var i = 0; route = routes[i]; i++) {
      routeMatch = (route.hasQuery ? request.url : path).match(route.pattern)
      if (routeMatch) {
        var routeParams = getRequestParams(route, routeMatch)
        if (routeParams) {
          requestParams = requestParams || {}
          for (var j in routeParams) { requestParams[j] = routeParams[j] }
        }
        prepareResponse(self, request, response, function (request, response) {
          if (!route.controller) { console.error('controller not found', route.hasQuery ? request.url : path, route.pattern) } else { route.controller.call(self, request, requestParams, response) }
        })
        return
      }
    }
  }

  _checkPublicControllers(self, request, requestParams, response)
}

function _checkPublicControllers (self, request, requestParams, response) {
  var pathname = 'public' + url.parse(request.url).pathname
  var controller = getObjectFromPath(pathname, self.controllers, '/')
  if (controller) {
    extendResponse(response, self._writeBuffer)
    self.bodyParser(request, response, function () {
      if (self.sessionMiddleware) {
        self.sessionMiddleware(request, response, function (request, response) {
          controller.call(self, request, requestParams, response)
        })
      } else {
        controller.call(self, request, requestParams, response)
      }
    })
  } else {
    _checkPublicViews(self, request, requestParams, response)
  }
}

function _checkPublicViews (self, request, requestParams, response) {
  var pathname = 'public' + url.parse(request.url).pathname
  var view = getObjectFromPath(pathname, self.views, '/')
  if (view) {
    var model = getObjectFromPath(pathname, self.models, '/')
    var data = typeof model === 'function'
      ? model(requestParams) : requestParams
    extendResponse(response, self._writeBuffer)
    response.render(view, data)
  } else { _checkPublicFiles(self, request, requestParams, response) }
}

function _checkPublicFiles (self, request, requestParams, response) {
  var urlObj = url.parse(request.url)
  var pathname = self._publicDir + urlObj.pathname
  function renderErrorPage (statusCode) {
    if (self._errorHandler) {
      prepareResponse(self, request, response, function (request, response) {
        self._errorHandler(request, requestParams, response, statusCode)
      })
    } else if (statusCode == 404) {
      response.end('error 404 not found')
    } else if (statusCode == 401) {
      response.writeHead(401, {'Content-Type': 'text/plain'})
      response.end('error 401 unauthorized')
    }
  }
  if (path.relative(self._publicDir, pathname).substr(0, 3) === '../') {
    return renderErrorPage(401)
  }
  fs.stat(pathname, function (error, stats) {
    if (error) {
      renderErrorPage(404)
    } else if (!stats.isFile()) {
      if (!pathname.endsWith('/index.html')) {
        request.url = urlObj.pathname + 'index.html' +
          (urlObj.search ? urlObj.search : '')
        _checkRoutes(self, request, response)
      } else {
        renderErrorPage(404)
      }
    } else {
      _renderFile(self, pathname, stats.size, response)
    }
  })
}

function _processError (self, e, response) {
  console.log('error', e.stack) // AJ
  response.end(e.stack)
}

//= =============================================================================
// inner functions
function getConfigObject (file) {
  var fileText = fs.readFileSync(file, 'utf8')
  var lines = fileText.split('\n')
  var configObject = {}
  var line
  for (var i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('=')
    if (line.length >= 2) { configObject[line[0].trim()] = line[1].trim() }
  }
  return configObject
}

function getRouteArray (file) {
  var fileText = fs.readFileSync(file, 'utf8')
  var lines = fileText.split('\n')
  var routeArray = []
  var line
  for (var i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('->')
    if (line.length >= 2) { routeArray.push({pattern: line[0].trim(), controller: line[1].trim()}) }
  }
  return routeArray
}

function getObjectFromPath (path, root, separator) {
  if (!path) return null
  var obj = root
  path = path.split(separator)
  for (var i = 0; i < path.length && obj !== undefined; i++) { obj = obj[path[i]] }
  return obj
}

function getRequestParams (route, routeMatch) {
  var names = route.requestParamNames
  var types = route.requestParamTypes
  var name, type, requestParams
  if (names) {
    requestParams = {}
    for (var j = 0; j < names.length; j++) {
      name = names[j]
      type = types[j]
      if (type === 'int') { requestParams[name] = parseInt(routeMatch[j + 1]) } else if (type === 'boolean') { requestParams[name] = routeMatch[j + 1] === 'true' } else if (type === 'string') { requestParams[name] = routeMatch[j + 1] } else if (type === 'Object') { requestParams[name] = JSON.parse(routeMatch[j + 1]) }
    }
  }
  return requestParams
}

function loadModules (dir, modulesObj, lastModifyDates, type) {
  var files = fs.readdirSync(dir)
  var file, stats, name, modulePath, modifyDate
  for (var i = 0; file = files[i]; i++) {
    modulePath = dir + '/' + file
    stats = fs.statSync(modulePath)
    if (stats.isFile()) {
      if (file.endsWith('.js')) {
        name = path.basename(file, '.js')
        modifyDate = new Date(stats.mtime)

        // console.log("loading module", file); // AJ

        try {
          if (!modulesObj[name] || modifyDate > lastModifyDates[file]) {
            if (modulesObj[name]) { require.cache[modulePath] = null }
            if (type === 'm') { modulesObj[name] = require(modulePath).model } else if (type === 'v') { modulesObj[name] = require(modulePath).view } else if (type === 'c') { modulesObj[name] = require(modulePath).controller }
            lastModifyDates[file] = modifyDate
          }
        } catch (e) {
          console.log(e)
          console.log(e.stack)
        }
      }
    } else {
      modulesObj[file] = modulesObj[file] || {}
      lastModifyDates[file] = lastModifyDates[file] || {}
      loadModules(modulePath, modulesObj[file], lastModifyDates[file], type)
    }
  }
}
