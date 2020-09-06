var childProcess = require('child_process');

exports.createCommand = function (input) {
  return magickCommand({ input: input });
};

var magickCommand = function (obj) {
  obj.inArgs = [];
  obj.outArgs = [];
  obj.cropResized = function (width, height) {
    return obj.resize(width, height).crop(width, height);
  };
  obj.resize = function (width, height) {
    var wh = width + 'x' + height;
    return obj.makeArgs(['-resize', wh]);
  };
  obj.crop = function (width, height) {
    var wh = width + 'x' + height;
    return obj.makeArgs(['-crop', wh]);
  };
  obj.makeArgs = function (inargs, outargs) {
    if (arguments.length == 1) {
      outargs = inargs;
      inargs = null;
    }
    if (inargs) {
      obj.inArgs = obj.inArgs.concat(inargs);
    }
    if (outargs) {
      obj.outArgs = obj.outArgs.concat(outargs);
    }
    return obj;
  };
  obj.write = function (out, callback) {
    obj.inArgs.push(obj.input);
    obj.outArgs.push(out);
    var args = obj.inArgs.concat(obj.outArgs);
    obj.__run('convert', args, callback);
  };
  obj.__run = function (cmd, args, callback) {
    args.unshift(cmd);
    cmd = 'gm';
    console.log('running command: ' + cmd + ' ' + args.join(' '));
    childProcess.exec(cmd + ' ' + args.join(' '), function () {
      callback();
    });
  };
  return obj;
};
