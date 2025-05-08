/**
 * LibAll class
 * fetchs and renders whyd's global library (all posts)
 * @author adrienjoly, whyd
 **/

const postModel = require('../models/post.js');
const feedTemplate = require('../templates/feed.js');

function renderAllLibrary(lib) {
  const options = lib.options;
  //options.displayAuthors = true;
  options.displayPlaylistName = true;
  options.follows = { people: [], followers: [] }; // TODO: fix the /all page without having to fetch all users
  options.bodyClass =
    'pgStream pgFullStream pgWithSideBar ' + (options.bodyClass || '');
  options.globalFeed = true;

  function renderFeed(callback) {
    function process(posts) {
      feedTemplate.renderFeedAsync(posts, options, callback);
    }

    postModel.fetchPosts(
      { repost: { $exists: false } },
      null,
      { after: options.after, before: options.before },
      process,
    );
  }

  if (!feedTemplate.shouldRenderWholeProfilePage(options))
    renderFeed(function (feedHtml) {
      lib.render({ html: feedHtml });
    });
  else
    renderFeed(function (feedHtml) {
      //lib.renderSidebar(/*uidList*/ null, null/*user*/, options, function(sidebarHtml){
      lib.renderPage(
        {
          /*name:"Whyd"*/
        },
        null /*sidebarHtml*/,
        feedHtml,
      );
      //});
    });
}

exports.render = renderAllLibrary;
