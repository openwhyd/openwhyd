/**
 * hotTracks controller
 * renders a feed of the most popular tracks
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var config = require('../models/config.js');
var analytics = require('../models/analytics.js');
var trackModel = require('../models/track.js');
var plTagsModel = require('../models/plTags.js');
var followModel = require('../models/follow.js');
var postsTemplate = require('../templates/posts.js');
var templateLoader = require('../templates/templateLoader.js');
var mainTemplate = require('../templates/mainTemplate.js');

function makeGenreList(selectedGenre) {
  var set = {
    all: {
      name: 'All',
      url: '/hot',
    },
  };
  plTagsModel.ORDERED_GENRES.map(function (genre) {
    set[genre.name] = {
      name: genre.name,
      url: '/hot/' + genre.id,
    };
  });
  (set[selectedGenre || 'all'] || {}).selected = true;
  return snip.values(set);
}

var template;
(function loadTemplates(callback) {
  template = templateLoader.loadTemplate(
    'app/templates/hotTracks.html',
    callback
  );
})();

exports.controller = function (request, reqParams, response) {
  reqParams = reqParams || {};
  var loggedInUser = request.getUser() || {};
  //if (!loggedInUser.id)
  //	return response.temporaryRedirect("/");

  function render(html) {
    response.legacyRender(html, null, { 'content-type': 'text/html' });

    if (
      loggedInUser &&
      loggedInUser.id &&
      !reqParams.after &&
      !reqParams.before
    )
      analytics.addVisit(loggedInUser, request.url /*"/u/"+uid*/);
  }

  reqParams.limit =
    (reqParams.limit ? parseInt(reqParams.limit) : 0) ||
    config.nbPostsPerNewsfeedPage;

  function renderHotTracks(posts) {
    var firstIndex = parseInt(reqParams.skip || 0);
    var hasMore = posts && posts.length > reqParams.limit;
    if (hasMore) posts = posts.slice(0, reqParams.limit);
    if (loggedInUser.id)
      for (let i in posts)
        posts[i].isLoved = snip.arrayHas(posts[i].lov, '' + loggedInUser.id);
    if (reqParams.format == 'json')
      response.legacyRender({
        hasMore: hasMore ? { skip: firstIndex + reqParams.limit } : false,
        genre: genre || 'All',
        tracks: posts,
      });
    else {
      // html rendering
      for (let i in posts)
        if (posts[i].rankIncr < 0) posts[i].cssClass = 'rankingUp';
        else if (posts[i].rankIncr > 0) posts[i].cssClass = 'rankingDown';
      postsTemplate.renderPostsAsync(
        posts,
        { loggedUser: loggedInUser },
        function (postsHtml) {
          var pageVars = {
            hasMore: hasMore ? { skip: firstIndex + reqParams.limit } : null, // to do before renderPosts
            rawFeed: !!reqParams.skip, //reqParams.after || reqParams.before,
            genre: genre || 'All',
            genres: makeGenreList(genre), //GENRE_LIST,
            posts: postsHtml,
          };
          var html = template.render(pageVars);
          if (!pageVars.rawFeed)
            html = mainTemplate.renderWhydPage({
              bodyClass: 'pgHotTracks', // pgWithSideBar
              loggedUser: loggedInUser,
              content: html,
            });
          render(html);
        }
      );
    }
  }

  var params = { skip: reqParams.skip, limit: reqParams.limit + 1 };

  if (reqParams.genre == 'subscribed' && loggedInUser.id) {
    followModel.fetchSubscriptionArray(loggedInUser.id, function (uidList) {
      trackModel.fetchPostsFromSubscriptions(uidList, params, renderHotTracks);
    });
  } else {
    var genre =
      (plTagsModel.extractGenreTags(reqParams.genre || '') || []).shift() || '';
    trackModel.fetchPostsByGenre(genre, params, renderHotTracks);
  }
};
