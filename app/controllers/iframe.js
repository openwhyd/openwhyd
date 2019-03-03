/**
 * iframe controller
 * renders an HTML iframe to another page
 */

var DESTINATIONS = {
  '/download': [
    'https://openwhyd.github.io/openwhyd-electron/download',
    {
      title: 'Download Openwhyd',
      img: 'https://openwhyd.github.io/openwhyd-electron/screenshot.png',
      desc:
        'Discover and collect music gems from Youtube, Soundcloud, Deezer and more. Can now be installed on your favorite OS, to play music in the background.'
    }
  ]
};

exports.controller = function(request, reqParams, response) {
  var path = request.url.split('?')[0];
  var [redirUrl, meta] = DESTINATIONS[path] || [];
  if (redirUrl) {
    response.renderIframe(redirUrl, meta);
  } else {
    response.notFound();
  }
};
