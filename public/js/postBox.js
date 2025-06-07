/* global $ */

/**
 * post box for openwhyd music
 * @author adrienjoly, whyd
 **/

const globals = window;

//================ UTILITY FUNCTIONS

function htmlEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

//================ WHYD POST CLASS (to submit posts)

function WhydPost(/*embedRef*/) {
  const that = this;
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
    });
  };
}

//================ PLAYLIST SELECTOR (ui component)

function WhydPlaylistSelector(whydPost, $selPlaylist, defaultPlaylist) {
  $selPlaylist = $selPlaylist || $('#selPlaylist');
  const $ul = $selPlaylist.find('ul');
  const $head = $selPlaylist.find('span').first();
  const $arrow = $head.find('span');

  // select default playlist (to override playlist of original author, when reposted)
  globals.whydPost.setPlaylist('null', 'full stream');

  const $playlistMenu = $selPlaylist.find('.content');
  const $playlistHead = $selPlaylist.find('span.head');

  function hideMenu(e) {
    // only hide if e is null, or if a playlist was clicked (avoid playlist menu head and form)
    if (
      !e ||
      !(
        $playlistHead[0] == e.target ||
        $playlistHead[0] == e.target.parentNode ||
        $playlistMenu.find('form')[0] == e.target.parentNode
      )
    )
      $playlistMenu.hide();
  }
  function showMenu() {
    $playlistMenu.show();
    $selPlaylist.parent().unbind('click').click(hideMenu);
  }
  $playlistHead.click(showMenu);

  function addPlaylist(name, id) {
    const $li = $('<li>').attr('data-plid', id).text(name).appendTo($ul);
    $ul.find('li').unbind().click(selectPlaylist);
    return $li;
  }

  function selectPlaylist() {
    const $li = $(this);
    $ul.find('li').removeClass('selected');
    $li.addClass('selected');
    globals.whydPost.setPlaylist($li.attr('data-plid'), $li.text());
    $head.text($li.text()).append($arrow);
    hideMenu();
  }

  $selPlaylist.find('form').submit(function () {
    const name = $('#newPlaylistName').val();
    if (name != '') {
      addPlaylist(name, 'create').each(selectPlaylist);
      $('#newPlaylistName').val('');
    }
  });

  function bindItems() {
    if (defaultPlaylist) {
      let $li = $ul.find("li[data-plid='" + defaultPlaylist.id + "']");
      if ($li.length == 0)
        $li = addPlaylist(defaultPlaylist.name, defaultPlaylist.id);
      $li.each(selectPlaylist);
    }
    $ul.find('li').unbind().click(selectPlaylist);
  }

  return {
    bindItems: bindItems,
  };
}

//================ DESCRIPTION FIELD (ui component)

