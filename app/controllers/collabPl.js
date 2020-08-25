/**
 * collaborative playlist controller
 * renders the feed for collaborative playlists
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var analytics = require('../models/analytics.js');
var collabModel = require('../models/collabPl.js');
var postsTemplate = require('../templates/posts.js');
var mainTemplate = require('../templates/mainTemplate.js');
var templateLoader = require('../templates/templateLoader.js');

var LIMIT = config.nbPostsPerNewsfeedPage;

var template, tmpContributors;
function loadTemplates(callback) {
  template = templateLoader.loadTemplate('app/templates/collabPl.html');
  tmpContributors = templateLoader.loadTemplate(
    'app/templates/dlgPlContributors.html',
    callback
  );
  //callback && callback();
}

loadTemplates();

exports.controller = function (request, reqParams, response) {
  request.logToConsole('collabPl.controller', reqParams);
  reqParams = reqParams || {};
  var loggedInUser = request.getUser() || {};
  //if (!loggedInUser.id) return response.temporaryRedirect("/");

  function render(html) {
    response.renderHTML(html);
    console.log('rendering done!');
    if (
      loggedInUser &&
      loggedInUser.id &&
      !reqParams.after &&
      !reqParams.before
    )
      analytics.addVisit(loggedInUser, request.url);
  }

  if (!reqParams.id) return render('How did you get here, mate?');

  if (request.url.split('?')[0].endsWith('/contributors')) {
    collabModel.fetchPlaylistById(reqParams.id, function (playlist) {
      for (var i in playlist.admin)
        playlist.admin[i].img = playlist.admin[i].id
          ? '/img/u/' + playlist.admin[i].id
          : 'http://graph.facebook.com/v2.3/' +
            playlist.admin[i].fbId +
            '/picture?type=square';
      function renderTemplate() {
        render(
          tmpContributors.render({
            moderators: playlist.admin,
          })
        );
      }
      //renderTemplate();
      loadTemplates(renderTemplate); // during dev: reload template every time
    });
    return;
  }

  collabModel.fetchPostsByPlaylistId(
    reqParams.id,
    { after: reqParams.after, limit: LIMIT + 1 },
    function (posts) {
      var hasMore = posts && posts.length > LIMIT;
      if (hasMore) posts = posts.slice(0, LIMIT);

      var pageVars = {
        id: reqParams.id,
        hasMore: hasMore ? { after: posts[posts.length - 1]._id } : null, // to do before renderPosts
        rawFeed: !!(reqParams.after || reqParams.before),
        posts: postsTemplate.renderPosts(posts, { loggedUser: loggedInUser }),
      };

      if (!pageVars.rawFeed)
        collabModel.fetchPlaylistById(reqParams.id, function (playlist) {
          if (!playlist)
            return render(
              'The playlist you were looking for may have vanished!'
            );

          pageVars.playlist = playlist;

          render(
            mainTemplate.renderWhydPage({
              bodyClass: 'pgCollabPl',
              loggedUser: loggedInUser,
              content: template.render(pageVars),
            })
          );
        });
      else render(template.render(pageVars));
    }
  );
};
