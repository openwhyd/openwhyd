//==============================================================================
// @method my.util.extend(!obj:Object, !extension:Object, ?override:boolean, ?filter:Array.<string>)
function extend(obj, extension, override, filter) {
  if (filter) {
    var value;
    for (var i = 0, prop; (prop = filter[i]); i++) {
      value = extension[prop];
      if (value !== undefined && (override !== false || !(prop in obj)))
        obj[prop] = value;
    }
  } else {
    if (override === false) {
      for (prop in extension) if (!(prop in obj)) obj[prop] = extension[prop];
    } else {
      for (prop in extension) obj[prop] = extension[prop];
      if (extension.toString !== Object.prototype.toString)
        obj.toString = extension.toString;
    }
  }
}

//==============================================================================
exports.extend = extend;
exports.Buffer = require('./Buffer').Buffer;
