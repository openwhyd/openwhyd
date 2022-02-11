/* global $ */

window.globals = window;

/**
 * post box for openwhyd music
 * @author adrienjoly, whyd
 **/

//================ UTILITY FUNCTIONS

function htmlEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlDecode(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

//================ WHYD POST CLASS (to submit posts)

function WhydPost(/*embedRef*/) {
  var that = this;
  this.postData = {
    action: 'insert',
  };
  this.set_id = function (_id) {
    this.postData._id = _id;
  };
  this.setEmbedRef = function (embedRef) {
    this.postData.eId =
      embedRef.eId ||
      embedRef.id + (embedRef.contentId ? '#' + embedRef.contentId : '');
    this.postData.name = embedRef.name;
    this.postData.img = embedRef.img;
    this.postData.src = embedRef.src; // (typeof embedSrc == "string" ? embedSrc : JSON.stringify(embedSrc))
  };
  this.setText = function (text) {
    this.postData.text = text;
  };
  this.setName = function (name) {
    if (name) this.postData.name = name;
  };
  this.setRepostPid = function (pId) {
    this.postData.pId = pId;
  };
  this.setContext = function (ctx) {
    this.postData.ctx = ctx;
  };
  this.setPlaylist = function (id, name) {
    this.postData.pl = { name: name };
    this.postData.pl.id = id;
  };
  this.submit = function (onPostComplete) {
    //console.log("submitting post: ", postData);
    $.ajax({
      type: 'POST',
      url: '/api/post',
      data: this.postData,
      success: function (post) {
        console.log('posted:', post);
        that.storedPost = post;
        if (onPostComplete) onPostComplete(post._id, that /*postData*/);
      },
      error: function (cause) {
        console.log('post error:', cause);
        that.storedPost = null;
        if (onPostComplete) onPostComplete(null, that);
      },
    });
  };
}

//================ PLAYLIST SELECTOR (ui component)

function WhydPlaylistSelector($selPlaylist, defaultPlaylist, onSelect) {
  var $ul = $selPlaylist.find('ul');
  var $head = $selPlaylist.find('span').first();
  var $arrow = $head.find('span');
  var $playlistMenu = $selPlaylist.find('.content');
  var $form = $selPlaylist.find('form');
  function hideMenu(/*e*/) {
    // only hide if e is null, or if a playlist was clicked (avoid playlist menu head and form)
    // if (!e || !($head[0] == e.target || $head[0] == e.target.parentNode
    // 		|| $form[0] == e.target.parentNode)){
    // 	$playlistMenu.hide();
    //
    // }
    $playlistMenu.removeClass('open');
    console.log('hey');
  }
  $head.bind().click(function showMenu() {
    console.log('show');
    $playlistMenu.addClass('open');
    //$selPlaylist.parent().unbind("click").click(hideMenu);
  });
  function selectPlaylist() {
    var $li = $(this);
    $ul.find('li').removeClass('selected');
    $li.addClass('selected');
    onSelect($li.attr('data-plid'), $li.text());
    var datatext = $li.attr('data-text');
    $head.text(datatext).append($arrow);
    hideMenu();
  }
  function addPlaylist(name, id) {
    var $li = $('<li>').attr('data-plid', id).text(name).appendTo($ul);
    $ul.find('li').unbind().click(selectPlaylist);
    return $li;
  }
  $form.unbind().submit(function () {
    var name = $('#newPlaylistName').val();
    if (name != '') {
      addPlaylist(name, 'create').each(selectPlaylist);
      $('#newPlaylistName').val('');
    }
  });
  function bindItems() {
    if (defaultPlaylist) {
      var $li = $ul.find("li[data-plid='" + defaultPlaylist.id + "']");
      if ($li.length == 0)
        $li = addPlaylist(defaultPlaylist.name, defaultPlaylist.id);
      $li.each(selectPlaylist);
    }
    $ul.find('li').unbind().click(selectPlaylist);
  }
  bindItems();
  return { bindItems };
}

//================ DESCRIPTION FIELD (ui component)

function WhydTextWithMentions(textArea) {
  var MAX_NB_MENTIONS = 6;
  // not used from bookmarklet
  function submitSearchQuery(q, cb) {
    $.ajax({
      type: 'GET',
      url: '/search',
      data: q,
      complete: function (res, status) {
        try {
          if (status != 'success' || !res.responseText) throw 0;
          cb && cb(res.responseText);
        } catch (e) {
          cb && cb({ error: e || 'An error occured. Please try again.' });
          if (e) throw e;
        }
      },
    });
  }
  var $textField = $(textArea).mentionsInput({
    maxMentions: MAX_NB_MENTIONS,
    onDataRequest: function (mode, query, callback) {
      submitSearchQuery({ q: query, context: 'mention' }, function (res) {
        res = JSON.parse(res);
        var hits = (res.hits || []).map(function (r) {
          return {
            id: r._id,
            name: r.name,
            avatar: '/img/u/' + r._id,
            type: 'user',
          };
        });
        callback.call(this, hits);
      });
    },
  });
  return {
    getTextWithMentions: function (cb) {
      $textField.mentionsInput('val', function (text) {
        cb(text.trim ? text.trim() : text);
      });
    },
  };
}

//================ javascript code moved from postEdit.html

window.globals.initPostBox = function (params) {
  var addingFromBookmarklet = params.mode === 'addFromBookmarklet';
  var editingPost = params.mode === 'editPost';
  var reposting = params.mode === 'repost';

  function initWhydPost(embedRef) {
    const whydPost = new WhydPost();
    whydPost.setEmbedRef(embedRef);
    // select default playlist (to override playlist of original author, when reposted)
    whydPost.setPlaylist('null', 'full stream');
    if (params.ctx) whydPost.setContext(params.ctx);
    if (reposting) whydPost.setRepostPid(params.pId);
    else if (editingPost) {
      whydPost.set_id(params.pId);
      if (params.pl) whydPost.setPlaylist(params.pl.id, params.pl.name);
    }
    return whydPost;
  }

  var $body = $('body');

  function close() {
    if (window.globals.avgrundClose) window.globals.avgrundClose();
    else window.close();
    // TODO: also close bookmarklet overlay
  }

  $('#btnClose, #btnCancel').unbind().click(close);

  // for bookmarklet
  function displayConfirmationScreen(posted) {
    var pId = (posted || {})._id;
    $body.addClass(pId ? 'success' : 'failed');
    $body.removeClass('loading');
    if (pId) {
      var url = window.location.href;
      url =
        url.substr(0, url.indexOf('/', 10)).replace('https', 'http') +
        '/c/' +
        pId;
      var $confirm = $('#confirmationScreen');
      $confirm.find('a').first().attr('href', url).unbind().click(close);
      $confirm.find('.sharing').html(
        '<a href="https://twitter.com/share" class="twitter-share-button"' +
          ' data-count="none" data-via="open_whyd" data-url="' +
          htmlEntities(url) +
          '"' +
          ' data-text="' +
          htmlEntities('♫ ' + posted.name /*+ " " + url*/) +
          '">Tweet</a>' +
          '<' +
          'script src="https://platform.twitter.com/widgets.js" type="text/javascript"></' +
          'script>' + // '+' avoids this script from being interpreted as a html file
          '<div class="fb-like" data-send="false" data-layout="button_count" data-width="450"' +
          ' data-show-faces="false" data-href="' +
          htmlEntities(url) +
          '"></div>'
      );
    }
  }

  // for openwhyd ui (add/edit/repost)
  function closeAndShowTrack(posted) {
    window.globals.avgrundClose();
    if (!posted)
      return (window.globals.showMessage || alert)(
        'Oops; an error occurred... Please try again!',
        true
      );
    var url = '/u/' + posted.uId;
    if (posted.pl) {
      url += '/playlist/' + posted.pl.id;
    }
    if (window.globals.showMessage) {
      var plName = posted.pl ? posted.pl.name : 'your tracks';
      window.globals.showMessage(
        "Successfully added track to <a target='_blank' href='" +
          url +
          "'>" +
          window.globals.encodeHtmlEntities(plName) +
          '</a>'
      );
    } else if (url) window.location.href = url;
    else window.location.reload();
  }

  function onPostSuccess(postId, whydPost) {
    var posted = whydPost.storedPost;
    if (!posted) console.log('error from post api:', postId, whydPost);
    if (addingFromBookmarklet) displayConfirmationScreen(posted);
    else closeAndShowTrack(posted);
  }

  function populateTrackUi(embedRef) {
    embedRef = imageToHD(embedRef);
    console.log('populateTrackUi:', embedRef);
    if (!(embedRef || {}).eId) return displayConfirmationScreen(false);
    var whydPost = initWhydPost(embedRef);
    // init ui
    $('#contentTitle').text(embedRef.name);
    $('#contentThumb').css(
      'background-image',
      'url("' + (embedRef.img || '/images/cover-track.png') + '")'
    );
    $('.whydSrcLogo').css(
      'background-image',
      'url("/images/icon-' +
        embedRef.playerLabel.toLowerCase().split(' ')[0] +
        '.png")'
    );
    new WhydPlaylistSelector(
      $('#selPlaylist'),
      whydPost.postData.pl,
      whydPost.setPlaylist.bind(whydPost)
    );
    //		var $titleInput = $("#contentTitleInput").val(embedRef.name);
    var descBox = new WhydTextWithMentions(document.getElementById('text'));
    $('#btnSubmit')
      .unbind()
      .click(function (/*e*/) {
        descBox.getTextWithMentions(function (text) {
          // sample text: "pouet @[adrien](user:4ecb6ec933d9308badd7b7b4) test"
          console.log('WhydTextWithMentions RESULT:', text);
          //				if ($titleInput.length)
          //					whydPost.setName($titleInput.val());
          whydPost.setText(text);
          $body.addClass('loading');
          whydPost.submit(onPostSuccess);
        });
      });
    setTimeout(function () {
      $body.removeClass('loading');
    }, 200);
  }

  function makePlayemStreamDetector(/*eidSet*/) {
    var players = {
      // playem-all.js must be loaded at that point
      yt: new window.globals.YoutubePlayer({}),
      sc: new window.globals.SoundCloudPlayer({}),
      vi: new window.globals.VimeoPlayer({}),
      dm: new window.globals.DailymotionPlayer({}),
      dz: new window.globals.DeezerPlayer({}),
      bc: new window.globals.BandcampPlayer({}),
      ja: new window.globals.JamendoPlayer({}),
      fi: new window.globals.AudioFilePlayer({}),
      // TODO: make sure that the list of players is always up to date
    };
    function getPlayerId(url) {
      for (let i in players) if (players[i].getEid(url)) return i;
    }
    function detectEid(url, cb) {
      var playerId = getPlayerId(url);
      var player = playerId && players[playerId];
      cb(player && '/' + playerId + '/' + player.getEid(url), player);
    }
    return function detect(url, cb) {
      detectEid(url, function (eId, player) {
        if (!eId || !player) return cb();
        if (!player.fetchMetadata)
          // e.g. MP3 files
          return cb({
            eId: eId,
            playerLabel: player.label,
          }); // todo: add default metadata
        player.fetchMetadata(url, function (track) {
          track = track || {};
          track.playerLabel = player.label;
          track.eId = track.eId || eId.substr(0, 4) + track.id; // || eid;
          cb(track);
        });
      });
    };
  }

  function imageToHD(track) {
    if (track.img) {
      if (track.eId.substr(1, 2) == 'yt') {
        var img =
          'https://img.youtube.com/vi/' +
          track.eId.substr(4).split('?')[0] +
          '/hqdefault.jpg';
        var i = new Image();
        i.onload = function () {
          if (i.height >= 120) {
            document.getElementById('contentThumb').style.backgroundImage =
              'url(' + img + ')';
          }
        };
        i.src = img;
      } else if (track.eId.substr(1, 2) == 'sc') {
        track.img = track.img.replace('-large', '-t300x300');
      } else if (track.eId.indexOf('/dz/') == 0)
        track.img = track.img.replace(/\/image$/, '/image?size=480x640');
      else if (track.eId.indexOf('/ja/') == 0)
        track.img = track.img.replace(
          /\/covers\/1\.200\.jpg$/,
          '/covers/1.600.jpg'
        );
    }
    return track;
  }

  function init() {
    $body.addClass('loading');
    $body.removeClass('failed');
    // todo: make sure that playemjs is loaded and ready to use
    // todo: in editPost case: populate track object and display using post metadata, instead of fetching
    makePlayemStreamDetector()(
      params.embed.replace(/&amp;/g, '&'),
      function (track) {
        console.log('postBox detected track:', track);
        if ((track || {}).eId) {
          track.src = params.src;
          track.name = $('#contentTitle').text(); // || $("#contentTitleInput").val();
          if (!track.name || track.name == 'undefined')
            // weak equality necessary because of text()
            track.name = track.title;
        } else track = {};
        populateTrackUi(track);
      }
    );
    /*
		$("#lnkDeletePost").unbind().click(function() {
			window.globals.avgrundClose();
			window.setTimeout(function(){
				var html = '<div><div style="background-image:url(\'' + params.img + '\');"></div>'
					+ '<span>' + params.title + '</span></div>' // TODO: sanitize title?
			  		+ '<span class="btnDelete greenButton" onclick="window.avgrundClose();removePost(\'' + params.pId + '\');">Delete</span>';
				openJqueryDialog($(html), "dlgDeletePost", "Delete this post");
			}, 600);
		});
		*/
  }

  $(init);

  $('#btnRetry').unbind().click(init);

  $(document).ajaxComplete(function () {
    try {
      window.globals.FB.XFBML.parse();
    } catch (ex) {
      console.error(ex);
    }
  });
};
