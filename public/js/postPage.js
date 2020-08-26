/* global $ */

var postPage = {
  eId: '',

  init: function () {
    var isDynamic = $('.post').attr('data-pid') == '' ? true : false;
    this.eId = $('.thumb').attr('data-eid');
    if (isDynamic) {
      $(
        '.ago, .author, .ext, .btnLike, .btnComment, .btnShare, .btnRepost, .postEdit, .btns span'
      ).hide();
      $('body').addClass('loading');
      this.externalImages(whydPlayer, this.imagesResolver.bind(this));
    } else {
      var img = $('.thumb').attr('data-img');
      this.imagesResolver(img);
    }
  },

  waitFor: function (v, cb) {
    if (window[v]) {
      cb(window[v]);
    } else {
      setTimeout(this.waitFor.bind(null, v, cb), 200);
    }
  },

  externalImages: function (whydPlayer, cb) {
    var eId = this.eId;

    //preload image FROM EID
    if (this.eId.substr(1, 2) == 'yt') {
      this.imagesResolver('-');
    }

    this.waitFor('whydPlayer', function (whydPlayer) {
      console.info('fetching metadata for track eId', eId, '...');
      whydPlayer.fetchTrackByUrl(eId, function (track) {
        // TODO: handle case when track is null
        if (track && track.title) {
          $('.post h2 a')
            .text(track.title)
            .attr('href', track.url || eId);
          $('.btnRepost')
            .attr(
              'href',
              'javascript:publishPost(' + JSON.stringify(track) + ');'
            )
            .show();
          cb(track.img);
        } else {
          cb();
        }
      });
    });
  },

  imagesResolver: function (img) {
    if (img) {
      if (this.eId.substr(1, 2) == 'yt') {
        img =
          'https://img.youtube.com/vi/' +
          this.eId.substr(4).split('?')[0] +
          '/sddefault.jpg';
      } else if (this.eId.substr(1, 2) == 'sc') {
        img = img.replace('-large', '-t500x500');
      } else if (this.eId.indexOf('/dz/') == 0)
        img = img.replace(/\/image$/, '/image?size=480x640');
      else if (this.eId.indexOf('/ja/') == 0)
        img = img.replace(/\/covers\/1\.200\.jpg$/, '/covers/1.600.jpg');
      var i = new Image();
      i.onload = function () {
        if (i.height >= 120) {
          $('.jsDynThumb').css('background-image', 'url(' + img + ')');
          $('.thumb img').attr('img', img);
        }
        $('body').removeClass('loading');
      };
      i.src = img;
    } else $('body').removeClass('loading');
  },
};

$(document).ready(function () {
  postPage.init();
});
