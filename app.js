//@ts-check

const /*consoleWarn = console.warn,*/ consoleError = console.error;

if (!process.env.DISABLE_DATADOG) {
  const { DD_GIT_COMMIT_SHA, DD_GIT_REPOSITORY_URL } = process.env;
  console.log('Init Datadog APM with:', {
    DD_GIT_COMMIT_SHA,
    DD_GIT_REPOSITORY_URL,
  });
  // Initialize Datadog APM
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore // cf https://docs.datadoghq.com/fr/tracing/trace_collection/dd_libraries/nodejs/?tab=autresenvironnements
  process.datadogTracer = require('dd-trace').init({
    profiling: true, // cf https://docs.datadoghq.com/fr/profiler/enabling/nodejs/?tab=incode
  });
  process.datadogTracer.use('express', {
    hooks: {
      request: (span, req) => {
        // @ts-ignore ts(2339): Property 'session' does not exist on type 'IncomingMessage'. // it's added by a middleware
        const userId = req.session?.whydUid;
        span.setTag('customer.id', userId);
      },
    },
  });
}

const util = require('util');

const openwhydVersion = require('./package.json').version;

function makeColorConsole(fct, color) {
  return function () {
    for (const i in arguments)
      if (arguments[i] instanceof Object || arguments[i] instanceof Array)
        arguments[i] = util.inspect(arguments[i]);
    fct(Array.prototype.join.call(arguments, ' ')[color]);
  };
}

function makeErrorLog(fct, type) {
  return function () {
    fct(
      type === 'Warning' ? '⚠' : '❌',
      type,
      '--',
      new Date().toUTCString(),
      ...arguments,
    );
  };
}

console.warn = makeErrorLog(consoleError, 'Warning');
console.error = makeErrorLog(consoleError, 'Error');

// app configuration

if (process.env['WHYD_GENUINE_SIGNUP_SECRET'] === undefined)
  throw new Error(`missing env var: WHYD_GENUINE_SIGNUP_SECRET`);
if (process.env['WHYD_CONTACT_EMAIL'] === undefined)
  throw new Error(`missing env var: WHYD_CONTACT_EMAIL`);

const dbCreds = {
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || '27017',
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'], // || "openwhyd_data",
};

const useAuth0AsIdentityProvider = !!process.env.AUTH0_ISSUER_BASE_URL;

const params = (process.appParams = {
  // server level
  port: process.env['WHYD_PORT'] || 8080, // overrides app.conf
  urlPrefix:
    process.env['WHYD_URL_PREFIX'] ||
    `http://localhost:${process.env['WHYD_PORT'] || 8080}`, // base URL of the app
  isOnTestDatabase: dbCreds.mongoDbDatabase === 'openwhyd_test',
  color: true,

  // authentication
  useAuth0AsIdentityProvider,
  genuineSignupSecret: process.env.WHYD_GENUINE_SIGNUP_SECRET, // used by legacy auth

  // workers and general site logic
  searchModule:
    process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY
      ? 'searchAlgolia'
      : '', // "searchElastic"  // "" => no search index
  //	recomPopulation: true, // populate recommendation index at startup

  // email notification preferences
  emailModule: 'emailSendgrid', // "DISABLED"/"null" => fake email sending
  digestInterval: 60 * 1000, // digest worker checks for pending notifications every 60 seconds
  digestImmediate: false, // when true, digests are sent at every interval, if any notifications are pending
  feedbackEmail: process.env.WHYD_CONTACT_EMAIL, // mandatory

  // rendering preferences
  version: openwhydVersion,
  startTime: new Date(),
  nbPostsPerNewsfeedPage: 20,
  nbTracksPerPlaylistEmbed: 100,

  paths: {
    whydPath: __dirname,
    uploadDirName: 'upload_data',
    uAvatarImgDirName: 'uAvatarImg',
    uCoverImgDirName: 'uCoverImg',
    uPlaylistDirName: 'uPlaylistImg',
  },
});

const FLAGS = {
  '--no-color': function () {
    process.appParams.color = false;
  },
  '--fakeEmail': function () {
    params.emailModule = '';
  },
  '--emailAdminsOnly': function () {
    params.emailModule = 'emailAdminsOnly';
  },
  '--runner': function () {
    /* ignore this parameter from start-stop-daemon -- note: still required? */
  },
};

// when db is read

function makeMongoUrl(params) {
  const host = params.mongoDbHost;
  const port = parseInt(params.mongoDbPort);
  const user = params.mongoDbAuthUser;
  const password = params.mongoDbAuthPassword;
  const db = params.mongoDbDatabase; // ?w=0
  const auth =
    user || password
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@`
      : '';
  return `mongodb://${auth}${host}:${port}/${db}`;
}

