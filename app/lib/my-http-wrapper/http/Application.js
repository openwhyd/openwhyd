const express = require('express');

var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');

var formidable = require('formidable'); // TODO: remove ?
var qset = require('q-set'); // instead of body-parser, for form fields with brackets

const LOG_THRESHOLD = 500;

const sessionTracker = require('../../../controllers/admin/session.js');

// From Response.js

const ResponseExtension = {
  legacyRender: function(view, data, headers = {}, statusCode) {
    const isString = typeof view === 'string';
    if (!headers['content-type']) {
      headers['content-type'] = isString ? 'text/plain' : 'application/json';
    }
    this.set(headers)
      .status(statusCode || 200)
      .send(isString ? view : JSON.stringify(view));
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

    this._port = (process.appParams || {}).port;

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

    this.expressApp.use(function bodyParser(request, response, callback) {
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
        callback();
      });
    });

    if (sessionMiddleware) {
      this.expressApp.use(sessionMiddleware);
    }

    // called on non-static requests
    this.expressApp.use(function(request, response, next) {
      const startDate = new Date();
      const path = request.url.split('?')[0];
      const userId = (request.session || {}).whydUid;
      const userAgent = request.headers['user-agent'];

      sessionTracker.notifyUserActivity({ startDate, userId, userAgent }); // maintain lastAccessPerUA

      // whenever a request is slow to respond, append log entry to _accessLogFile
      response.on('finish', () => {
        appendSlowQueryToAccessLog({
          accessLogFile: self._accessLogFile,
          startDate,
          method: request.method,
          path,
          userId,
          userAgent
        });
      });

      //_checkRoutes(self, request, response);
      next();
    });

    loadRoutesFromFile(this._routeFile).forEach(
      ({ pattern, controller: name }) => {
        const { method, path } = parseExpressRoute({ pattern, name });
        attachLegacyRoute({
          expressApp: this.expressApp,
          method,
          path,
          controllerFile: loadControllerFile({ name, appDir: this._appDir })
        });
      }
    );
  }

  start() {
    this._isRunning = true;
    this.expressServer = this.expressApp.listen(this._port, () =>
      console.log('Server running at http://127.0.0.1:' + this._port + '/')
    );
  }

  stop() {
    if (this._isRunning) {
      this.expressServer.close();
      this._isRunning = false;
    }
  }
};

//==============================================================================
// private methods

/*
function _checkRoutes(self, request, response) {
  var routes = self._routes[request.method];
  var urlObj = url.parse(request.url);
  var path = urlObj.pathname;
  var route, routeMatch;
  let requestParams = querystring.parse(urlObj.query);

  if (routes) {
    for (var i = 0; (route = routes[i]); i++) {
      routeMatch = (route.hasQuery ? request.url : path).match(route.pattern);
      if (routeMatch) {
        var routeParams = getRequestParams(route, routeMatch); // from path (e.g. `/{varName}`)
        if (routeParams) {
          requestParams = requestParams || {};
          for (var j in routeParams) requestParams[j] = routeParams[j];
        }
        response.legacyRender = ResponseExtension.legacyRender;
        if (!route.controller)
          console.error(
            'controller not found',
            route.hasQuery ? request.url : path,
            route.pattern
          );
        else route.controller.call(self, request, requestParams, response);
        return;
      }
    }
  }

  if (self._errorHandler) {
    response.legacyRender = ResponseExtension.legacyRender;
    self._errorHandler(request, requestParams, response, 404);
  } else {
    response.res.sendStatus(statusCode);
  }
}
*/

// returns a list of { pattern, controller } from the provided file (e.g. app.route)
function loadRoutesFromFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  var routeArray = [];
  var line;
  for (var i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('->');
    if (line.length >= 2)
      routeArray.push({ pattern: line[0].trim(), controller: line[1].trim() });
  }
  return routeArray;
}

// for a given app.route entry, returns { method, path } to define an Express endpoint
function parseExpressRoute({ pattern, name }) {
  const [upperCaseMethod, legacyPath] = pattern.split('?')[0].split(/\s+/);
  const method = upperCaseMethod.toLowerCase();
  const pathParams = legacyPath.match(/\{[\w\$]+\}/g);
  const path = (pathParams || []).reduce(
    (path, param) =>
      path.replace(param, `:${param.substring(1, param.length - 1)}`),
    legacyPath
  );
  return { method, path };
}

// loads and returns the exports of a js controller file, given its name
function loadControllerFile({ name, appDir }) {
  return require(`${appDir}/${name.replace(/\./g, '/')}.js`);
}

// attaches a legacy controller to an Express app
function attachLegacyRoute({ expressApp, method, path, controllerFile }) {
  expressApp[method](path, function endpointHandler(req, res) {
    const reqParams = { ...req.params, ...req.query };
    res.legacyRender = ResponseExtension.legacyRender; // TODO: get rid of that legacy method
    controllerFile.controller(req, reqParams, res);
  });
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
