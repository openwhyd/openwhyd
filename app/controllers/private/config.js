exports.controller = function(request, reqParams, response) {
  response.render({
    db: process.appParams.mongoDbDatabase
  });
};
