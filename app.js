var /*consoleWarn = console.warn,*/ consoleError = console.error;

var util = require('util');
var mongodb = require('mongodb');

var openwhydVersion = require('./package.json').version;

function makeColorConsole(fct, color) {
  return function () {
    for (let i in arguments)
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
      ...arguments
    );
  };
}

console.warn = makeErrorLog(consoleError, 'Warning');
console.error = makeErrorLog(consoleError, 'Error');

// app configuration

var params = (process.appParams = {
  // server level
  port: process.env['WHYD_PORT'] || 8080, // overrides app.conf
  urlPrefix:
    process.env['WHYD_URL_PREFIX'] ||
    `http://localhost:${process.env['WHYD_PORT'] || 8080}`, // base URL of the app
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || mongodb.Connection.DEFAULT_PORT, // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'], // || "openwhyd_data",
  color: true,

  // rendering preferences
  version: openwhydVersion,
  startTime: new Date(),
  nbPostsPerNewsfeedPage: 20,

  paths: {
    whydPath: __dirname,
    uploadDirName: 'upload_data',
    uAvatarImgDirName: 'uAvatarImg',
    uCoverImgDirName: 'uCoverImg',
    uPlaylistDirName: 'uPlaylistImg',
  },
});

var FLAGS = {
  '--no-color': function () {
    process.appParams.color = false;
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

function start() {
  const myHttp = require('./app/lib/my-http-wrapper/http');
  const session = require('express-session');
  const MongoStore = require('connect-mongo')(session);
  const sessionMiddleware = session({
    store: new MongoStore({
      url: makeMongoUrl(params),
    }),
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // cookies expire in 1 year (provided in milliseconds)
      // secure: process.appParams.urlPrefix.startsWith('https://'), // if true, cookie will be accessible only when website if opened over HTTPS
      sameSite: 'strict',
    },
    name: 'whydSid',
    secret: 'whatever', // note: this is not safe enough for production
    resave: false, // required, cf https://www.npmjs.com/package/express-session#resave
    saveUninitialized: false, // required, cf https://www.npmjs.com/package/express-session#saveuninitialized
  });
  var serverOptions = {
    urlPrefix: params.urlPrefix,
    port: params.port,
    appDir: __dirname,
    sessionMiddleware,
    errorHandler: function (req, params = {}, response, statusCode) {
      // to render 404 and 401 error pages from server/router
      console.log(
        `[app] rendering server error page ${statusCode} for ${req.method} ${req.path}`
      );
      require('./app/templates/error.js').renderErrorResponse(
        { errorCode: statusCode },
        response,
        params.format ||
          (req.accepts('html')
            ? 'html'
            : req.accepts('json')
            ? 'json'
            : 'text'),
        req.getUser()
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
      var flag = process.argv[i];
      var flagFct = FLAGS[flag];
      if (flagFct) flagFct();
      else if (flag.indexOf('--') == 0)
        params[flag.substr(2)] = process.argv[++i];
    }
  }
  if (params.color == true) {
    require('colors'); // populates .grey, .cyan, etc... on strings, for logging.js and MyController.js
    console.warn = makeErrorLog(
      makeColorConsole(consoleError, 'yellow'),
      'Warning'
    );
    console.error = makeErrorLog(
      makeColorConsole(consoleError, 'red'),
      'Error'
    );
  } else {
    process.appParams.color = false;
  }
  console.log(`[app] Starting Openwhyd v${params.version}`);
  const mongodb = require('./app/models/mongodb.js'); // we load it from here, so that process.appParams are initialized
  await util.promisify(mongodb.init)();
  await mongodb.initCollections();
  start();
}

main().catch((err) => {
  // in order to prevent UnhandledPromiseRejections, let's catch errors and exit as we should
  console.log('[app] error from main():', err);
  console.error('[app] error from main():', err);
  process.exit(1);
});
