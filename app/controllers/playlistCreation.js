// @ts-check

/// <reference path="../../app.d.ts" />

const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');
const templateLoader = require('../templates/templateLoader.js');
const errorTemplate = require('../templates/error.js');

const config = process.appParams;

const createPlaylistTemplate = templateLoader.loadTemplate(
  'app/templates/userPlaylistV2.html'
);

// Note: The specificity of the rendering of this feature resides in its template, therefore ...
// TODO: remove the rendering boilerplate from here, e.g. delegate it to a middleware
async function renderPage(user, canonicalPageUrl, loggedUser) {
  const options = {
    bodyClass: ' userPlaylistV2',
    customFeedTemplate: createPlaylistTemplate,
    pageUrl: canonicalPageUrl,
    pageTitle: 'new playlist',
    pageImage: `${config.urlPrefix}/img/playlist/${user.id}_create`,
    loggedUser,
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

  return feedTemplate.renderFeedPage(user, {
    ...options,
    content: trackingHtml + feedHtml,
  });
}

exports.controller = async function (request, reqParams, response) {
  if (reqParams.format === 'json') {
    return response.send([]);
  }

  const loggedUser = { ...request.getUser() };

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
      loggedUser
    );

  if (reqParams.id && user.handle) {
    const path = request.url
      .split('?')[0]
      .replace(`/u/${reqParams.id}`, `/${user.handle}`);
    return response.temporaryRedirect(path, {});
  }

  const canonicalPageUrl = user.handle
    ? request.url.replace(`/${user.handle}`, `/u/${user.id}`)
    : request.url;

  const pageHtml = await renderPage(user, canonicalPageUrl, loggedUser);

  response.send(pageHtml);
};
