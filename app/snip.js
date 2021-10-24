// various tools by Adrien Joly
// tests: tests/tess-snips.js

var fs = require('fs');
var urlModule = require('url');
var http = require('http');
var https = require('https');
var querystring = require('querystring');

var firstWeek = new Date('Monday January 3, 2011 08:00'); // week #1 = 1st of january 2010

// privacy helper: anonymise email address
exports.formatEmail = function (emailAddr) {
  if (typeof emailAddr !== 'string' || emailAddr.length < 1)
    return '<invalid_email>';
  const [name, domain] = emailAddr.split('@');
  return name.substring(0, 1).concat('*********@').concat(domain);
};

exports.formatPrivateFields = (obj) => {
  if (typeof obj !== 'object') return obj;
  const res = { ...obj };
  if (typeof obj.email === 'string') res.email = exports.formatEmail(obj.email);
  if (typeof obj.md5 === 'string') res.md5 = '<MD5_HASH>';
  return res;
};

// privacy-enforcing console.log helper
exports.console = {
  log(...args) {
    const filteredArgs = args.map(exports.formatPrivateFields);
    console.log(...filteredArgs);
  },
};

exports.getWeekNumber = function (date) {
  return date && Math.floor(1 + (date - firstWeek) / 1000 / 60 / 60 / 24 / 7);
};

exports.weekNumberToDate = function (weekNumber) {
  return new Date(firstWeek.getTime() + 7 * 24 * 60 * 60 * 1000 * weekNumber);
};

exports.forEachFileLine = function (fileName, lineHandler) {
  var buffer = '';
  function processBuffer(flush) {
    var parts = buffer.replace('\r', '').split('\n');
    buffer = !flush && parts.pop();
    parts.forEach(lineHandler);
  }
  fs.createReadStream(fileName)
    .addListener('data', function (data) {
      buffer += data.toString();
      processBuffer();
    })
    .addListener('end', function () {
      processBuffer(true);
      lineHandler();
    });
};

// =========================================================================
// string manipulation / regular expressions

exports.removeAccents = function (str) {
  return !str
    ? ''
    : str
        .replace(/[àâä]/gi, 'a')
        .replace(/[éèêë]/gi, 'e')
        .replace(/[îï]/gi, 'i')
        .replace(/[ôö]/gi, 'o')
        .replace(/[ùûü]/gi, 'u');
};

