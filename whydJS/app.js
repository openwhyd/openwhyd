var /*consoleWarn = console.warn,*/ consoleError = console.error;

var fs = require('fs');
var util = require('util');
var async = require('async');
var colors = require('colors');
var mongodb = require('mongodb');

var openwhydVersion = require('./package.json').version;

// initialize error monitoring
var rollbar;
/*
if (process.env.NODE_ENV === "production") {
	var Rollbar = require("rollbar");
	rollbar = new Rollbar({
		accessToken: "655e72dc704f43c78f9c1e06b8b45ab0",
		captureUncaught: true,
		captureUnhandledRejections: true
	});
	rollbar.log("Starting Openwhyd v" + openwhydVersion + ' ...');
}
*/

var DB_INIT_SCRIPTS = [
  './config/initdb.js'
  //'./config/initdb_team.js', // creates an admin user => should not be run on production!
];

function makeColorConsole(fct, color) {
  return function() {
    for (var i in arguments)
      if (arguments[i] instanceof Object || arguments[i] instanceof Array)
        arguments[i] = util.inspect(arguments[i]);
    fct(Array.prototype.join.call(arguments, ' ')[color]);
  };
}

function conciseTrace() {
  return new Error().stack
    .split('\n')
    .filter(function(line) {
      return /\/whydJS\/app\//.test(line);
    })
    .join('\n');
}

function makeErrorLog(fct, type) {
  return function() {
    fct(
      '===\n' +
        new Date().toUTCString() +
        ', ' +
        type +
        ' (concise trace)\n' +
        conciseTrace()
    );
    fct.apply(console, arguments);
    if (rollbar && (type === 'Warning' || type === 'Error')) {
      rollbar[type.toLowerCase()](Array.prototype.join.call(arguments, ' '));
    }
  };
}

console.warn = makeErrorLog(consoleError, 'Warning');
console.error = makeErrorLog(consoleError, 'Error');

//==============================================================================
// Extending String.prototype (only native prototype to be extended)

String.prototype.contains = function(str) {
  return this.indexOf(str) !== -1;
};

String.prototype.startsWith = function(str) {
  if (str && str.length > this.length) return false;
  return this.substring(0, str.length) === str;
};

String.prototype.endsWith = function(str) {
  var len = this.length;
  if (str && str.length > len) return false;
  return this.substring(len - str.length, len) === str;
};
// app configuration

var params = (process.appParams = {
  // server level
  dev: process.env['WHYD_DEV'] || false, // hot re-loading of node controllers, models and views
  port: process.env['WHYD_PORT'] || 8080, // overrides app.conf
  urlPrefix:
    process.env['WHYD_URL_PREFIX'] ||
    'http://localhost:' + process.env['WHYD_PORT'] ||
    8080, // base URL of the app
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || mongodb.Connection.DEFAULT_PORT, // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'], // || "openwhyd_data",

  // secrets
  genuineSignupSecret: process.env.WHYD_GENUINE_SIGNUP_SECRET.substr(),

  // workers and general site logic
  searchModule: 'searchAlgolia', // "searchElastic"  // "" => no search index
  //	recomPopulation: true, // populate recommendation index at startup
  advertisePlaylistContestOnHome: false, // jamendo playlist contest

  // email notification preferences
  emailModule: 'emailSendgrid', // "DISABLED"/"null" => fake email sending
  digestInterval: 60 * 1000, // digest worker checks for pending notifications every 60 seconds
  digestImmediate: false, // when true, digests are sent at every interval, if any notifications are pending
  feedbackEmail: process.env.WHYD_CONTACT_EMAIL.substr(), // mandatory

  // rendering preferences
  version: openwhydVersion,
  startTime: new Date(),
  // landingPage: "public/html/landingPhoto.html", //"public/html/landingPageLaunch.html",  //cf logging.js
  nbPostsPerNewsfeedPage: 20,
  nbTracksPerPlaylistEmbed: 100,

  paths: {
    whydPath: '../whydJS',
    uploadDirName: 'upload_data',
    uAvatarImgDirName: 'uAvatarImg',
    uCoverImgDirName: 'uCoverImg',
    uPlaylistDirName: 'uPlaylistImg'
  }
});

var FLAGS = {
  '--color': function() {
    console.warn = makeErrorLog(
      makeColorConsole(consoleError, 'yellow'),
      'Warning'
    );
    console.error = makeErrorLog(
      makeColorConsole(consoleError, 'red'),
      'Error'
    );
    process.appParams.color = true;
  },
  '--dev': function() {
    params.dev = true;
  },
  '--fakeEmail': function() {
    params.emailModule = '';
  },
  '--emailAdminsOnly': function() {
    params.emailModule = 'emailAdminsOnly';
  },
  '--runner': function() {
    /* ignore this parameter from start-stop-daemon */
  }
};

// when db is read

function start() {
  var session = require('./app/lib/my/session');
  var myHttp = require('./app/lib/my/http');
  var sessionParams = {
    secret: process.env.WHYD_SESSION_SECRET.substr(),
    key: 'whydSid',
    mongo: {
      host: params.mongoDbHost,
      port: parseInt(params.mongoDbPort),
      user: params.mongoDbAuthUser,
      password: params.mongoDbAuthPassword,
      db: params.mongoDbDatabase // ?w=0
    },
    maxAge: 60 * 60 * 24 * 365
  };
  var serverOptions = {
    errorHandler: function(request, params, response, statusCode) {
      // to render 404 and 401 error pages from server/router
      console.log('rendering server error page', statusCode);
      require('./app/templates/error.js').renderErrorResponse(
        { errorCode: statusCode },
        response,
        (params || {}).format,
        request.getUser()
      );
    },
    uploadDir: params.paths.uploadDirName, // 'upload_data'
    keepExtensions: true
  };
  require('./app/models/logging.js'); // init logging methods (IncomingMessage extensions)
  new myHttp.Application(
    __dirname,
    params.dev,
    session(sessionParams),
    serverOptions
  ).start();
  require('./app/workers/notifEmails.js'); // start digest worker
  require('./app/workers/hotSnapshot.js'); // start hot tracks snapshot worker
  require('./app/models/plTags.js').getTagEngine(); // index tags for tracks and users
}

// startup

function init() {
  if (process.argv.length > 2)
    // ignore "node" and the filepath of this script
    for (var i = 2; i < process.argv.length; ++i) {
      var flag = process.argv[i];
      var flagFct = FLAGS[flag];
      if (flagFct) flagFct();
      else if (flag.indexOf('--') == 0)
        params[flag.substr(2)] = process.argv[++i];
    }
  console.log('Starting web server with params:', params);
  require('./app/models/mongodb.js').init(function(err, db) {
    if (err) throw err;
    var mongodb = this;
    async.eachSeries(
      DB_INIT_SCRIPTS,
      function(initScript, nextScript) {
        console.log('Applying db init script:', initScript, '...');
        mongodb.runShellScript(fs.readFileSync(initScript), function(err) {
          if (err) throw err;
          nextScript();
        });
      },
      function(err, res) {
        // all db init scripts were interpreted => continue app init
        mongodb.cacheCollections(function() {
          mongodb.cacheUsers(function() {
            start();
          });
        });
      }
    );
  });
}

init();
