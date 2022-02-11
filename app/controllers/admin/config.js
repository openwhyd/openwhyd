/**
 * app config admin console
 * @author adrienjoly, whyd
 **/

var FileController = require('./FileController.js');

function wrapJsonGeneratorToText(name) {
  return function (p, cb) {
    fileGenerators[name](p, function (items) {
      cb(JSON.stringify(items.json, null, 2));
    });
  };
}

var fileGenerators = {
  'version.txt': wrapJsonGeneratorToText('version.json'),
  'config.json': function (p, cb) {
    cb({ json: process.appParams });
  },
  'config.txt': wrapJsonGeneratorToText('config.json'),
};

exports.controller = FileController.buildController({
  controllerName: 'admin.config',
  adminOnly: true,
  fileGenerators: fileGenerators,
});
