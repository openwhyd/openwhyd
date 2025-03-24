// @ts-check

const fs = require('fs');
const http = require('http');
const express = require('express');
const formidable = require('formidable');
const qset = require('q-set'); // instead of body-parser, for form fields with brackets
const sessionTracker = require('../../../controllers/admin/session.js');
const postModel = require('../../../models/post.js');
const config = require('../../../models/config.js');
const { getUserIdFromOidcUser } = require('../../auth0/index.js');
const {
  userCollection,
} = require('../../../infrastructure/mongodb/UserCollection');

const LOG_THRESHOLD = parseInt(process.env.LOG_REQ_THRESHOLD_MS ?? '1000', 10);

// From Response.js

// @ts-ignore
http.ServerResponse.prototype.legacyRender = function (
  view,
  data,
  headers = {},
  statusCode,
) {
  const isString = typeof view === 'string';
  if (!headers['content-type']) {
    headers['content-type'] = isString ? 'text/plain' : 'application/json';
  }
  // @ts-ignore
  this.set(headers)
    .status(statusCode || 200)
    .send(isString ? view : JSON.stringify(view));
};

// Middlewares

function noCache(req, res, next) {
  res.set(
    'Cache-Control',
    'max-age=0,no-cache,no-store,post-check=0,pre-check=0',
  );
  next();
}

