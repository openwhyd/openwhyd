/**
 * search template
 * @author: adrienjoly, whyd
 **/

var templateLoader = require('../templates/templateLoader.js');
var mainTemplate = require('../templates/mainTemplate.js');
var postsTemplate = require('../templates/posts.js');

var TEMPLATE_SEARCH_PAGE = 'app/templates/searchPage.html';
var TEMPLATE_RESULTS_BOX = 'app/templates/searchResultsBox.html';

var cats = [
  { name: 'Tracks', _type: 'track' },
  { name: 'Posts', _type: 'post' },
  { name: 'People', _type: 'user' },
  { name: 'Playlists', _type: 'playlist' },
];

var makeLink = {
  track: function (item) {
    return '/c/' + item._id;
  }, // in algolia index only
  post: function (item) {
    return '/c/' + item._id;
  },
  user: function (item) {
    return '/u/' + item._id;
  },
  playlist: function (item) {
    return '/u/' + item._id.replace('_', '/playlist/');
  },
};

var makeImg = {
  track: function (item) {
    return item.img;
  }, // in algolia index only
  post: function (item) {
    return '/img/post/' + item._id;
  },
  user: function (item) {
    return '/img/u/' + item._id;
  },
  playlist: function (item) {
    return '/img/playlist/' + item._id;
  },
};

exports.makeResultObject = function (item) {
  return {
    id: item._id,
    name: item.name,
    img: makeImg[item._type](item),
    url: makeLink[item._type](item),
    score: item.score,
    isSubscribed: item.isSubscribed,
  };
};

exports.renderPosts = function (posts, loggedUser, cb) {
  postsTemplate.renderPostsAsync(
    posts,
    {
      loggedUser: loggedUser,
      displayPlaylistName: true,
    },
    cb
  );
};

exports.renderSearchPage = function (results, reqParams, cb) {
  function render() {
    templateLoader.loadTemplate(TEMPLATE_SEARCH_PAGE, function (template) {
      var templateParams = {
        q: reqParams.q,
        results: results,
        isUserLogged: !!reqParams.loggedUser,
      };
      reqParams.content = template.render(templateParams);
      reqParams.bodyClass = 'pgSearch';
      cb(mainTemplate.renderWhydPage(reqParams));
    });
  }
  if (results) {
    results.nbPosts = (results.posts || []).length;
    results.nbUsers = (results.users || []).length;
    results.nbPlaylists = (results.playlists || []).length;
    if (results.posts)
      exports.renderPosts(
        results.posts,
        reqParams.loggedUser,
        function (postsHtml) {
          results.postsHtml = postsHtml;
          render();
        }
      );
  } else render();
};

exports.renderResultBox = function (q, resultsPerType, cb) {
  var templateParams = { q: q, categories: [] };
  for (let i in cats) {
    var cat = cats[i];
    var res = resultsPerType[cat._type];
    if (res)
      templateParams.categories.push({
        name: cat.name,
        _type: cat._type,
        results: res.length > 2 ? res.slice(0, 2) : res,
      });
  }
  templateLoader.loadTemplate(TEMPLATE_RESULTS_BOX, function (template) {
    cb(template.render(templateParams));
  });
};
