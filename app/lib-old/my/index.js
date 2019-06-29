//==============================================================================
// @method my.Class(?SuperClass:Class, ?ImplementedClasses:Class..., !body:Object):Class
exports.Class = function() {
  var len = arguments.length;
  var body = arguments[len - 1];
  var SuperClass = len > 1 ? arguments[0] || Object : Object;
  var SuperClassEmpty = function() {};
  var hasImplementedClasses = len > 2;
  var Class;

  if (body.constructor === Object) {
    Class = function() {};
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
};

function extend(obj, extension) {
  for (var prop in extension) obj[prop] = extension[prop];
  if (extension.toString !== Object.prototype.toString)
    obj.toString = extension.toString;
}

function implement(obj, implementation) {
  for (var prop in implementation)
    if (!(prop in obj)) obj[prop] = implementation[prop];
}
