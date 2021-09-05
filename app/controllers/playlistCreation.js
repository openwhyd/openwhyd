const config = require('../models/config.js');
const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');
const templateLoader = require('../templates/templateLoader.js');
const errorTemplate = require('../templates/error.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('playlistCreation.controller', reqParams);

  if (reqParams.format === 'json') {
    response.send([]);
    return;
  }

  const user = await new Promise((resolve) =>
    reqParams.handle
      ? userModel.fetchByHandle(reqParams.handle, resolve)
      : userModel.fetchByUid(reqParams.id, resolve)
  );

  if (!user)
    return errorTemplate.renderErrorResponse(
      { errorCode: 'USER_NOT_FOUND' },
      response,
      reqParams.format,
      request.getUser()
    );

  if (reqParams.id && user.handle) {
    const path = request.url
      .split('?')[0]
      .replace(`/u/${reqParams.id}`, `/${user.handle}`);
    return response.temporaryRedirect(path, {});
  }

  const options = {
    bodyClass: ' userPlaylistV2',
    customFeedTemplate: templateLoader.loadTemplate(
      'app/templates/userPlaylistV2.html'
    ),
    pageUrl: user.handle
      ? request.url.replace(`/${user.handle}`, `/u/${user.id}`)
      : request.url,
    pageTitle: 'new playlist',
    pageImage: `${config.urlPrefix}/img/playlist/${user.id}_create`,
    loggedUser: { ...request.getUser() },
    user,
    playlist: {
      id: 'create',
      name: `Playlist #${(user.pl || []).length}`,
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