const makeBodyParser = (uploadSettings) =>
  function bodyParser(req, res, callback) {
    const form = new formidable.IncomingForm();
    form.uploadDir = uploadSettings.uploadDir;
    form.keepExtensions = uploadSettings.keepExtensions;
    form.parse(req, function (err, postParams, files) {
      // if (err) console.error('formidable parsing error:', err);
      // using qset to parse fields with brackets [] for url-encoded form data:
      // https://github.com/felixge/node-formidable/issues/386#issuecomment-274315370
      const parsedParams = {};
      for (const key in postParams) {
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
    const userId = (req.session || {}).whydUid; // from legacy auth/session
    const userAgent = req.headers['user-agent'];

    if (userId) {
      sendUserIdToDataDog(userId);
    }

    sessionTracker.notifyUserActivity({ startDate, userId, userAgent }); // maintain lastAccessPerUA

    // log whenever a request is slow to respond
    res.on('finish', () => {
      const reqId = `${startDate.toISOString()} ${req.method} ${req.path}`;
      // @ts-ignore
      const duration = Date.now() - startDate;
      console.log(
        `◀ ${reqId} responds ${res.statusCode} after ${duration} ms`,
      );
      if (duration >= LOG_THRESHOLD) {
        logSlowRequest({
          startDate,
          req,
          userId,
          userAgent,
        });
      }
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

    /** @type {import('../../../domain/api/Features').Features & Partial<{auth: import('./AuthFeatures.js').AuthFeatures}>} */
    this._features = options.features;
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

    this._features.auth?.injectExpressRoutes(app, this._urlPrefix);

    // app.set('view engine', 'hogan'); // TODO: use hogan.js to render "mustache" templates when res.render() is called
    app.use(noCache); // called on all requests
    app.use(express.static(this._publicDir));
    app.use(makeBodyParser(this._uploadSettings)); // parse uploads and arrays from query params
    this._sessionMiddleware && app.use(this._sessionMiddleware);
    app.use(makeStatsUpdater());

    // prototype: v2 API with Auth0
    if (this._features.auth) {
      const { auth } = require('express-oauth2-jwt-bearer'); // to check Authorization Bearer tokens

      const useAuth = auth({
        issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, // identifier of the Auth0 account
        audience: `${process.env.WHYD_URL_PREFIX}/api/v2/`, // identifier of Openwhyd API v2, as set on Auth0
        tokenSigningAlg: 'RS256', // as provided by Auth0's quickstart, after creating the API
      });
      // TODO: on API routes, report errors (e.g. InvalidTokenError) in JSON format: { error: string }

      app.post('/api/v2/postTrack', useAuth, async (request, response) => {
        console.log(`/api/v2/postTrack`);

        // Successful requests will have the following properties added to them:
        // - auth.token: The raw JWT token.
        // - auth.header: The decoded JWT header.
        // - auth.payload: The decoded JWT payload.
        // cf https://github.com/auth0/node-oauth2-jwt-bearer/blob/main/packages/express-oauth2-jwt-bearer/src/index.ts#L73
        const userId = getUserIdFromOidcUser(request.auth?.payload ?? {});
        console.log(`/api/v2/postTrack, user id: ${userId}`);

        const user = userId ? await userCollection.getByUserId(userId) : null;
        if (!user) {
          response.status(401).json({ error: 'unauthorized' });
          return;
        }

        // parse track data from request's payload/body
        const { url, title, thumbnail, description } = request.body ?? {};
        console.log(`/api/v2/postTrack, embed url: ${url}`);

        // crude validation of PostTrackRequest
        /** @type {import('../../../domain/api/Features').PostTrackRequest} */
        const postTrackRequest = { url, title, thumbnail, description };
        for (const [key, value] of Object.entries(postTrackRequest)) {
          if (typeof value !== 'string') {
            response
              .status(400)
              .json({ error: `${key} must be a string, got: ${typeof value}` });
            return;
          }
        }
        console.log(`/api/v2/postTrack req:`, JSON.stringify(postTrackRequest));

        // extract the youtube video id from the URL
        const eId = config.translateUrlToEid(url);
        if (!eId || !eId.startsWith('/yt/')) {
          response.status(400).json({ error: `unsupported url: ${url}` });
          return;
        }
        console.log(`/api/v2/postTrack, embed id: ${eId}`);

        // create document to be stored in DB
        const postDocument = {
          uId: user.id,
          uNm: user.name,
          eId,
          name: postTrackRequest.title,
          img: postTrackRequest.thumbnail,
          text: postTrackRequest.description,
        };
        console.log(`/api/v2/postTrack doc:`, JSON.stringify(postDocument));

        // store the post in DB + search index
        const posted = await new Promise((resolve) =>
          postModel.savePost(postDocument, resolve),
        );

        // respond to request, based on result
        response
          .status(posted ? 200 : 400)
          .json(
            posted
              ? { url: `${process.env.URL_PREFIX}/c/${posted._id}` }
              : { error: 'failed to post the track in database' },
          );
      });
    }

    attachLegacyRoutesFromFile(
      app,
      this._appDir,
      this._routeFile,
      this._features,
    );
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
  const routeArray = [];
  let line;
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
    legacyPath,
  );
  return { method, path };
}

// loads and returns the exports of a js controller file, given its name
function loadControllerFile({ name, appDir }) {
  return require(`${appDir}/${name.replace(/\./g, '/')}.js`);
}

// attaches a legacy controller to an Express app
function attachLegacyRoute({
  expressApp,
  method,
  path,
  controllerFile,
  features,
}) {
  expressApp[method](path, function endpointHandler(req, res) {
    req.mergedParams = { ...req.params, ...req.query };

    return controllerFile.controller(req, req.mergedParams, res, features);
  });
}

function attachLegacyRoutesFromFile(expressApp, appDir, routeFile, features) {
  loadRoutesFromFile(routeFile).forEach(({ pattern, name }) => {
    const { method, path } = parseExpressRoute({ pattern });
    attachLegacyRoute({
      expressApp,
      method,
      path,
      controllerFile: loadControllerFile({ name, appDir }),
      features,
    });
  });
}

function logSlowRequest({ startDate, req, userId, userAgent }) {
  const duration = Date.now() - startDate;
  const logLine = [
    startDate.toUTCString(),
    req.method,
    req.path,
    '(' + duration + 'ms)',
  ];
  if (userId) logLine.push('uid=' + userId);
  if (userAgent) logLine.push('ua=' + sessionTracker.stripUserAgent(userAgent));
  console.error('slow request:', logLine.join(' '));
}

/**
 * Push the request's user ID to Datadog APM, to help us reproduce performance issues.
 * cf https://docs.datadoghq.com/fr/tracing/guide/add_span_md_and_graph_it/
 */
function sendUserIdToDataDog(userId) {
  try {
    process.datadogTracer?.setUser({ id: userId }); // cf https://github.com/DataDog/dd-trace-js/blob/master/docs/API.md#user-identification
  } catch (err) {
    console.error(`datadog error: ${err.message}`);
    console.error({ datadogTracer: typeof process.datadogTracer });
    console.error({ scope: typeof process.datadogTracer?.scope() });
    console.error({ active: typeof process.datadogTracer?.scope().active() });
  }
}
