const express = require('express');

var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');

var formidable = require('formidable');
var qset = require('q-set'); // instead of body-parser, for form fields with brackets

var Headers = require('./mime-types.js');

const LOG_THRESHOLD = 500;

const sessionTracker = require('../../../controllers/admin/session.js');

// From Response.js

var DEFAULT_BUFFER_SIZE = 4096;

const ResponseExtension = {
  legacyRender: function(view, data, headers, statusCode) {
    headers = headers || {};
    if (typeof view === 'string') {
      if (!headers['content-type']) headers['content-type'] = 'text/plain';
      this.writeHead(statusCode || 200, headers);
      this.end(view);
    } else {
      if (!headers['content-type'])
        headers['content-type'] = 'application/json';
      this.writeHead(statusCode || 200, headers);
      this.end(JSON.stringify(view));
    }
    this.logRequest && this.logRequest(this); // AJ
  },

  flush: function() {
    this.write(this.buffer.sliceData());
    this.buffer.position = 0;
  }
};

const extendResponse = function(response) {
  for (let method in ResponseExtension) {
    response[method] = ResponseExtension[method];
  }
};

//============================================================================
// Class Application
exports.Application = class Application {
  constructor(appDir, devMode, sessionMiddleware, options = {}) {
    var self = this;

    this._errorHandler = options.errorHandler;

    this._appDir = appDir + '/app';
    this._publicDir = appDir + '/public';

    this._routeFile = appDir + '/config/app.route';
    this._accessLogFile = appDir + '/access.log';

    this._modulesModifyDates = {};
    this._routes = {
      GET: [],
      POST: [],
      HEAD: [],
      OPTIONS: [],
      CONNECT: [],
      TRACE: [],
      PUT: [],
      DELETE: []
    };

    this._port = (process.appParams || {}).port;
    this._queryStringInJSON = null;
    this._maxCacheSize = null;

    this.sessionMiddleware = !sessionMiddleware
      ? undefined
      : function(req, res, next) {
          return sessionMiddleware(req, res, function(err) {
            if (err) {
              console.error('error from sessionMiddleware:', err);
            }
            return next(req, res);
          });
        };

    this.bodyParser = function(request, response, callback) {
      var form = new formidable.IncomingForm();
      form.uploadDir = options.uploadDir;
      form.keepExtensions = options.keepExtensions;
      form.parse(request, function(err, postParams, files) {
        if (err) console.error('formidable parsing error:', err);
        // using qset to parse fields with brackets [] for url-encoded form data:
        // https://github.com/felixge/node-formidable/issues/386#issuecomment-274315370
        var parsedParams = {};
        for (var key in postParams) {
          qset.deep(parsedParams, key, postParams[key]);
        }
        request.body = Object.assign({}, postParams, parsedParams);
        request.files = files;
        callback(request, response);
      });
    };

    _updateRoutes(this);

    this.expressApp = express();

    // called on all requests
    this.expressApp.use(function(req, res, next) {
      res.set(
        'Cache-Control',
        'max-age=0,no-cache,no-store,post-check=0,pre-check=0'
      );
      next();
    });

    this.expressApp.use(express.static(this._publicDir));

    // called on non-static requests
    this.expressApp.use(function(request, response, next) {
      const startDate = new Date();
      const path = request.url.split('?')[0];
      function makeResponseLogger(suffix) {
        return function(response) {
          const userId = (request.session || {}).whydUid;
          const userAgent = request.headers['user-agent'];
          // maintain lastAccessPerUA
          sessionTracker.logResponse({ startDate, userId, userAgent });
          // in case of slow query, append log entry to _accessLogFile
          appendSlowQueryToAccessLog({
            accessLogFile: self._accessLogFile,
            startDate,
            method: request.method,
            path,
            suffix,
            userId,
            userAgent
          });
        };
      }

      try {
        response.logRequest = makeResponseLogger();
        _checkRoutes(self, request, response);
      } catch (e) {
        response.logRequest = makeResponseLogger('FAIL');
        console.log('error', e.stack);
        response.end(e.stack);
      }
    });
  }

  start() {
    this._isRunning = true;
    this.expressApp.listen(this._port, () =>
      console.log('Server running at http://127.0.0.1:' + this._port + '/')
    );
  }

  stop() {
    if (this._isRunning) {
      this.expressApp.close();
      this._isRunning = false;
    }
  }

  route(request, controller) {
    let routes = this._routes.GET;
    const route = { controller: controller, hasQuery: request.includes('?') };
    const regexp = /(GET|POST|HEAD|OPTIONS|CONNECT|TRACE|PUT|DELETE)\s*(\/\S+)/;

    if (regexp.test(request)) {
      routes = this._routes[RegExp.$1];
      request = RegExp.$2;
    }

    const requestParams = request.match(/\{[\w\$]+(\:\w+)?\}/g);
    if (requestParams) {
      route.requestParamNames = [];
      for (var i = 0; i < requestParams.length; i++) {
        const requestParam = requestParams[i];
          request = request.replace(requestParam, '([\\w\\-\\.\\%]+)');
        route.requestParamNames.push(
          requestParam.substring(1, requestParam.length - 1)
        );
      }
    }

    route.pattern = new RegExp(
      '^' +
        request.replace(/[\/\.\?]/g, function(s) {
          return '\\' + s;
        }) +
        '$'
    );
    routes.push(route);

    return this;
  }
};

