exports.controller = function(request, reqParams, response) {
  response.legacyRender({
    db: process.appParams.mongoDbDatabase
  });
};