//var regexUrl = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
var regexUrl =
  /(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#$*'()%?=~_|!:,.;]*)[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
var regexUrl2 = /(\b(https?|ftp|file):\/\/([^/\s]*)[^\s]*)/gi;

exports.replaceURLWithHTMLLinks = function (text) {
  return String(text || '').replace(regexUrl2, "<a href='$1'>$3...</a>");
};

exports.replaceURLWithFullHTMLLinks = function (text) {
  return String(text || '').replace(regexUrl, "<a href='$1'>$1</a>");
};

exports.shortenURLs = function (text) {
  return String(text || '').replace(regexUrl, '$3...');
};

// source: http://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
exports.htmlEntities = function (str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

exports.addSlashes = function (str) {
  return typeof str == 'string'
    ? str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
    : str;
};

exports.sanitizeJsStringInHtml = function (str) {
  return exports.htmlEntities(exports.addSlashes(str || ''));
};

var timeScales = [
  { 'minute(s)': 60 },
  { 'hour(s)': 60 },
  { 'day(s)': 24 },
  { 'month(s)': 30 },
  { 'year(s)': 12 },
];

exports.renderTimestamp = function (timestamp) {
  var t = timestamp / 1000,
    lastScale = 'second(s)';
  for (let i in timeScales) {
    var scaleTitle;
    for (scaleTitle in timeScales[i]);
    var scaleVal = timeScales[i][scaleTitle];

    if (t / scaleVal < 1) break;
    t = t / scaleVal;
    lastScale = scaleTitle;
  }
  var rounded = Math.round(t);
  return rounded + ' ' + lastScale.replace(/\(s\)/g, rounded > 1 ? 's' : '');
};

exports.MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

exports.renderShortMonthYear = function (date) {
  var t = new Date(date);
  var sameYear = false; //(new Date()).getFullYear() == t.getFullYear();
  return (
    exports.MONTHS_SHORT[t.getMonth()] + (sameYear ? '' : ' ' + t.getFullYear())
  );
};

exports.padNumber = function (str, n) {
  var ret = '' + str;
  while (
    ret.length < n // pad with leading zeroes
  )
    ret = '0' + ret;
  return ret;
};

exports.renderTime = function (date) {
  var t = new Date(date);
  return t.getHours() + ':' + exports.padNumber(t.getMinutes(), 2);
};

// minimal sanitization of function name: remove javascript's special / control characters
exports.sanitizeJsIdentifier = function (id) {
  return ('' + id).replace(/\/\\\n\(\)\[\];\./g, ' ');
};

exports.renderJsCallback = function (fctName, obj) {
  return (
    exports.sanitizeJsIdentifier(fctName) +
    '(' +
    (typeof obj == 'object' ? JSON.stringify(obj) : '"' + obj + '"') +
    ');'
  );
};

// =========================================================================
// music track related functions

exports.cleanTrackName = function (str) {
  return !str
    ? ''
    : str
        .trim()
        .replace(/^\d+([-./\\]\d+)+\s+/, '') // remove prefixing date
        .replace(/^\d+[.]+\s+/, '') // remove prefixing track number
        .replace(/^#\d+\s+/, '') // remove prefixing rank
        .replace(/\([^)]*\)/g, '') // remove parentheses
        .replace(/\[[^]]*\]/g, '') // remove brackets
        .replace(/\s+/, ' ') // remove extra/duplicate whitespace
        .trim();
};

// to run on cleaned track names, for better performance
exports.normalizeArtistName = function (artistName) {
  return exports
    .removeAccents(artistName.trim().toLowerCase())
    .replace(/[^a-z0-9]/g, ''); // remove non alpha characters
};

var reQuotes = /"[^")]*"/g;
var reSeparator = /-+\s+/g;
var reOnlyDigits = /^\d+$/;

// to run on cleaned track names, for better performance
exports.detectArtistName = function (trackName) {
  var quoted = trackName.match(reQuotes) || [];
  var splitted = (trackName || '').replace(reQuotes, ' - ').split(reSeparator);
  // remove track title (last item of the string, or quoted items)
  splitted.length = splitted.length - (quoted.length || 1);
  for (let i in splitted) {
    var normalized = exports.normalizeArtistName(splitted[i]);
    if (normalized && !reOnlyDigits.test(normalized)) return splitted[i].trim();
  }
  return null;
};

// to run on cleaned track names, for better performance
exports.detectTrackFields = function (trackName) {
  var quoted = trackName.match(reQuotes) || [];
  if (quoted.length == 1) return JSON.stringify(quoted);
  else return null;
};

// =========================================================================
// data structures

exports.arrayHas = function (array, value) {
  if (array) for (let i in array) if (value == array[i]) return true;
  return false;
};

exports.values = function (set) {
  var list = [];
  for (let i in set)
    if (set[i])
      // TODO: remove this line
      list.push(set[i]);
  return list;
};

exports.mapToObjArray = function (map, keyFieldName, valueFieldName) {
  var array = [];
  for (let k in map) {
    var obj = {};
    if (keyFieldName) obj[keyFieldName] = k;
    if (valueFieldName) obj[valueFieldName] = map[k];
    else if (typeof map[k] == 'object')
      for (let f in map[k]) obj[f] = map[k][f];
    array.push(obj);
  }
  return array;
};

exports.arrayToSet = function (array, value) {
  var set = {};
  for (let i in array)
    if (array[i])
      // TODO: remove this line
      set[array[i]] = value !== undefined ? value : true;
  return set;
};

exports.objArrayToSet = function (array, attr, val) {
  var set = {};
  for (let i in array)
    if (array[i] && attr in array[i]) set[array[i][attr]] = val || array[i];
  return set;
};

