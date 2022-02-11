/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var userModel = require('../models/user.js');
var postModel = require('../models/post.js');
var feedTemplate = require('../templates/feed.js');

const playlistRenderer = require('./LibUserPlaylist.js');
const profileRenderer = require('./LibUserProfile.js');

// DATA FETCHING HELPERS

function fetchPlaylists(options) {
  return new Promise((resolve) =>
    userModel.fetchPlaylists(options.user, {}, function (playlists) {
      resolve(playlists);
    })
  );
}

function fetchLikes(options, callback) {
  postModel.countLovedPosts(options.user.id, function (count) {
    options.user.nbLikes = count;
    callback();
  });
}

function fetchNbTracks(options, callback) {
  postModel.countUserPosts(options.user.id, function (nbPosts) {
    options.user.nbTracks =
      nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
    callback();
  });
}

// PAGE RENDERING

var bareFormats = new Set(['json', 'links']);

function fetchAndRender(options, callback) {
  options.bodyClass = '';

  populatePaginationParameters(options);

  const renderer = options.playlistId ? playlistRenderer : profileRenderer;
  renderer.fetchAndRender(options, (err, posts) => {
    if (err) return callback(err);
    if (bareFormats.has(options.format)) return callback(posts);
    if (!options.format) {
      renderer.prepareTemplate(options);
    }
    feedTemplate.renderFeedAsync(posts, options, callback);
  });
}

// MAIN FUNCTION

var LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

function populatePaginationParameters(options) {
  options.fetchParams = {
    after: options.after,
    before: options.before,
    limit: options.limit,
  };
  if (options.limit && typeof options.limit !== 'number') {
    if (typeof options.limit === 'string')
      options.fetchParams.limit = parseInt(options.limit);
    else if (typeof options.limit === 'object' && options.limit.push)
      options.fetchParams.limit = parseInt(options.limit.pop());
    // keep only the last value
    // see https://github.com/openwhyd/openwhyd/issues/89
  }
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
      //for (let j=parts.length-1; j>-1; --j)
      //	if (parts[j]) {
      lnk[i] = LNK_URL_PREFIX[i] + username; //parts[j];
      //break;
      //	}
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
      renderedUrl: lnk.home.split('//').pop().split('/').shift(), //uiSnippets.shortenURLs(lnk.home).replace("...", "")
    };
}

function renderResponse(feed, options, lib, user) {
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
  } else if (!feedTemplate.shouldRenderWholeProfilePage(options)) {
    lib.render({ html: feed });
  } else lib.renderPage(user, null /*sidebarHtml*/, feed);
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
  options.displayPlaylistName = !options.playlistId;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);

  // prepend required fetching operations in head of the call chain
  if (feedTemplate.shouldRenderWholeProfilePage(options)) {
    options.user.pl = await fetchPlaylists(options);
    await new Promise((resolve) => fetchLikes(options, resolve));
    await new Promise((resolve) => fetchNbTracks(options, resolve));
  }
  const feed = await new Promise((resolve) => fetchAndRender(options, resolve));
  renderResponse(feed, options, lib, user);
}

exports.render = renderUserLibrary;