// Legacy user auth and session management
function getLegacySessionMiddleware() {
  const session = require('express-session');
  const MongoStore = require('connect-mongo')(session);
  return session({
    secret: process.env.WHYD_SESSION_SECRET,
    store: new MongoStore({
      url: makeMongoUrl(dbCreds),
    }),
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // cookies expire in 1 year (provided in milliseconds)
      // secure: process.appParams.urlPrefix.startsWith('https://'), // if true, cookie will be accessible only when website if opened over HTTPS
      sameSite: 'strict',
    },
    name: 'whydSid',
    resave: false, // required, cf https://www.npmjs.com/package/express-session#resave
    saveUninitialized: false, // required, cf https://www.npmjs.com/package/express-session#saveuninitialized
  });
}

function start() {
  if (process.env['WHYD_SESSION_SECRET'] === undefined)
    throw new Error(`missing env var: WHYD_SESSION_SECRET`);

  const myHttp = require('./app/lib/my-http-wrapper/http');
  const { makeFeatures } = require('./app/domain/OpenWhydFeatures');
  const {
    userCollection,
  } = require('./app/infrastructure/mongodb/UserCollection');
  const { ImageStorage } = require('./app/infrastructure/ImageStorage.js');
  const { unsetPlaylist } = require('./app/models/post.js');
  const { makeAuthFeatures } = require('./app/lib/auth0/features.js');

  // Initialize features
  /** @typedef {import('./app/domain/api/Features').Features} Features*/
  /** @type {Features & Partial<{auth: import('./app/lib/my-http-wrapper/http/AuthFeatures').AuthFeatures}>} */
  const features = makeFeatures({
    userRepository: userCollection,
    imageRepository: new ImageStorage(),
    releasePlaylistPosts: async (userId, playlistId) =>
      new Promise((resolve) => unsetPlaylist(userId, playlistId, resolve)),
  });

  // Inject Auth0 user auth and management features, if enabled
  if (process.appParams.useAuth0AsIdentityProvider) {
    features.auth = makeAuthFeatures(process.env);
  }

  const serverOptions = {
    features,
    urlPrefix: params.urlPrefix,
    port: params.port,
    appDir: __dirname,
    sessionMiddleware: useAuth0AsIdentityProvider
      ? null
      : getLegacySessionMiddleware(),
    errorHandler: function (req, params = {}, response, statusCode) {
      // to render 404 and 401 error pages from server/router
      require('./app/templates/error.js').renderErrorResponse(
        { errorCode: statusCode },
        response,
        params.format ||
          (req.accepts('html')
            ? 'html'
            : req.accepts('json')
            ? 'json'
            : 'text'),
        req.getUser(),
      );
    },
    uploadSettings: {
      uploadDir: params.paths.uploadDirName, // 'upload_data'
      keepExtensions: true,
    },
  };
  require('./app/models/logging.js'); // init logging methods (IncomingMessage extensions)
  const appServer = new myHttp.Application(serverOptions);
  appServer.start(() => {
    const url = params.urlPrefix || `http://127.0.0.1:${params.port}/`;
    console.log(`[app] Server running at ${url}`);
  });
  require('./app/workers/notifEmails.js'); // start digest worker

  function closeGracefully(signal) {
    console.warn(`[app] ${signal} signal received: closing server...`);
    appServer.stop((err) => {
      console.warn(`[app] server.close => ${err || 'OK'}`);
      process.exit(err ? 1 : 0);
    });
  }
  process.on('SIGTERM', closeGracefully);
  process.on('SIGINT', closeGracefully);
}

// startup

async function main() {
  // apply command-line arguments
  if (process.argv.length > 2) {
    // ignore "node" and the filepath of this script
    for (let i = 2; i < process.argv.length; ++i) {
      const flag = process.argv[i];
      const flagFct = FLAGS[flag];
      if (flagFct) flagFct();
      else if (flag.indexOf('--') == 0)
        params[flag.substring(2)] = process.argv[++i];
    }
  }
  if (params.color == true) {
    require('colors'); // populates .grey, .cyan, etc... on strings, for logging.js and MyController.js
    console.warn = makeErrorLog(
      makeColorConsole(consoleError, 'yellow'),
      'Warning',
    );
    console.error = makeErrorLog(
      makeColorConsole(consoleError, 'red'),
      'Error',
    );
  } else {
    process.appParams.color = false;
  }
  console.log(`[app] Starting Openwhyd v${params.version}`);
  const mongodb = require('./app/models/mongodb.js'); // we load it from here, so that process.appParams are initialized
  await util.promisify(mongodb.init)(dbCreds);
  await mongodb.initCollections();
  start();
}

main().catch((err) => {
  // in order to prevent UnhandledPromiseRejections, let's catch errors and exit as we should
  console.log('[app] error from main():', err);
  console.error('[app] error from main():', err);
  process.exit(1);
});
