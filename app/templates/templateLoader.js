/**
 * templateLoader
 * load and render templates using mustache
 * @author adrienjoly, whyd
 */

var fs = require('fs');
var hogan = require('hogan.js');

var templateCache = {};

// e.g. filename : 'public/register.html'
exports.loadTemplate = function (fileName, callback, forceReload) {
  if (!forceReload) {
    var cached = templateCache[fileName];
    if (cached) {
      callback && callback(cached);
      return cached;
    }
  }

  if (process.appParams.verbose)
    console.log('templates.templateLoader loading ' + fileName + '...');

  var instance = {};

  // Note: loading templates synchronously is bad... but:
  // - because most of the code is not async-friendly, async loading causes crashes;
  // - in the rend, we should rely on express' res.send() to render templates.
  //   (see https://github.com/openwhyd/openwhyd/issues/379)
  const data = fs.readFileSync(fileName, 'utf-8');
  instance.template = hogan.compile(data);
  instance.render = function (params) {
    try {
      return this.template.render(params); //.replace(RE_AVATAR_URL, getFinalAvatarUrl);
    } catch (err) {
      console.log('template.templateLoader ERROR ', err, err.stack);
      return null;
    }
  };
  templateCache[fileName] = instance;
  if (callback) callback(instance);

  return instance;
};
