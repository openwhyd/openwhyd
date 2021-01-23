/**
 * playlistOrder controller
 * renders the playlist track ordering page, and stores ordering
 * @author adrienjoly, whyd
 */

var postModel = require('../../models/post.js');
var templateLoader = require('../../templates/templateLoader.js');
var postsTemplate = require('../../templates/posts.js');
var mainTemplate = require('../../templates/mainTemplate.js');

var MAX_TRACKS = 1000;

function renderTemplate(params, callback) {
  templateLoader.loadTemplate(
    'app/templates/feed-trackorder.html',
    function (template) {
      callback(template.render(params));
    }
  );
}

exports.controller = function (request, getParams, response) {
  request.logToConsole('playlistOrder.controller', getParams);

  function renderWhydPage(html) {
    var options = {};
    options.js = options.js || [];
    options.css = options.css || [];
    options.bodyClass = 'pgPlaylistOrder';
    options.pageTitle = 'set order';
    options.content = html;
    options.loggedUser = request.getUser();
    return mainTemplate.renderWhydPage(options);
  }

  function render(html) {
    response.legacyRender(renderWhydPage(html), null, {
      'content-type': 'text/html',
    });
  }

  /*
	if (request.method.toLowerCase() === 'post') { // sent by (new) register form
		//var form = new formidable.IncomingForm();
		//form.parse(request, function(err, postParams) {
			exports.resetPassword(request, request.body/ *postParams* /, response);
		//});
	}
	else*/

  if (!getParams.uId || !getParams.plId)
    return render('what the hell are you trying to do?'); // unlikely to happen ^^

  var loggedUser = null;
  if (!(loggedUser = request.checkLogin(response))) return;

  if (loggedUser.id != getParams.uId)
    return render('what the hell are you doing here, mate?');

  postModel.fetchPlaylistPosts(
    getParams.uId,
    getParams.plId,
    { limit: MAX_TRACKS },
    function (posts) {
      for (let i in posts) posts[i] = postsTemplate.preparePost(posts[i]);
      var params = {
        uId: getParams.uId,
        plId: getParams.plId,
        posts: posts,
      };
      renderTemplate(params, render);
    }
  );
};
