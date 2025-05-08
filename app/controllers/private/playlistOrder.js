/**
 * playlistOrder controller
 * renders the playlist track ordering page, and stores ordering
 * @author adrienjoly, whyd
 */

const postModel = require('../../models/post.js');
const templateLoader = require('../../templates/templateLoader.js');
const postsTemplate = require('../../templates/posts.js');
const mainTemplate = require('../../templates/mainTemplate.js');

const MAX_TRACKS = 1000;

function renderTemplate(params, callback) {
  templateLoader.loadTemplate(
    'app/templates/feed-trackorder.html',
    function (template) {
      callback(template.render(params));
    },
  );
}

exports.controller = async function (request, getParams, response) {
  request.logToConsole('playlistOrder.controller', getParams);

  async function renderWhydPage(html) {
    const options = {};
    options.js = options.js || [];
    options.css = options.css || [];
    options.bodyClass = 'pgPlaylistOrder';
    options.pageTitle = 'set order';
    options.content = html;
    options.loggedUser = await request.getUser();
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

  let loggedUser = null;
  if (!(loggedUser = request.checkLogin(response))) return;

  if (loggedUser.id != getParams.uId)
    return render('what the hell are you doing here, mate?');

  postModel.fetchPlaylistPosts(
    getParams.uId,
    getParams.plId,
    { limit: MAX_TRACKS },
    function (posts) {
      for (const i in posts) posts[i] = postsTemplate.preparePost(posts[i]);
      const params = {
        uId: getParams.uId,
        plId: getParams.plId,
        posts: posts,
      };
      renderTemplate(params, render);
    },
  );
};
