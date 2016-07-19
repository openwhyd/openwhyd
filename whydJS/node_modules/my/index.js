//==============================================================================
// Extending String.prototype (only native prototype to be extended)

String.prototype.contains = function(str) {
  return this.indexOf(str) !== -1;
}

String.prototype.startsWith = function(str) {
  if (str && str.length > this.length)
    return false;
  return this.substring(0, str.length) === str;
}

String.prototype.endsWith = function(str) {
  var len = this.length;
  if (str && str.length > len)
    return false;
  return this.substring(len - str.length, len) === str;
}


//==============================================================================
// @method my.Class(?SuperClass:Class, ?ImplementedClasses:Class..., !body:Object):Class
exports.Class = function() {

    var len = arguments.length;
    var body = arguments[len - 1];
    var SuperClass = len > 1 ? (arguments[0] || Object) : Object;
    var SuperClassEmpty = function() {};
    var hasImplementedClasses = len > 2;
    var Class;

    if (body.constructor === Object) {
      Class = function() {}
    } else {
      Class = body.constructor;
      delete body.constructor;
    }

    SuperClassEmpty.prototype = SuperClass.prototype;
    Class.prototype = new SuperClassEmpty();
    Class.prototype.constructor = Class;

    if (hasImplementedClasses) {
      for (var i = 1; i < len - 2; i++)
        implement(Class.prototype, arguments[i].prototype);
    }

    if (SuperClass !== Object) {
      Class.Super = SuperClass;
      implement(Class, SuperClass);
    }

    extend(Class.prototype, body);

    return Class;

}

function extend(obj, extension) {
  for (var prop in extension)
    obj[prop] = extension[prop];
  if (extension.toString !== Object.prototype.toString)
    obj.toString = extension.toString;
}

function implement(obj, implementation) {
  for (var prop in implementation)
    if (!(prop in obj))
      obj[prop] = implementation[prop];
}


//==============================================================================
var Element = require('./html/Element').Element;
var Page = require('./html/Element').Page;


exports.page = function() {return new Page(arguments);}
exports.div = function() {return new Element('div', arguments);}
exports.span = function() {return new Element('span', arguments);}
exports.a = function() {return new Element('a', arguments);}
exports.img = function() {return new Element('img', arguments);}
exports.ul = function() {return new Element('ul', arguments);}
exports.li = function() {return new Element('li', arguments);}
exports.iframe = function() {return new Element('iframe', arguments);}

// AJ

exports.p = function() {return new Element('p', arguments);}
exports.br = function() {return new Element('br', arguments);}
exports.h1 = function() {return new Element('h1', arguments);}

