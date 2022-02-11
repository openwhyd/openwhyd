const fs = require('fs');
const http = require('http');
const express = require('express');
const formidable = require('formidable');
const qset = require('q-set'); // instead of body-parser, for form fields with brackets

const LOG_THRESHOLD = process.env.LOG_REQ_THRESHOLD_MS || 500;

// From Response.js

http.ServerResponse.prototype.legacyRender = function (
  view,
  data,
  headers = {},
  statusCode
) {
  const isString = typeof view === 'string';
  if (!headers['content-type']) {
    headers['content-type'] = isString ? 'text/plain' : 'application/json';
  }
  this.set(headers)
    .status(statusCode || 200)
    .send(isString ? view : JSON.stringify(view));
};

// Middlewares

function noCache(req, res, next) {
  res.set(
    'Cache-Control',
    'max-age=0,no-cache,no-store,post-check=0,pre-check=0'
  );
  next();
}

const makeBodyParser = (uploadSettings) =>
  function bodyParser(req, res, callback) {
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadSettings.uploadDir;
    form.keepExtensions = uploadSettings.keepExtensions;
    form.parse(req, function (err, postParams, files) {
      if (err) console.error('formidable parsing error:', err);
      // using qset to parse fields with brackets [] for url-encoded form data:
      // https://github.com/felixge/node-formidable/issues/386#issuecomment-274315370
      var parsedParams = {};
      for (let key in postParams) {
        qset.deep(parsedParams, key, postParams[key]);
      }
      req.body = { ...postParams, ...parsedParams };
      req.files = files;
      callback();
    });
  };

const makeStatsUpdater = () =>
  function statsUpdater(req, res, next) {
    const startDate = new Date();
    const userId = (req.session || {}).whydUid;
    const userAgent = req.headers['user-agent'];

    // log whenever a request is slow to respond
    res.on('finish', () => {
      const reqId = `${startDate.toISOString()} ${req.method} ${req.path}`;
      const duration = Date.now() - startDate;
      console.log(`◀ ${reqId} responds ${res.statusCode} after ${duration} ms`);
      appendSlowQueryToAccessLog({
        startDate,
        req,
        userId,
        userAgent,
      });
    });

    next();
  };

function defaultErrorHandler(req, reqParams, res, statusCode) {
  res.sendStatus(statusCode);
}

const makeNotFound = (errorHandler) =>
  function notFound(req, res) {
    errorHandler(req, req.mergedParams, res, 404);
  };

// Web Application class

exports.Application = class Application {
  constructor(options = {}) {
    this._errorHandler = options.errorHandler || defaultErrorHandler;
    this._sessionMiddleware = options.sessionMiddleware;
    this._appDir = options.appDir + '/app';
    this._publicDir = options.appDir + '/public';
    this._routeFile = options.appDir + '/config/app.route';
    this._port = options.port;
    this._urlPrefix = options.urlPrefix;
    this._expressApp = null; // will be lazy-loaded by getExpressApp()
    this._uploadSettings = options.uploadSettings;
  }

  getExpressApp() {
    if (this._expressApp) return this._expressApp;
    const app = express();
    // `GET /__coverage__` will return coverage data for nyc
    /* istanbul ignore next */
    if (global.__coverage__) {
      app.get('/__coverage__', (_, res) => {
        res.json({
          coverage: global.__coverage__ || null,
        });
      });
    }
    // app.set('view engine', 'hogan'); // TODO: use hogan.js to render "mustache" templates when res.render() is called
    app.use(noCache); // called on all requests
    app.use(express.static(this._publicDir));
    app.use(makeBodyParser(this._uploadSettings)); // parse uploads and arrays from query params
    this._sessionMiddleware && app.use(this._sessionMiddleware);
    app.use(makeStatsUpdater());
    attachLegacyRoutesFromFile(app, this._appDir, this._routeFile);
    app.use(makeNotFound(this._errorHandler));
    return (this._expressApp = app);
  }

  start(callback) {
    this._isRunning = true;
    this.expressServer = this.getExpressApp().listen(this._port, callback);
  }

  stop(callback) {
    if (this._isRunning) {
      this.expressServer.close(callback);
      this._isRunning = false;
    } else if (callback) {
      callback();
    }
  }
};

// Helpers and other private functions

// returns a list of { pattern, name } from the provided file (e.g. app.route)
function loadRoutesFromFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  var routeArray = [];
  var line;
  for (let i = 0, len = lines.length; i < len; i++) {
    line = lines[i].split('->');
    if (line.length >= 2)
      routeArray.push({ pattern: line[0].trim(), name: line[1].trim() });
  }
  return routeArray;
}

// for a given app.route entry, returns { method, path } to define an Express endpoint
function parseExpressRoute({ pattern }) {
  const [upperCaseMethod, legacyPath] = pattern.split('?')[0].split(/\s+/);
  const method = upperCaseMethod.toLowerCase();
  const pathParams = legacyPath.match(/\{[\w$]+\}/g);
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
      controllerFile: loadControllerFile({ name, appDir }),
    });
  });
}

function appendSlowQueryToAccessLog({ startDate, req, userId }) {
  const duration = Date.now() - startDate;
  if (duration < LOG_THRESHOLD) return;
  const logLine = [
    startDate.toUTCString(),
    req.method,
    req.path,
    '(' + duration + 'ms)',
  ];
  if (userId) logLine.push('uid=' + userId);
  console.error('slow request:', logLine.join(' '));
}