exports.groupObjectsBy = function (array, attr) {
  var r = {};
  var path = ('' + attr).split('.');
  if (path.length > 1) {
    for (let i in array) {
      const obj = array[i] || {};
      let key = obj;
      for (let j in path) {
        key = (key || {})[path[j]];
      }
      if (key) (r[key] = r[key] || []).push(obj);
    }
  } else {
    for (let i in array) {
      const obj = array[i] || {};
      let key = obj[attr];
      if (key)
        // TODO: fix this line
        (r[key] = r[key] || []).push(obj);
    }
  }
  return r;
};

exports.removeDuplicates = function (array, keyFieldName) {
  if (keyFieldName)
    return exports.mapToObjArray(
      exports.objArrayToSet(array, keyFieldName),
      keyFieldName
    );
  else return Object.keys(exports.arrayToSet(array));
};

exports.objArrayToValueArray = function (array, attr) {
  var list = [];
  for (let i in array)
    if (array[i] && array[i][attr])
      // TODO: fix this line, cf line 217
      list.push(array[i][attr]);
  return list;
};

exports.forEachArrayItem = function (array, handler, cb) {
  var i = 0;
  var length = array.length;
  (function next() {
    setTimeout(function () {
      if (i < length) handler(array[i++], next);
      else if (cb) cb(array);
    }, 0);
  })();
};

exports.getMapFieldNames = function (map /*, firstField*/) {
  var fieldNames = [],
    fieldSet = {};
  for (let i in map) {
    for (let f in map[i])
      if (!fieldSet[f]) {
        // TODO: check this line
        fieldNames.push(f);
        fieldSet[f] = true;
      }
  }
  /*if (firstField)
		fieldNames.unshift(firstField);*/
  return fieldNames;
};

exports.excludeKeys = function (map = [], keySet = {}) {
  const res = [];
  for (let k in map)
    if (!keySet[k])
      // TODO: check this line
      res[k] = map[k];
  return res;
};

exports.checkMissingFields = function (obj, fieldSet) {
  if (!obj || typeof obj !== 'object') return { error: 'object is null' };
  for (let f in fieldSet)
    if (fieldSet[f] && !(f in obj))
      return { field: f, expected: true, error: 'missing field: ' + f };
    else if (!fieldSet[f] && f in obj)
      return { field: f, expected: false, error: 'forbidden field: ' + f };
};

exports.checkMistypedFields = function (obj, fieldTypeSet) {
  if (!obj || typeof obj !== 'object') return { error: 'object is null' };
  function Error(error, f) {
    return {
      field: f,
      type: typeof obj[f],
      expected: fieldTypeSet[f],
      error: error + ': ' + f,
    };
  }
  for (let f in fieldTypeSet)
    if (fieldTypeSet[f]) {
      if (!(f in obj)) return Error('missing field', f);
      else if (
        typeof obj[f] !== fieldTypeSet[f] &&
        (fieldTypeSet[f] !== 'array' || !obj[f].splice)
      )
        return Error('mistyped field', f);
    } else if (f in obj) return Error('forbidden field', f);
};

// translateFields({a,b,c}, {b:"bb"}) => {a,bb,c}
exports.translateFields = function (obj, mapping) {
  if (obj && typeof obj === 'object')
    for (let f in mapping)
      if (f in obj) {
        obj[mapping[f]] = obj[f];
        delete obj[f];
      }
  return obj;
};

// filterFields({a,b,c}, {b:"bb"}) => {bb}
exports.filterFields = function (obj, mapping) {
  var finalObj = {};
  for (let field in mapping)
    if (field in obj)
      finalObj[mapping[field] === true ? field : mapping[field]] = obj[field];
  return finalObj;
};

// =========================================================================
// sorting comparators

exports.descSort = function (a, b) {
  return parseInt(b) - parseInt(a);
};

