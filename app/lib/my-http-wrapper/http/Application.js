const express = require('express');
var fs = require('fs');
var formidable = require('formidable'); // TODO: remove ?
var qset = require('q-set'); // instead of body-parser, for form fields with brackets
const sessionTracker = require('../../../controllers/admin/session.js');

const LOG_THRESHOLD = 500;

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

// Middlewares

function noCache(req, res, next) {
  res.set(
    'Cache-Control',
    'max-age=0,no-cache,no-store,post-check=0,pre-check=0'
  );
  next();
}

const makeBodyParser = options =>
  function bodyParser(req, res, callback) {
    var form = new formidable.IncomingForm();
    form.uploadDir = options.uploadDir;
    form.keepExtensions = options.keepExtensions;
    form.parse(req, function(err, postParams, files) {
      if (err) console.error('formidable parsing error:', err);
      // using qset to parse fields with brackets [] for url-encoded form data:
      // https://github.com/felixge/node-formidable/issues/386#issuecomment-274315370
      var parsedParams = {};
      for (var key in postParams) {
        qset.deep(parsedParams, key, postParams[key]);
      }
      req.body = { ...postParams, ...parsedParams };
      req.files = files;
      callback();
    });
  };

const makeStatsUpdater = ({ accessLogFile }) =>
  function statsUpdater(req, res, next) {
    const startDate = new Date();
    const path = req.url.split('?')[0]; // TODO: use req.path instead?
    const userId = (req.session || {}).whydUid;
    const userAgent = req.headers['user-agent'];

    sessionTracker.notifyUserActivity({ startDate, userId, userAgent }); // maintain lastAccessPerUA

    // whenever a request is slow to respond, append log entry to _accessLogFile
    res.on('finish', () => {
      appendSlowQueryToAccessLog({
        accessLogFile,
        startDate,
        method: req.method,
        path,
        userId,
        userAgent
      });
    });

    next();
  };

function injectLegacyFields(req, res, next) {
  res.legacyRender = ResponseExtension.legacyRender; // TODO: get rid of that legacy method
  next();
}

function defaultErrorHandler(req, reqParams, res, statusCode) {
  res.sendStatus(statusCode);
}

const makeNotFound = errorHandler =>
  function notFound(req, res, next) {
    errorHandler(req, req.mergedParams, res, 404);
  };

// Web Application class

exports.Application = class Application {
  constructor(appDir, sessionMiddleware, options = {}) {
    this._errorHandler = options.errorHandler || defaultErrorHandler;
    this._sessionMiddleware = sessionMiddleware;
    this._appDir = appDir + '/app';
    this._publicDir = appDir + '/public';
    this._routeFile = appDir + '/config/app.route';
    this._accessLogFile = appDir + '/access.log';
    this._port = (process.appParams || {}).port;
    this._expressApp = null; // will be lazy-loaded by getExpressApp()
    this._options = options;
  }

  getExpressApp() {
    if (this._expressApp) return this._expressApp;
    const app = express();
    app.use(noCache); // called on all requests
    app.use(express.static(this._publicDir));
    app.use(makeBodyParser(this._options)); // parse uploads and arrays from query params
    app.use(injectLegacyFields);
    this._sessionMiddleware && app.use(this._sessionMiddleware);
    app.use(makeStatsUpdater({ accessLogFile: this._accessLogFile }));
    attachLegacyRoutesFromFile(app, this._appDir, this._routeFile);
    app.use(makeNotFound(this._errorHandler));

    return (this._expressApp = app);
  }

  start() {
    this._isRunning = true;
    this.expressServer = this.getExpressApp().listen(this._port, () =>
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

// Helpers and other private functions

// returns a list of { pattern, name } from the provided file (e.g. app.route)
function loadRoutesFromFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  var routeArray = [];
  var line;
  for (var i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('->');
    if (line.length >= 2)
      routeArray.push({ pattern: line[0].trim(), name: line[1].trim() });
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
    req.mergedParams = { ...req.params, ...req.query };
    return controllerFile.controller(req, req.mergedParams, res);
  });
}

function attachLegacyRoutesFromFile(expressApp, appDir, routeFile) {
  loadRoutesFromFile(routeFile).forEach(({ pattern, name }) => {
    const { method, path } = parseExpressRoute({ pattern, name });
    attachLegacyRoute({
      expressApp,
      method,
      path,
      controllerFile: loadControllerFile({ name, appDir })
    });
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
