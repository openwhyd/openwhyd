/**
 * LibAll class
 * fetchs and renders whyd's global library (all posts)
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var feedTemplate = require('../templates/feed.js');

function makeUserList() {
  var userList = [];
  for (let i in mongodb.usernames /*.slice(0,9)*/)
    userList.push(mongodb.usernames[i]);
  return userList;
}

function renderAllLibrary(lib) {
  var options = lib.options;
  //options.displayAuthors = true;
  options.displayPlaylistName = true;
  options.follows = { people: makeUserList(), followers: [] };
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
      process
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
        feedHtml
      );
      //});
    });
}

exports.render = renderAllLibrary;