exports.ascSort = function (a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

exports.makeFieldSort = function (field, sortFct) {
  return function (a, b) {
    return sortFct(a[field], b[field]);
  };
};

// by http://andrew.hedges.name
exports.getLevenshteinDistance = (function () {
  function minimator(x, y, z) {
    if (x < y && x < z) return x;
    if (y < x && y < z) return y;
    return z;
  }
  return function (a, b) {
    var cost,
      m = a.length,
      n = b.length;
    if (m < n) {
      var c = a;
      a = b;
      b = c;
      var o = m;
      m = n;
      n = o;
    }
    var r = [];
    r[0] = [];
    for (let c = 0; c < n + 1; c++) r[0][c] = c;
    for (let i = 1; i < m + 1; i++) {
      r[i] = [];
      r[i][0] = i;
      for (let j = 1; j < n + 1; j++) {
        cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
        r[i][j] = minimator(
          r[i - 1][j] + 1,
          r[i][j - 1] + 1,
          r[i - 1][j - 1] + cost
        );
      }
    }
    return r[m][n];
  };
})();

// =========================================================================
// table structures

exports.DataTable = function () {
  this.table = [];
  this.header = null; //[]; // fields

  this.fromArray = (array, header) => {
    if (header) this.header = header;
    this.table = array;
    return this;
  };

  this.fromMap = (map, header) => {
    this.header = header || exports.getMapFieldNames(map);
    //table = /*mapToTable(map, header);*/ [];
    for (let i in map) {
      var line = [
        /*i*/
      ];
      //for (let f in map[i]) line.push(map[i][f]);
      for (let f in this.header) line.push(map[i][this.header[f]]);
      this.table.push(line);
    }
    return this;
  };

  this.sort = (fct) => {
    this.table.sort(fct);
    return this;
  };

  const getFullTableCopy = () => {
    return [].concat(this.header ? [this.header] : []).concat(this.table);
  };

  const toCharSeparatedValues = (charSepar, replacement, lineSepar) => {
    var table = getFullTableCopy();
    var regExp = new RegExp('[' + charSepar + '\n"]', 'g');
    for (let i in table) {
      for (let j in table[i])
        table[i][j] = ('' + table[i][j]).replace(regExp, replacement || ' ');
      //console.log(i, table[i]);
      table[i] = table[i].join(charSepar);
    }
    return table.join(lineSepar || '\n');
  };

  this.toTsv = () => {
    return toCharSeparatedValues('\t');
  };

  this.toCsv = () => {
    return toCharSeparatedValues(',');
  };

  const valToHtmlCell = (val) => {
    return '<td>' + exports.htmlEntities(val) + '</td>';
  };

  this.toHtml = () => {
    var table = getFullTableCopy().map((line) => {
      return '<tr>' + line.map(valToHtmlCell).join('') + '</tr>';
    });
    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<meta charset="utf-8"/>',
      '</head>',
      '<body>',
      '<p>' + this.table.length + ' items</p>',
      '<table>',
      "<thead style='background:#ccc;'>",
      table.shift(),
      '</thead>',
      '<tbody>',
    ]
      .concat(table)
      .concat(['</tbody', '</table>', '</body>', '</html>'])
      .join('\n');
  };

  return this;
};

// =========================================================================
// HTTP requests

var httpDomains = {};

exports.httpSetDomain = function (regex, options) {
  if (!options) delete httpDomains[regex];
  else httpDomains[regex] = [regex, options];
};

exports.httpDomains = httpDomains;

exports.httpGetDomain = function (domain) {
  for (let i in httpDomains)
    if (httpDomains[i][0].test(domain)) return httpDomains[i][1];
};

function _httpRequest(options, callback) {
  var data = '',
    body = options.body;
  if (body)
    // => don't forget to add Content-Type and Content-Length headers in that case
    delete options.body;
  //console.log("httpRequest", options.host + options.path);
  var req = (options.protocol === 'http:' ? http : https)
    .request(options, function (res) {
      if (options.responseEncoding)
        res.setEncoding(options.responseEncoding /*'utf-8'*/);
      res.addListener('data', function (chunk) {
        data += chunk.toString();
      });
      res.addListener('end', function () {
        callback(null, data, res);
      });
    })
    .on('error', function (err) {
      //console.log("[ERR] snip.httpRequest ", url, err);
      //console.error("[ERR] snip.httpRequest ", url, err);
      callback(err);
    });
  req.end(body);
  return req;
}

