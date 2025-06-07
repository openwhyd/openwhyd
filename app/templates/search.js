/**
 * search template
 * @author: adrienjoly, whyd
 **/

const templateLoader = require('../templates/templateLoader.js');
const mainTemplate = require('../templates/mainTemplate.js');
const postsTemplate = require('../templates/posts.js');

const TEMPLATE_SEARCH_PAGE = 'app/templates/searchPage.html';
const TEMPLATE_RESULTS_BOX = 'app/templates/searchResultsBox.html';

const cats = [
  { name: 'Posts', _type: 'post' },
  { name: 'People', _type: 'user' },
  { name: 'Playlists', _type: 'playlist' },
];

const makeLink = {
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

const makeImg = {
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
    cb,
  );
};

exports.renderSearchPage = async function (results, reqParams, cb) {
  if (results) {
    results.nbPosts = (results.posts || []).length;
    results.nbUsers = (results.users || []).length;
    results.nbPlaylists = (results.playlists || []).length;
    if (results.posts) {
      results.postsHtml = await new Promise((res) =>
        exports.renderPosts(results.posts, reqParams.loggedUser, res),
      );
    }
  }
  templateLoader.loadTemplate(TEMPLATE_SEARCH_PAGE, function (template) {
    const templateParams = {
      q: reqParams.q,
      results: results,
      isUserLogged: !!reqParams.loggedUser,
    };
    reqParams.content = template.render(templateParams);
    reqParams.bodyClass = 'pgSearch';
    cb(mainTemplate.renderWhydPage(reqParams));
  });
};

exports.renderResultBox = function (q, resultsPerType, cb) {
  const templateParams = { q: q, categories: [] };
  for (const i in cats) {
    const cat = cats[i];
    const res = resultsPerType[cat._type];
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
