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

const playlistRenderer = require('./LibUserPlaylist.js');
const profileRenderer = require('./LibUserProfile.js');

var templateLoader = require('../templates/templateLoader.js');
var profileTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userProfileV2.html'
);
var playlistTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userPlaylistV2.html'
);

// DATA FETCHING HELPERS

function fetchPlaylists(options, callback) {
  userModel.fetchPlaylists(options.user, {}, function (playlists) {
    options.user.pl = playlists;
    callback();
  });
}

function fetchLikes(options, callback) {
  postModel.countLovedPosts(options.user.id, function (count) {
    options.user.nbLikes = count;
    callback();
  });
}

function fetchStats(options, callback) {
  followModel.countSubscriptions(options.user.id, function (nbSubscriptions) {
    followModel.countSubscribers(options.user.id, function (nbSubscribers) {
      options.subscriptions = {
        nbSubscriptions: nbSubscriptions,
        nbSubscribers: nbSubscribers,
      };
      followModel.get(
        { uId: options.loggedUser.id, tId: options.user.id },
        function (err, res) {
          options.user.isSubscribed = !!res;
          callback();
        }
      );
    });
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

function generateMixpanelCode(options) {
  return /*options.uid == options.loggedUser.id ? "" :*/ [
    '<script>',
    ' window.Whyd.tracking.log("Visit profile", "' + options.uid + '");',
    '</script>',
  ].join('\n');
}

var bareFormats = new Set(['json', 'links']);

function fetchAndRender(options, callback) {
  options.bodyClass = '';

  var process = bareFormats.has(options.format)
    ? callback
    : function (posts) {
        if (!options.format && !options.embedW) {
          if (options.playlistId)
            options.pageImage =
              config.urlPrefix +
              '/img/playlist/' +
              options.user.id +
              '_' +
              options.playlistId;
          options.customFeedTemplate = options.playlistId
            ? playlistTemplateV2
            : profileTemplateV2;
        }
        //console.timeEnd("LibFriends.fetchAndRender");
        feedTemplate.renderFeedAsync(posts, options, callback);
      };

  populatePaginationParameters(options);

  const renderer = options.playlistId ? playlistRenderer : profileRenderer;
  renderer.fetchAndRender(options, callback, process);
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
  if (options.embedW)
    options.fetchParams.limit = config.nbTracksPerPlaylistEmbed;
  else if (options.limit && typeof options.limit !== 'number') {
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

function renderUserLibrary(lib, user) {
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
    } else if (!feedTemplate.shouldRenderWholeProfilePage(options)) {
      lib.render({ html: feed });
    } else
      lib.renderPage(
        user,
        null /*sidebarHtml*/,
        generateMixpanelCode(options) + feed
      );
  }

  // add final rendering functions at queue of the call chain
  var fcts = [fetchAndRender, renderResponse];

  // prepend required fetching operations in head of the call chain
  if (feedTemplate.shouldRenderWholeProfilePage(options))
    // main tab: tracks (full layout to render, with sidebar)
    fcts = [
      fetchPlaylists,
      /*fetchSubscriptions,*/ fetchStats,
      fetchLikes,
      fetchNbTracks /*fetchSimilarity*/,
    ].concat(fcts);
  //if (options.showSubscribers || options.showSubscriptions || options.showActivity)
  //	fcts = [fetchSubscriptions].concat(fcts);

  // run the call chain
  (function next(res) {
    var fct = fcts.shift();
    //console.time(fct.name);
    fct(res || options, function (res) {
      //console.timeEnd(fct.name);
      next(res || options);
    });
  })();
}

exports.render = renderUserLibrary;