exports.httpRequest = function (url, options = {}, callback) {
  var urlObj = urlModule.parse(url);
  options.method = options.method || 'GET';
  options.protocol = urlObj.protocol;
  options.host = urlObj.hostname;
  options.port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
  options.path = urlObj.path; //url; //urlObj.pathname
  //options.headers = {'Accept':'application/json'};
  var domainOpts = exports.httpGetDomain(options.host) || {};
  if (domainOpts.queue) {
    const runNext = () => {
      //console.log("5-next?", options.host, domainOpts.queue.length);
      return domainOpts.queue.length && domainOpts.queue[0](); // run next request in line
    };
    //console.log("1-REQ", options.host, domainOpts.queue.length);
    domainOpts.queue.push(
      _httpRequest.bind(null, options, function () {
        //console.log("2-RES", options.host, domainOpts.queue.length);
        callback.apply(null, arguments);
        //console.log("3-END", options.host, domainOpts.queue.length);
        domainOpts.queue.shift(); // request id done => dequeue
        //console.log("4 =>", options.host, domainOpts.queue.length);
        runNext();
      })
    );
    return domainOpts.queue.length == 1 ? runNext() : undefined;
  }
  return _httpRequest(options, callback);
};

exports.httpRequestWithParams = function (url, options, cb) {
  if (options.params) {
    url += '?' + querystring.stringify(options.params);
    delete options.params;
  }
  if (options.body) {
    options.body =
      typeof options.body == 'object'
        ? querystring.stringify(options.body)
        : options.body;
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = options.body.length;
  }
  return exports.httpRequest(url, options, cb);
};

exports.httpRequestJSON = function (url, options, callback) {
  return exports.httpRequest(url, options, function (err, data, res) {
    if (err) callback(err, null, res);
    else {
      try {
        if (typeof data == 'string') data = JSON.parse(data);
        callback(null, data, res);
      } catch (e) {
        //console.error(e);
        callback(e, data, res);
      }
    }
  });
};

function BasicCache() {
  var cache = {};
  this.get = function (url) {
    return cache[url];
  };
  this.set = function (url, data) {
    return (cache[url] = data);
  };
  this.dump = function () {
    return cache;
  };
  this.restore = function (cacheDump) {
    return (cache = cacheDump);
  };
  return this;
}

exports.HttpRequestCache = function (cache) {
  var realRequest = exports.httpRequest;
  this.cache = cache = cache || new BasicCache();
  this.httpRequest = function (url, options, callback) {
    // TODO: options are ignored for now
    var cached = cache.get(url);
    if (cached) {
      //console.warn("used cached request for", url, "...");
      callback(null, cached);
    } else {
      //console.warn("making a real request to", url, "...");
      realRequest(url, options, function (err, data, res) {
        cache.set(url, data);
        callback(err, data, res);
      });
    }
  };
};

// =========================================================================
/**
 * simple implementation of an async event emitter
 * listeners are called in sequence, based on callbacks
 * inspired by: https://github.com/joyent/node/blob/master/lib/events.js
 **/

function AsyncEventEmitter() {
  this._eventListeners = {};
}

AsyncEventEmitter.prototype.on = function (evtName, listener) {
  this._eventListeners[evtName] = this._eventListeners[evtName] || [];
  this._eventListeners[evtName].push(listener);
  return this;
};

AsyncEventEmitter.prototype.emit = function (evtName, param, callback) {
  var listeners = this._eventListeners[evtName];
  if (!listeners) return false;
  listeners = listeners.slice(); // duplicate array
  const nextListener = () => {
    process.nextTick(() => {
      if (listeners.length) {
        //var args = Array.prototype.slice.call(arguments, 1);
        listeners.pop().call(this, param, nextListener);
      } else if (callback) callback();
    });
  };
  nextListener();
  return true;
};