function WhydTextWithMentions(textArea, btn, onSubmit) {
  const MAX_NB_MENTIONS = 6;
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
  const $btn = $(btn);
  const $textField = $(textArea).mentionsInput({
    maxMentions: MAX_NB_MENTIONS,
    onDataRequest: function (mode, query, callback) {
      submitSearchQuery({ q: query, context: 'mention' }, function (res) {
        res = JSON.parse(res);
        const hits = (res.hits || []).map(function (r) {
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
  $btn.click(function () {
    $textField.mentionsInput('val', function (text) {
      onSubmit(text.trim ? text.trim() : text);
    });
  });
}

//================ javascript code moved from postEdit.html

window.initPostBox = function (params) {
  const addingFromBookmarklet = params.mode === 'addFromBookmarklet';
  const editingPost = params.mode === 'editPost';
  const reposting = params.mode === 'repost';

  function onPostSuccess(postId, whydPost) {
    const posted = globals.whydPost.storedPost;
    if (addingFromBookmarklet) {
      /* from bookmarklet: display confirmation screen + link to post */
      var url = window.location.href;
      url = url.substr(0, url.indexOf('/', 10));
      url = url.replace('https', 'http');
      url += '/c/' + postId;
      $('body > div').hide();
      const $confirm = $('#confirmationScreen').show();
      $confirm
        .find('.sharing')
        .html(
          '<a href="https://twitter.com/share" class="twitter-share-button" data-count="none" data-via="open_whyd" data-text="' +
            htmlEntities('♫ ' + posted.name /*+ " " + url*/) +
            '" data-url="' +
            htmlEntities(url) +
            '">Tweet</a><' +
            'script src="https://platform.twitter.com/widgets.js" type="text/javascript"></' +
            'script><div class="fb-like" data-send="false" data-layout="button_count" data-width="450" data-show-faces="false" data-href="' +
            htmlEntities(url) +
            '"></div>',
        );
      $confirm.find('a').first().attr('href', url);
    } else {
      /* from openwhyd ui: close dialog and show message with link to playlist */
      globals.avgrundClose();
      if (!posted) {
        (window.showMessage || alert)(
          'Oops; an error occurred... Please try again!',
          true,
        );
        return console.log(postId, whydPost);
      }
      var url = '/u/' + posted.uId;
      if (posted.pl) {
        url += '/playlist/' + posted.pl.id;
      }
      if (window.showMessage) {
        const plName = posted.pl ? posted.pl.name : 'your tracks';
        globals.showMessage(
          "Successfully added track to <a target='_blank' href='" +
            url +
            "'>" +
            globals.encodeHtmlEntities(plName) +
            '</a>',
        );
      } else if (url) window.location.href = url;
      else window.location.reload();
    }
  }

  function onTrack(embedRef) {
    console.log('onTrack:', embedRef);
    globals.whydPost = new WhydPost();
    globals.whydPost.setEmbedRef(embedRef);
    if (params.ctx) globals.whydPost.setContext(params.ctx);
    if (reposting) globals.whydPost.setRepostPid(params.pId);
    else if (editingPost) {
      globals.whydPost.set_id(params.pId);
      if (params.pl) globals.whydPost.setPlaylist(params.pl.id, params.pl.name);
    }

    new WhydPlaylistSelector(
      globals.whydPost,
      null,
      globals.whydPost.postData.pl,
    ).bindItems();

    $('#contentSource')
      .text('Source: ' + embedRef.playerLabel)
      .addClass(embedRef.playerLabel.toLowerCase());

    // init ui
    $('#contentThumb > div > div').html(
      '<img src="' + (embedRef.img || '/images/cover-track.png') + '"/>',
    );
    $('#contentTitle').text(embedRef.name);
    const $titleInput = $('#contentTitleInput').val(embedRef.name);

    new WhydTextWithMentions(
      document.getElementById('text'),
      document.getElementById('btnSubmit'),
      function (text) {
        // sample text: "pouet @[adrien](user:4ecb6ec933d9308badd7b7b4) test"
        console.log('WhydTextWithMentions RESULT:', text);
        if ($titleInput.length) globals.whydPost.setName($titleInput.val());
        globals.whydPost.setText(text);
        globals.whydPost.submit(onPostSuccess);
      },
    );
  }

  function makePlayemStreamDetector(/*eidSet*/) {
    const players = {
      // playem-all.js must be loaded at that point
      yt: new globals.YoutubePlayer({}),
      sc: new globals.SoundCloudPlayer({}),
      vi: new globals.VimeoPlayer({}),
      dm: new globals.DailymotionPlayer({}),
      dz: new globals.DeezerPlayer({}),
      bc: new globals.BandcampPlayer({}),
      ja: new globals.JamendoPlayer({}),
      fi: new globals.AudioFilePlayer({}),
      // TODO: make sure that the list of players is always up to date
    };
    function getPlayerId(url) {
      for (const i in players) if (players[i].getEid(url)) return i;
    }
    function detectEid(url, cb) {
      const playerId = getPlayerId(url);
      const player = playerId && players[playerId];
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

  $(function () {
    // todo: make sure that playemjs is loaded and ready to use
    // todo: in editPost case: populate track object and display using post metadata, instead of fetching
    makePlayemStreamDetector()(
      params.embed.replace(/&amp;/g, '&'),
      function (track) {
        console.log('postEdit detected track:', track);
        if (!(track || {}).eId) {
          // TODO: make a ui that prevents from adding the invalid track
          $('#btnSubmit').hide();
          return (window.showMessage || alert)(
            'Oops; an error occurred... Please try again!',
            true,
          );
        }
        track.src = params.src;
        track.name = $('#contentTitle').text() || $('#contentTitleInput').val();
        if (!track.name || track.name == 'undefined')
          // weak equality necessary because of text()
          track.name = track.title;
        onTrack(track);
      },
    );

    $('#lnkDeletePost').click(function () {
      globals.avgrundClose();
      window.setTimeout(function () {
        const html =
          '<div><div style="background-image:url(\'' +
          params.img +
          '\');"></div>' +
          '<span>' +
          params.title +
          '</span></div>' + // TODO: sanitize title?
          '<span class="btnDelete greenButton" onclick="avgrundClose();removePost(\'' +
          params.pId +
          '\');">Delete</span>';
        globals.openJqueryDialog($(html), 'dlgDeletePost', 'Delete this post');
      }, 600);
    });
  });

  $(document).ajaxComplete(function () {
    try {
      globals.FB.XFBML.parse();
    } catch (ex) {
      console.error(ex);
    }
  });
};
