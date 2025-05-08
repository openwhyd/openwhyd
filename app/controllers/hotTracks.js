/**
 * hotTracks controller
 * renders a feed of the most popular tracks
 * @author adrienjoly, whyd
 **/

const snip = require('../snip.js');
const config = require('../models/config.js');
const trackModel = require('../models/track.js');
const postsTemplate = require('../templates/posts.js');
const templateLoader = require('../templates/templateLoader.js');
const mainTemplate = require('../templates/mainTemplate.js');

let template;
(function loadTemplates(callback) {
  template = templateLoader.loadTemplate(
    'app/templates/hotTracks.html',
    callback,
  );
})();

exports.controller = async function (request, reqParams, response) {
  reqParams = reqParams || {};
  const loggedInUser = (await request.getUser()) || {};

  function render(html) {
    response.legacyRender(html, null, { 'content-type': 'text/html' });
  }

  reqParams.limit =
    (reqParams.limit ? parseInt(reqParams.limit) : 0) ||
    config.nbPostsPerNewsfeedPage;

  function renderHotTracks(posts) {
    const firstIndex = parseInt(reqParams.skip || 0);
    const hasMore = posts && posts.length > reqParams.limit;
    if (hasMore) posts = posts.slice(0, reqParams.limit);
    if (loggedInUser.id)
      for (const i in posts)
        posts[i].isLoved = snip.arrayHas(posts[i].lov, '' + loggedInUser.id);
    if (reqParams.format == 'json')
      response.legacyRender({
        hasMore: hasMore ? { skip: firstIndex + reqParams.limit } : false,
        tracks: posts,
      });
    else {
      // html rendering
      for (const i in posts)
        if (posts[i].rankIncr < 0) posts[i].cssClass = 'rankingUp';
        else if (posts[i].rankIncr > 0) posts[i].cssClass = 'rankingDown';
      postsTemplate.renderPostsAsync(
        posts,
        { loggedUser: loggedInUser },
        function (postsHtml) {
          const pageVars = {
            hasMore: hasMore ? { skip: firstIndex + reqParams.limit } : null, // to do before renderPosts
            rawFeed: !!reqParams.skip, //reqParams.after || reqParams.before,
            posts: postsHtml,
          };
          let html = template.render(pageVars);
          if (!pageVars.rawFeed)
            html = mainTemplate.renderWhydPage({
              bodyClass: 'pgHotTracks', // pgWithSideBar
              loggedUser: loggedInUser,
              content: html,
            });
          render(html);
        },
      );
    }
  }

  const params = {
    skip: reqParams.skip,
    limit: reqParams.limit + 1,
    sinceId: reqParams.sinceId,
  };
  trackModel.getHotTracksFromDb(params, renderHotTracks);
};
