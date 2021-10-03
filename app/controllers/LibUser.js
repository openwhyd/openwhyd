/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
var feedTemplate = require('../templates/feed.js');
const feedOptions = require('../templates/feedOptions.js');
const playlistRenderer = require('./LibUserPlaylist.js');
const profileRenderer = require('./LibUserProfile.js');

// DATA FETCHING HELPERS

function fetchPlaylists(options) {
  return new Promise((resolve) =>
    userModel.fetchPlaylists(options.user, {}, resolve)
  );
}

function fetchLikes(options) {
  return new Promise((resolve) =>
    postModel.countLovedPosts(options.user.id, resolve)
  );
}

function fetchSubscriptions(options) {
  return new Promise((resolve) =>
    followModel.countSubscriptions(options.user.id, function (nbSubscriptions) {
      followModel.countSubscribers(options.user.id, function (nbSubscribers) {
        resolve({
          nbSubscriptions: nbSubscriptions,
          nbSubscribers: nbSubscribers,
        });
      });
    })
  );
}

function isSubscribed(options) {
  return new Promise((resolve) =>
    followModel.get(
      { uId: options.loggedUser.id, tId: options.user.id },
      (err, res) => resolve(res)
    )
  );
}

function fetchNbTracks(options) {
  return new Promise((resolve) =>
    postModel.countUserPosts(options.user.id, resolve)
  );
}

// PAGE RENDERING

function generateMixpanelCode(options) {
  return [
    '<script>',
    ' window.Whyd.tracking.log("Visit profile", "' + options.uid + '");',
    '</script>',
  ].join('\n');
}

var bareFormats = new Set(['json', 'links']);

function fetchAndRender(options) {
  options.bodyClass = '';

  const renderer = options.playlistId ? playlistRenderer : profileRenderer;

  options.fetchParams = preparePaginationParameters(options);

  return new Promise((resolve) =>
    renderer.fetchAndRender(options, (error, posts) => {
      if (error) {
        return resolve(error);
      }
      if (bareFormats.has(options.format)) {
        return resolve(posts);
      }
      if (!options.format && !options.embedW) {
        renderer.prepareRendering(options);
      }
      feedTemplate.renderFeedAsync(posts, options, (renderedFeed) =>
        resolve(renderedFeed)
      );
    })
  );
}

// MAIN FUNCTION

var LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

function preparePaginationParameters(options) {
  const fetchParams = {
    after: options.after,
    before: options.before,
    limit: options.limit,
  };
  if (options.embedW) fetchParams.limit = config.nbTracksPerPlaylistEmbed;
  else if (options.limit && typeof options.limit !== 'number') {
    if (typeof options.limit === 'string')
      fetchParams.limit = parseInt(options.limit);
    else if (typeof options.limit === 'object' && options.limit.push)
      fetchParams.limit = parseInt(options.limit.pop());
    // keep only the last value
    // see https://github.com/openwhyd/openwhyd/issues/89
  }
  return fetchParams;
}

function renderUserLinks(lnk) {
  // clean social links
  for (let i in lnk) lnk[i] = ('' + lnk[i]).trim();

  // for each social link, detect username and rebuild URL
  for (let i in LNK_URL_PREFIX)
    if (lnk[i]) {
      var parts = lnk[i].split('?').shift().split('/');
      lnk[i] = ''; // by default, if no username was found
      var username = '';
      while (!(username = parts.pop()));
      lnk[i] = LNK_URL_PREFIX[i] + username;
    }

  // make sure URLs are valid
  for (let i in lnk)
    if (lnk[i]) {
      var lnkBody = '//' + lnk[i].split('//').pop();
      if (i == 'home') {
        var isHttps = lnk[i].match(/^https:\/\//);
        lnk[i] = (isHttps ? 'https' : 'http') + ':' + lnkBody;
      } else {
        lnk[i] = lnkBody;
      }
    } else delete lnk[i];

  if (lnk.home)
    lnk.home = {
      url: lnk.home,
      renderedUrl: lnk.home.split('//').pop().split('/').shift(),
    };
}

async function renderUserLibrary(lib, user) {
  var options = lib.options;

  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  options.pageUrl = options.pageUrl.replace(
    '/' + user.handle,
    '/u/' + user._id
  );

  options.uid = '' + user._id;
  options.user = user;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);

  function renderResponse(feed) {
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
    } else if (!feedOptions.mustRenderWholeProfilePage(options)) {
      lib.render({ html: feed });
    } else
      lib.renderPage(
        user,
        null /*sidebarHtml*/,
        generateMixpanelCode(options) + feed
      );
  }

  if (feedOptions.mustRenderWholeProfilePage(options)) {
    // main tab: tracks (full layout to render, with sidebar)
    options.user.pl = await fetchPlaylists(options);
    options.subscriptions = await fetchSubscriptions(options);
    options.user.isSubscribed = !!(await isSubscribed(options));
    options.user.nbLikes = await fetchLikes(options);
    const nbPosts = await fetchNbTracks(options);
    options.user.nbTracks =
      nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
  }

  const res = await fetchAndRender(options);
  await new Promise((resolve) => renderResponse(res, resolve));
}

exports.render = renderUserLibrary;
