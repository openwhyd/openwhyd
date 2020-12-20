var /*consoleWarn = console.warn,*/ consoleError = console.error;

require('dd-trace').init(); // datadog APM

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

  // secrets
  genuineSignupSecret: process.env.WHYD_GENUINE_SIGNUP_SECRET.substr(),

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
  feedbackEmail: process.env.WHYD_CONTACT_EMAIL.substr(), // mandatory

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

var FLAGS = {
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

function start() {
  const myHttp = require('./app/lib/my-http-wrapper/http');
  const session = require('express-session');
  const MongoStore = require('connect-mongo')(session);
  const sessionMiddleware = session({
    secret: process.env.WHYD_SESSION_SECRET.substr(),
    store: new MongoStore({
      url: makeMongoUrl(params),
    }),
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // cookies expire in 1 year (provided in milliseconds)
    },
    name: 'whydSid',
    resave: false, // required, cf https://www.npmjs.com/package/express-session#resave
    saveUninitialized: false, // required, cf https://www.npmjs.com/package/express-session#saveuninitialized
  });
  var serverOptions = {
    port: params.port,
    appDir: __dirname,
    sessionMiddleware,
    errorHandler: function (req, params = {}, response, statusCode) {
      // to render 404 and 401 error pages from server/router
      console.log(
        `rendering server error page ${statusCode} for ${req.method} ${req.path}`
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
  new myHttp.Application(serverOptions).start();
  require('./app/workers/notifEmails.js'); // start digest worker
  require('./app/workers/hotSnapshot.js'); // start hot tracks snapshot worker
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
  console.log('Starting web server with params:', params);
  const mongodb = require('./app/models/mongodb.js'); // we load it from here, so that process.appParams are initialized
  await util.promisify(mongodb.init)();
  await mongodb.initCollections();
  start();
}

main().catch((err) => {
  // in order to prevent UnhandledPromiseRejections, let's catch errors and exit as we should
  console.log('error from main():', err);
  console.error('error from main():', err);
  process.exit(1);
});
