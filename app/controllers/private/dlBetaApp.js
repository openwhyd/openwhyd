var request = require('request');

var ROOT = 'http://www.romito.fr/public/whyd-beta/';

exports.controller = function(req, reqParams, res) {
  reqParams = reqParams || {};
  request.get(ROOT + reqParams.file).pipe(res);
};
