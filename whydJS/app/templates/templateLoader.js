/**
 * templateLoader
 * load and render templates using mustache
 * @author adrienjoly, whyd
 */

var fs = require('fs')
var hogan = require('hogan.js')
var getUserFromId = require('../models/mongodb.js').getUserFromId

var templateCache = {}
/*
var RE_AVATAR_URL = /[\(\"\']\/img\/u\/([0-9a-z_\.]+)([^\)\"\']*)[\)\"\']/g;
function getFinalAvatarUrl(url, uId, p){
	if (uId.indexOf(".") > -1) // already a filename => skipping conversion
		return url;
	console.log("-- getFinalAvatarUrl -- ", url, uId, p);
	var braces = [url[0], url[url.length-1]];
	var img = (getUserFromId(uId) || {}).img;
	img = img ? img + (p || "") : "/images/blank_user.gif";
	console.log("--", url, "=>", img);
	return braces[0] + img + braces[1];
}
*/
// e.g. filename : 'public/register.html'
exports.loadTemplate = function (fileName, callback, forceReload) {
  if (!forceReload) {
    var cached = templateCache[fileName]
    if (cached) {
      callback && callback(cached)
      return cached
    }
  }

  if (process.appParams.verbose) { console.log('templates.templateLoader loading ' + fileName + '...') }

  var instance = {}

  fs.readFile(fileName, 'utf-8', function (err, data) {
    if (err) console.log('template.templateLoader ERROR ', err, err.stack)
    instance.template = hogan.compile(data)
    instance.render = function (params) {
      try {
        return this.template.render(params)// .replace(RE_AVATAR_URL, getFinalAvatarUrl);
      } catch (err) {
        console.log('template.templateLoader ERROR ', err, err.stack)
        return null
      }
    }
    templateCache[fileName] = instance
    if (callback) { callback(instance, err) }
  })

  return instance
}
