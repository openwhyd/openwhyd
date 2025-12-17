/**
 * post viewer template
 * successor of discussPage, to render a post for public viewers and overlay
 * @author adrienjoly, whyd
 **/

const config = require('../models/config.js');
const mainTemplate = require('./mainTemplate.js');
const uiSnippets = require('../templates/uiSnippets.js');
const postsTemplate = require('../templates/posts.js');

const fbAppNs = 'whydapp'; // or whyd-dev

// TO TEST, try to play and add from these urls:
// http://localhost:8080/yt/-hHpSlEz73k
// http://localhost:8080/sc/manisnotabird/bringer-of-rain-and-seed-good

exports.renderPostPage = function (p, cb) {
  p = p || {};
  const post = p.post;
  const options = {
    loggedUser: p.loggedUser,
    bodyClass: 'pgPost',
    pageType: fbAppNs + ':track', // "music.song"
    noIndex: true, // Prevent search engines from indexing this page
  };

  if (p.isDynamic) {
    options.pageUrl = config.urlPrefix + post.eId;
    options.pageImage =
      config.imgUrl(post.eId, null, config.urlPrefix) ||
      'https://s-static.ak.fbcdn.net/images/devsite/attachment_blank.png';
    options.templateVars = { isDynamic: true };
  } else {
    options.pageUrl = config.urlPrefix + '/c/' + post._id;
    options.ogTitle = post.name;
    options.pageTitle = post.name + ', added by ' + post.uNm;
    options.pageDesc = uiSnippets
      .shortenURLs(post.text || '')
      .replace(/\n\n/g, '\n')
      .replace(/\n/g, ' ');
    options.pageImage =
      post.img ||
      config.imgUrl(post.eId, null, config.urlPrefix) ||
      'https://s-static.ak.fbcdn.net/images/devsite/attachment_blank.png';
    //options.css = ["postViewer.css"];
    options.displayPlaylistName = true;
    options.displayVia = true;
  }

  if (p.format == 'json') options.format = 'json';
  else {
    options.customTemplateFile = 'app/templates/postPage.html';
    /*
		options.customImgHandler = function(eId, img){
			if(eId.substr(1, 2) == "yt"){
				img = "http://img.youtube.com/vi/"+ eId.substr(4).split('?')[0] + "/sddefault.jpg";
			}else if(eId.substr(1, 2) == "sc"){
				img = img.replace('-large','-t500x500');
			}
			return img;
		}
		*/
    // this has to be done dynamically in /public/js/postPage.js
  }

  postsTemplate.renderPostsAsync([post], options, function (res) {
    if (p.format == 'json') cb({ data: (res || []).pop() });
    else {
      options.content = res;
      cb({ html: mainTemplate.renderWhydPage(options) });
    }
  });
};
