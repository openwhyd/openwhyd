const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('playlistCreation.controller', reqParams);

  const user = await new Promise((resolve) =>
    userModel.fetchByHandle(reqParams.handle, resolve)
  );

  const options = {
    playlist: {
      id: 'create',
      name: /*(reqParams || {}).name ||*/ 'Playlist #' + user.pl.length,
    },
    pageTitle: 'new playlist',
  };

  const html = feedTemplate.renderFeedEmbed('', options);

  response.send(html);
};
