const config = require('../models/config.js');
const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');
const templateLoader = require('../templates/templateLoader.js');

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
    bodyClass: ' userPlaylistV2',
    customFeedTemplate: templateLoader.loadTemplate(
      'app/templates/userPlaylistV2.html'
    ),
    pageUrl: request.url.replace('/adrien', `/u/${user.id}`),
    pageTitle: 'new playlist',
    pageImage: `${config.urlPrefix}/img/playlist/${user.id}_create`,
    loggedUser: { ...request.getUser() },
    user,
    playlist: {
      id: 'create',
      name: `Playlist #${user.pl.length}`,
    },
  };

  const trackingHtml = [
    '<script>',
    ` window.Whyd.tracking.log("Visit profile", "${user.id}");`,
    '</script>',
  ].join('\n');

  const feedHtml = await new Promise((resolve) =>
    feedTemplate.renderFeedAsync([], options, resolve)
  );

  const pageHtml = feedTemplate.renderFeedPage(user, {
    ...options,
    content: trackingHtml + feedHtml,
  });

  response.send(pageHtml);
};