exports.AsyncEventEmitter = AsyncEventEmitter;

// =========================================================================
/**
 * callWhenDone: a simple synchronized callback closure
 * @author adrienjoly, whyd
 */
exports.callWhenDone = function (callback) {
  var counter = 0;
  return function (incr) {
    if (0 == (counter += incr)) callback();
  };
};

// =========================================================================
/**
 * checkParams: validate an object against two sets of types properties: mandatory and optional
 * returns validated object, or throws an error.
 * @author adrienjoly, whyd
 */
exports.checkParams = function (obj, mandatorySet, optionalSet) {
  var finalObj = {};
  function storeIfValid(fieldName, typeSet) {
    if (typeof obj[fieldName] != typeSet[fieldName])
      throw Error('invalid field value: ' + fieldName);
    else finalObj[fieldName] = obj[fieldName];
  }
  obj = obj || {};
  for (let fieldName in mandatorySet) storeIfValid(fieldName, mandatorySet);
  for (let fieldName in optionalSet)
    if (fieldName in obj && obj[fieldName] != null)
      storeIfValid(fieldName, optionalSet);
  return finalObj;
};

// =========================================================================

var MAX_NB_MENTIONS = 6;
var RE_MENTION = /@\[([^\]]*)\]\(user:([^)]*)\)/gi;

exports.RE_MENTION = RE_MENTION;

exports.extractMentions = function (commentText) {
  var mentions = [];
  for (;;) {
    // extract user id (last matched group) of each mention
    var mentionedUid = (RE_MENTION.exec(commentText) || []).pop();
    if (mentionedUid) mentions.push(mentionedUid);
    else break;
  }
  return mentions.slice(0, MAX_NB_MENTIONS);
};

// =========================================================================
// class to track the execution of long jobs, with callback timeout capability

exports.Worker = function (options) {
  options = options || {};
  var jobs = 0,
    interval = null;
  function addJob(job) {
    console.log('added job: ' + job);
    ++jobs;
    if (!interval)
      interval = setInterval(function () {
        console.log('(' + jobs + ' jobs)');
      }, options.statusDisplayInterval || 5000);
  }
  function removeJob(job) {
    clearTimeout(job.timeout);
    job.done = null;
    --jobs;
    if (!jobs) interval = clearInterval(interval);
    console.log('removed job: ' + job);
  }
  function Job(id) {
    this.toString = function () {
      return id;
    };
    this.done = () => {
      removeJob(this);
      delete this;
    };
    this.wrapCallback = (callback) => {
      return function () {
        if (this && this.done) {
          callback && callback.apply(null, arguments);
          this.done();
        } else
          console.log(
            'warning: intercepted callback from terminated job ' + this
          );
      };
    };
    this.timeout = setTimeout(() => {
      console.log(
        'job ' + this + ' was still running 1 minute after launch => destroying'
      );
      console.warn(
        'destroyed a job that was still running 1 minute after launch'
      );
      removeJob(this);
      delete this;
    }, options.expiry || 60000);
    addJob(this);
    return this;
  }
  this.newJob = function (id) {
    return new Job(id);
  };
  this.countPendingJobs = function () {
    return jobs;
  };
  return this;
};

/*
// tested with expiry duration of 6000 milliseconds
var worker = new exports.Worker({expiry:6000})
var cb = worker.newJob("test1").wrapCallback(function(){
	console.log("callback1");
});
var cb2 = worker.newJob("test2").wrapCallback(function(){
	console.log("callback2");
});
setTimeout(cb, 2000); // -> callback1 displayed, then job removed
// -> test1 job expiry error message, then job removed
setTimeout(cb, 7000); // -> error: intercepted callback tentative for test1 (already terminated)
setTimeout(cb2, 8000); // -> error: intercepted callback tentative for test2 (already terminated)
*/
