/* global $, whydPlayer, publishPost */

const postPage = {
  eId: '',

  init: function () {
    const isDynamic = $('.post').attr('data-pid') == '' ? true : false;
    this.eId = $('.thumb').attr('data-eid');
    if (isDynamic) {
      $(
        '.ago, .author, .ext, .btnLike, .btnComment, .btnShare, .btnRepost, .postEdit, .btns span',
      ).hide();
      $('body').addClass('loading');
      this.externalImages(whydPlayer, this.imagesResolver.bind(this));
    } else {
      const img = $('.thumb').attr('data-img');
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
    const eId = this.eId;

    //preload image FROM EID
    if (this.eId.substring(1, 3) == 'yt') {
      this.imagesResolver('-');
      const videoId = eId.substring(4).split('?')[0];
      const youtubeUrl =
        'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
      const oEmbedUrl =
        'https://www.youtube.com/oembed?format=json&url=' +
        encodeURIComponent(youtubeUrl);
      fetch(oEmbedUrl)
        .then(function (res) {
          return res.ok
            ? res.json()
            : Promise.reject(
                new Error(`HTTP error from YouTube oEmbed: ${res.status}`),
              );
        })
        .then(function (data) {
          if (data?.title) {
            $('.post h2 a').text(data.title).attr('href', youtubeUrl);
            const track = {
              eId: '/yt/' + videoId,
              title: data.title,
              img: data.thumbnail_url || '',
              url: youtubeUrl,
            };
            $('.btnRepost')
              .attr('href', '#' + youtubeUrl) // just to make the link findable in tests
              .off('click.ytRepost')
              .on('click.ytRepost', function (e) {
                e.preventDefault();
                publishPost(track);
              })
              .show();
            cb(track.img);
          } else {
            cb();
          }
        })
        .catch(function () {
          cb();
        });
      return;
    }

    this.waitFor('whydPlayer', function (whydPlayer) {
      console.info('fetching metadata for track eId', eId, '...');
      whydPlayer.fetchTrackByUrl(eId, function (track) {
        // TODO: handle case when track is null
        if (track?.title) {
          $('.post h2 a')
            .text(track.title)
            .attr('href', track.url || eId);
          $('.btnRepost')
            .attr('href', '#' + (track.url || eId)) // just to make the link findable in tests
            .off('click.repost')
            .on('click.repost', function (e) {
              e.preventDefault();
              publishPost(track);
            })
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
      if (this.eId.substring(1, 3) == 'yt') {
        img =
          'https://img.youtube.com/vi/' +
          this.eId.substring(4).split('?')[0] +
          '/sddefault.jpg';
      } else if (this.eId.substring(1, 3) == 'sc') {
        img = img.replace('-large', '-t500x500');
      } else if (this.eId.indexOf('/dz/') == 0)
        img = img.replace(/\/image$/, '/image?size=480x640');
      else if (this.eId.indexOf('/ja/') == 0)
        img = img.replace(/\/covers\/1\.200\.jpg$/, '/covers/1.600.jpg');
      const i = new Image();
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
