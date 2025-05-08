/**
 * bookmarklet / post edit controller
 * renders the iframe of the bookmarklet / re-add / and post edit frame
 * @author adrienjoly, whyd
 */

const config = require('../../models/config.js');
const userModel = require('../../models/user.js');
const postModel = require('../../models/post.js');
const templateLoader = require('../../templates/templateLoader.js');
const mainTemplate = require('../../templates/mainTemplate.js');
const snip = require('../../snip.js');

function renderLoginForm() {
  return mainTemplate.renderWhydFrame(
    [
      '<p style="text-align:center;margin-top:140px;">',
      '  Please <a href="' +
        config.urlPrefix +
        '/login?redirect=closeWindow" target="_blank">login to Openwhyd</a> first.',
      '</p>',
      '<script>',
      '  setTimeout(function(){ window.location.reload(); }, 1000);',
      '</script>',
    ].join('\n'),
  );
  /* other way (ajax) of doing this, from HTML pages browsed from openwhyd.org/:
		var loginDiv = document.getElementById("whydLogin");
		function checkUserLogin(){
			console.log("checking openwhyd user login...");
			include(urlPrefix + "/api/user?callback=_whyd_auth_cb");
		};
		window._whyd_auth_cb = function(user) {
			if (user && user.name) {
				window._whyd_auth_cb = checkUserLogin = function() {};
				console.log("whyd user:", user.name);
				detectAllEmbeds();
				loginDiv.style.display = "none";
			}
			else {
				loginDiv.style.display = "block";
				setTimeout(checkUserLogin, 1000);
			}
		};
		checkUserLogin();
	*/
}

function makePostEditDlg(action, reqParams, playlists, cb) {
  postModel.fetchPostById(reqParams.pId, function (post) {
    if (!post)
      return cb("Sorry, we can't find that post... Maybe was it deleted?"); // TODO: replace by standard error page
    const p = {
      embed: config.translateEidToUrl(post.eId),
      title: post.name,
      text: post.text || '',
      img: post.img,
      playlists: playlists, //user.pl,
      embedded: true,
    };
    if (reqParams.ctx) p.ctx = reqParams.ctx;
    if (action == 'edit') {
      p.editPost = true;
      p.pId = reqParams.pId;
      if (post.pl) {
        post.pl._js_name = snip.sanitizeJsStringInHtml(post.pl.name);
        p.pl = post.pl;
      }
    } else {
      p.repost = true;
      p.pId = reqParams.pId;
      // bug fix: avoid re-mentionning users mentionned in the original post
      p.text = p.text.replace(snip.RE_MENTION, function (str, name) {
        return name;
      });
    }
    cb(null, p);
  });
}

function makeAddDlg(reqParams, playlists, user, cb) {
  const p = {
    urlPrefix: config.urlPrefix,
    uId: user.id || '' + user._id,
    embedded: !reqParams.embed, // !!reqParams.eId,
    embed: snip.htmlEntities(reqParams.eId || reqParams.embed), // sanitized
    title: reqParams.title || '',
    refUrl: snip.htmlEntities(reqParams.refUrl || ''), // sanitized
    refTtl: reqParams.refTtl || '',
    text: reqParams.text || '',
    playlists: playlists, //user.pl,
    head: mainTemplate.makeAnalyticsHeading(user).join('\n'),
    ctx: reqParams.ctx || 'bk', // bookmarklet
  };
  const eId = reqParams.eId || config.translateUrlToEid(reqParams.embed);
  /*
	postModel.fetchPosts({eId:eId}, {sort:['_id','asc']}, {limit:1}, function(posts) {
		if (posts && posts.length && posts[0]) {
			p.repost = { pId: posts[0]._id };
			p.trackPresenceMsg = (posts[0].uId == user.id ? "You already" : posts[0].uNm + " first")
				+ " added this track, "
				+ snip.renderTimestamp(new Date() - posts[0]._id.getTimestamp()) + " ago.";
		}
		else
			p.trackPresenceMsg = "Congrats! You're the first to add this track on Openwhyd!";
		render(p);
	});
	*/
  postModel.fetchPosts(
    { eId: eId, uId: user.id },
    {},
    { limit: 1 },
    function (posts) {
      if (posts && posts.length && posts[0])
        p.trackPresenceMsg =
          'You already added this track, ' +
          snip.renderTimestamp(new Date() - posts[0]._id.getTimestamp()) +
          ' ago.';
      cb(null, p);
    },
  );
}

/**
 * called by bookmarklet, when user selects a resource to share from an external web page
 */
exports.controller = async function (request, reqParams, response) {
  request.logToConsole('bookmarklet.controller', reqParams);
  if (!reqParams) reqParams = {};

  const user = await request.checkLogin();
  if (!user) {
    const html = renderLoginForm({ redirect: request.url });
    return response.renderHTML(html);
  }

  function render(error, params) {
    if (error) return response.renderHTML(error);
    templateLoader.loadTemplate(
      reqParams.v == 2
        ? 'app/templates/postEditV2.html'
        : 'app/templates/postEdit.html', // TODO: effacer postEdit.html et postBox.js
      function (template) {
        response.renderHTML(template.render(params));
      },
    );
  }

  userModel.fetchByUid(user.id, function (user) {
    userModel.fetchPlaylists(user, {}, function (playlists) {
      if (reqParams.pId) {
        // repost or edit from openwhyd ui
        const action = request.url.split('?')[0].split('/').pop();
        makePostEditDlg(action, reqParams, playlists, render);
      } else if (reqParams.embed || reqParams.eId) {
        // adding new track from bookmarklet or external search results on openwhyd.org
        makeAddDlg(reqParams, playlists, user, render);
      } else response.badRequest();
    });
  });
};
