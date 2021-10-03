var templateLoader = require('../templates/templateLoader.js');
var playlistTemplateV2 = templateLoader.loadTemplate(
  'app/templates/userPlaylistV2.html'
);

exports.playlistTemplateV2 = playlistTemplateV2;
