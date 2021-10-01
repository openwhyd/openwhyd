/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
const { PlaylistPageGenerator } = require('./PlaylistPageGenerator');
const { ProfilePageGenerator } = require('./ProfilePageGenerator');

function generateMixpanelCode(options) {
  return [
    '<script>',
    ' window.Whyd.tracking.log("Visit profile", "' + options.uid + '");',
    '</script>',
  ].join('\n');
}

function renderResponse(lib, options, feed) {
  if (options.callback) {
    var safeCallback = options.callback.replace(/[^a-z0-9_]/gi, '');
    lib.renderOther(
      safeCallback + '(' + JSON.stringify(feed) + ')',
      'application/javascript'
    );
  } else if (options.format == 'links') {
    lib.renderOther(
      feed
        .map(function (p) {
          return config.translateEidToUrl((p || {}).eId);
        })
        .join('\n'),
      'text/text'
    );
  } else if (options.showPlaylists && options.format == 'json') {
    lib.renderJson(options.playlists);
  } else if (options.format == 'json') {
    lib.renderJson(feed);
  } else if (options.after || options.before) {
    lib.render({ html: feed });
  } else
    lib.renderPage(
      options.user,
      null /*sidebarHtml*/,
      generateMixpanelCode(options) + feed
    );
}

async function renderUserLibrary(lib, user) {
  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  const pageGenerator = lib.options.playlistId
    ? new PlaylistPageGenerator(user, lib.options)
    : new ProfilePageGenerator(user, lib.options);

  const tracks = await pageGenerator.fetchAndRender();

  renderResponse(lib, lib.options, tracks); // reponds through lib.render*()
}

exports.render = renderUserLibrary;
