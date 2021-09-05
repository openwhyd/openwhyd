const config = require('../models/config.js');
const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('playlistCreation.controller', reqParams);

  if (reqParams.format === 'json') {
    response.send([]);
    return;
  }

  const user = await new Promise((resolve) =>
    userModel.fetchByHandle(reqParams.handle, resolve)
  );

  const options = {
    pageUrl: request.url.replace('/adrien', '/u/4d94501d1f78ac091dbc9b4d'), // TODO: get rid of the replace()
    pageTitle: 'new playlist',
    pageImage: config.urlPrefix + '/img/playlist/' + user.id + '_create',
    loggedUser: request.getUser() || {},
    playlist: {
      id: 'create',
      name: /*(reqParams || {}).name ||*/ 'Playlist #' + user.pl.length,
    },
  };

  const html = feedTemplate.renderFeedEmbed('', options);

  response.send(html);
};