//==============================================================================
// private methods

function _updateRoutes(self) {
  for (var r in self._routes) self._routes[r].length = 0;
  var routes = getRouteArray(self._routeFile);

  for (var i = 0, route; (route = routes[i]); i++) {
    const controllerPath =
      self._appDir + '/' + route.controller.replace(/\./g, '/');
    const { controller } = require(controllerPath);
    self.route(route.pattern, controller);
  }
}

function prepareResponse(self, request, response, callback) {
  extendResponse(response);
  self.bodyParser(request, response, function() {
    if (self.sessionMiddleware) {
      self.sessionMiddleware(request, response, callback);
    } else {
      callback(request, response);
    }
  });
}

//==============================================================================
// process request
function _checkRoutes(self, request, response) {
  var routes = self._routes[request.method];
  var urlObj = url.parse(request.url);
  var path = urlObj.pathname;
  var query = urlObj.query;
  var route, routeMatch, requestParams;

  // AJ: moved up, so that route-based controllers could leverage requestParams
  if (query) {
    try {
      requestParams = self._jsonFormatQueryString
        ? JSON.parse(decodeURI(query))
        : querystring.parse(query);
    } catch (e) {
      console.log('error', e); // AJ
    }
  }

  if (routes) {
    for (var i = 0; (route = routes[i]); i++) {
      routeMatch = (route.hasQuery ? request.url : path).match(route.pattern);
      if (routeMatch) {
        var routeParams = getRequestParams(route, routeMatch);
        if (routeParams) {
          requestParams = requestParams || {};
          for (var j in routeParams) requestParams[j] = routeParams[j];
        }
        prepareResponse(self, request, response, function(request, response) {
          if (!route.controller)
            console.error(
              'controller not found',
              route.hasQuery ? request.url : path,
              route.pattern
            );
          else route.controller.call(self, request, requestParams, response);
        });
        return;
      }
    }
  }

    if (self._errorHandler) {
      prepareResponse(self, request, response, function(request, response) {
        self._errorHandler(request, requestParams, response, 404);
      });
  } else {
    response.res.sendStatus(statusCode);
  }
}

function getRouteArray(file) {
  var fileText = fs.readFileSync(file, 'utf8');
  var lines = fileText.split('\n');
  var routeArray = [];
  var line;
  for (var i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('->');
    if (line.length >= 2)
      routeArray.push({ pattern: line[0].trim(), controller: line[1].trim() });
  }
  return routeArray;
}

function getRequestParams(route, routeMatch) {
  var names = route.requestParamNames;
  const requestParams = {};
  if (names) {
    for (var j = 0; j < names.length; j++) {
      const name = names[j];
      requestParams[name] = routeMatch[j + 1];
    }
  }
  return requestParams;
}

function appendSlowQueryToAccessLog({
  accessLogFile,
  startDate,
  method,
  path,
  suffix,
  userId,
  userAgent
}) {
  const duration = Date.now() - startDate;
  if (duration < LOG_THRESHOLD) return;
  const logLine = [
    startDate.toUTCString(),
    method,
    path,
    '(' + duration + 'ms)'
  ];
  if (suffix) logLine.push(suffix);
  if (userId) logLine.push('uid=' + userId);
  if (userAgent) logLine.push('ua=' + sessionTracker.stripUserAgent(userAgent));
  fs.appendFile(accessLogFile, logLine.join(' ') + '\n');
}
