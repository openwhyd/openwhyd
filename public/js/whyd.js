/* global $, _, openRemoteDialog, whydPlayer, goToPage, showMessage, openJqueryDialog, htmlEntities, avgrundClose, QuickSearch */

const MAX_NB_MENTIONS = 6;

const wlh = window.location.href;
const urlPrefix = wlh.substr(0, wlh.indexOf('/', 8));
const urlDomain = urlPrefix.split('//').pop();

window.goToPage = function (url) {
  console.warn('goToPage without ajaxify', url); // indicates that ajaxify is not active yet
  window.location.href = url || window.location.href;
};

// prevents bug in firefox 3
if (undefined == window.console) window.console = { log: function () {} }; // eslint-disable-line @typescript-eslint/no-empty-function

/* utility functions */

// actually, this function is bound to "signup" links, so it should probably be renamed accordingly
function login() {
  // openRemoteDialog(urlPrefix + '/signup?popin=true', 'dlgSignup'); // Causes a CORS error when Auth0 is active, unless Auth0's signup page is attached to our domain
  goToPage('/signup');
}

function decodeHtmlEntities(str) {
  return $('<div>').html(str).text();
}

function encodeHtmlEntities(str) {
  return $('<div>').text(str).html();
}

window.htmlEntities = encodeHtmlEntities;
window.htmlDecode = decodeHtmlEntities;

function getPostById(pId, callback) {
  callback($('.post[data-pid=' + pId + ']'));
}

function extractPostData($post, defaults = {}) {
  $post = $post || $(this);
  const $author = $post.find('.author > a').first();
  const uId = $author.attr('href') || defaults.uId;
  let text = $post
    .find('.text')
    .first()
    .contents()
    .filter(function () {
      return this.nodeType == 3;
    })
    .text();
  try {
    text = text.trim(); // trim() not supported on IE8
  } catch (e) {
    console.trace(e);
  }
  return {
    id: $post.attr('data-pid'), // for askPostShareFB
    pId: $post.attr('data-pid'),
    eId: $post.find('a').first().attr('data-eid'),
    name: $post.find('h2')[0].innerText,
    text: text,
    uId: uId ? uId.replace('/u/', '') : undefined,
    uNm: $author.text() || defaults.uNm, // title.find("a").get(0).innerText;
    img: $post.find('img').first().attr('src'),
    initialpid: $post.attr('data-initialpid'), // for reposts only
    nbLoves: parseInt($post.find('.nbLoves > span').text()),
    nbReposts: parseInt($post.find('.nbReposts > span').text()),
  };
}

/* api wrappers */
///////////////////////TODO
function submitSearchQuery(q, cb) {
  $.ajax({
    type: 'GET',
    url: '/search',
    data: q,
    timeout: 10000, // 10 second timeout
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

window.removePost = function (pId) {
  $.ajax({
    type: 'POST',
    url: '/api/post',
    data: {
      action: 'delete',
      _id: pId,
    },
    complete: function () {
      //refreshFeed
      $('.post[data-pid=' + pId + ']').remove();
      whydPlayer.populateTracks();
    },
  });
};

function deleteComment(cId, cb) {
  $.ajax({
    type: 'POST',
    url: '/api/post',
    data: {
      action: 'deleteComment',
      _id: cId,
    },
    complete: function () {
      //refreshFeed
      $('.post div[data-cid=' + cId + ']').remove();
      cb && cb();
    },
  });
}

function addComment(pId, text, cb) {
  //TEST: cb({responseJSON:{pId:pId, text:text, uId:user.id, uNm:user.name}});
  $.ajax({
    type: 'POST',
    url: '/api/post',
    data: {
      action: 'addComment',
      pId: pId,
      text: text,
    },
    complete: cb,
  });
}

window.subscribeToUser = function (uId, cb) {
  $.ajax({
    type: 'GET',
    url: '/api/follow',
    data: { action: 'insert', tId: uId },
    success: function (r) {
      cb && cb(r);
      window.Whyd.tracking.log('Followed', uId);
    },
  });
};

function switchSubscription() {
  const $button = $(this).hasClass('userSubscribe')
    ? $(this)
    : $('.userSubscribe');
  const uid = $button.attr('data-uid') || window.pageUser.id;
  const subscribing = !$button.hasClass('subscribed');
  $.ajax({
    type: 'GET',
    url: '/api/follow',
    data: { action: subscribing ? 'insert' : 'delete', tId: uid /*, tNm:unm*/ },
    success: function () {
      $button
        .toggleClass('subscribed')
        .text(subscribing ? 'Following' : 'Follow');
      if (subscribing) window.Whyd.tracking.log('Followed', uid);
      else window.Whyd.tracking.log('Unfollowed', uid);
    },
  });
}

function _fetchUserInfo(uid, action, callback) {
  $.ajax({
    type: 'GET',
    url: '/api/user/' + uid + '/' + action,
    success: callback,
    dataType: 'json',
  });
}

function _fetchPostInfo(pid, action, callback) {
  $.ajax({
    type: 'GET',
    url: '/api/post/' + pid + '/' + action,
    success: callback,
    dataType: 'json',
  });
}

/* external API wrappers */

window.searchExternalTracks = (function () {
  return function (query, handleResult) {
    // playem.searchTracks(query, handleResult);
    console.info(
      'ignoring external search, see https://github.com/openwhyd/openwhyd/issues/262',
    );
    handleResult(); // callback to signal that no more results are going to be returned
  };
})();

/* main ui functions and dialogs */

window.toggleLovePost = function (pId) {
  if (!window.user || !window.user.id)
    //return window.location.href = "/";
    //return alert("Please sign in first!")
    return login();
  getPostById(pId, function ($post) {
    let $button = $post.find('.btnLike').first();
    $button = $button.add('#postViewer .btnLike');
    function updateButton(result) {
      if (!result || result.error)
        return alert(result.error || 'operation failed... please try again!');
      const playingTrack = window.whydPlayer.getCurrentTrack();
      console.log('playing track', playingTrack);
      if (playingTrack && playingTrack.metadata.pid == pId)
        $('#btnLike').toggleClass('loved', result.loved);
      if (result.loved) {
        $button.addClass('selected').text('Liked');
        try {
          window.Whyd.tracking.log('Liked track', result.post._id);
        } catch (e) {
          console.trace('error');
        }
      } else $button.removeClass('selected').text('Like');
      const $counter = $post.find('.nbLoves > span');
      const nbLoves =
        parseInt($counter.first().text()) + (result.loved ? 1 : -1);
      $counter.text(nbLoves); //.parent().toggle(nbLoves>0);
      updatePostStats($post);
    }
    $.post('/api/post', { action: 'toggleLovePost', pId: pId }, updateButton);
  });
};

window.loadMore = function (params, cb) {
  const $button = $('.btnLoadMore').last();
  $button.addClass('loading');
  const $frame = $button.parent();
  $frame.ready(function () {
    params = params || {};
    if (params.limit)
      params.urlSuffix = (params.urlSuffix || '') + '&limit=' + params.limit;
    $.get(window.nextPageUrl + (params.urlSuffix || ''), function (data) {
      $button.remove();
      $frame.append(data).ready(function () {
        window.whydPlayer.updateTracks();
        $(this).ajaxify();
        cb && cb();
        $button.removeClass('loading');
      });
    });
  });
};

function loadTop() {
  const $firstPost = $('.posts > .post').first();
  if (window.prevPageUrl && window.prevPageUrl.split('before=')[1])
    $.get(window.prevPageUrl, function (data) {
      $firstPost.before(data);
      $('.emptyFeed').remove();
      setTimeout(function () {
        console.log('refreshing...');
        window.whydPlayer.updateTracks();
        window.whydPlayer.refresh(); // in order to re-position the video currently being played
      }, 200);
    });
  else goToPage(window.location.href); //refresh the page (e.g. when posting a first track on a new playlist)
}

function onNewPost(whydPost) {
  console.log('on new post', whydPost);
  const p = whydPost.storedPost;

  if (!p) {
    showMessage('Oops; an error occurred... Please try again!');
    return console.trace(whydPost);
  }

  showMessage(
    "Successfully added track to <a target='_blank' href='" +
      '/u/' +
      p.uId +
      (p.pl ? '/playlist/' + p.pl.id : '') +
      "'>" +
      encodeHtmlEntities((p.pl || {}).name || 'your tracks') +
      '</a>',
  );

  try {
    window.Whyd.tracking.log('Added track using button on openwhyd.org', p._id);
    if (p.pl && whydPost.postData.pl && whydPost.postData.pl.id == 'create')
      window.Whyd.tracking.log('Created playlist', p.pl.id);
  } catch (e) {
    console.trace('error');
  }

  if (window.location.href.indexOf('/playlist/create') != -1 && p.pl)
    goToPage(window.location.href.replace('/create', '/' + p.pl.id), p.pl.name);
  else loadTop();
}

function activateSubscribeButton($btn) {
  $btn
    .click(switchSubscription)
    .mouseenter(function () {
      if ($(this).hasClass('subscribed')) this.innerHTML = 'Unfollow';
    })
    .mouseleave(function () {
      if ($(this).hasClass('subscribed')) this.innerHTML = 'Following';
    });
}

function _createSubscribeButton(user, $li) {
  if (user.id) {
    if (window.user && window.user.id == user.id)
      $("<span class='userSubscribe'>This is you!</span>").appendTo($li);
    else
      activateSubscribeButton(
        $("<span class='userSubscribe'>")
          .attr('data-uid', user.id)
          .text(user.subscribed ? 'Following' : 'Follow')
          .toggleClass('subscribed', user.subscribed ? true : false)
          .appendTo($li),
      );
  }
}

function _renderUserInList(user, liHandler) {
  const $li = $('<li>')
    .append(
      $("<div class='thumb'>")
        .css(
          'background-image',
          "url('" +
            (user.img || '/img/u/' + user.id) +
            "?width=100&amp;height=100')",
        )
        .click(
          user.thumbClickHandler ||
            function () {
              $(this).parent().find('a.userLink').click();
            },
        ),
    )
    .append(
      $("<a class='userLink'>")
        .click(function () {
          $.modal.close();
        })
        .attr('href', user.url || '/u/' + user.id)
        .text(user.name),
    )
    .append($('<small>').text(user.bio))
    .addClass('user');
  (liHandler || _createSubscribeButton)(user, $li);
  return $li;
}

function _renderUserList(users, liHandler) {
  const $out = $('<ul>').addClass('userList');
  for (let i = 0; i < users.length; ++i)
    $out.append(_renderUserInList(users[i], liHandler));
  return $out.ajaxify ? $out.ajaxify() : $out;
}

function _showUserListDlg(users, title) {
  if (!users || users.length == 0) return;
  const plural = (users || []).length > 1;
  title = title.replace('(s)', plural ? 's' : '');
  openJqueryDialog(
    _renderUserList(users),
    'dlgUserList',
    (users || []).length + ' ' + title,
  );
}

const RE_MENTION = /@\[([^\]]*)\]\(user:([^)]*)\)/gi;

const regexUrl2 = /(\b(https?|ftp|file):\/\/([^/\s]*)[^\s]*)/gi;

function replaceURLWithHTMLLinks(text) {
  return String(text || '').replace(regexUrl2, "<a href='$1'>$3...</a>");
}

function _renderCommentText(str) {
  return replaceURLWithHTMLLinks(htmlEntities(str || ''))
    .replace(/\n\n/g, '\n')
    .replace(/\n/g, '<br/>')
    .replace(RE_MENTION, function (match, uNm, uId) {
      return '<a href="/u/' + uId + '">' + htmlEntities(uNm) + '</a>';
    });
}

function _commentDeleteHandler() {
  const $comment = $(this).closest('div[data-cid]');
  const $post = $comment.closest('.post');
  const $html = $(
    '<div><p>Do you want to permanently delete this comment?</p></div>' +
      '<span class="btnDelete greenButton">Delete</span>',
  );
  openJqueryDialog($html, 'dlgDeleteComment');
  $('.dlgDeleteComment .btnDelete').click(function () {
    avgrundClose();
    deleteComment($comment.attr('data-cid'), function () {
      updatePostStats($post);
    });
  });
}

function _renderComment(c) {
  let t = new Date();
  t = t.getHours() + ':' + t.getMinutes();
  const $com = $("<div class='comment' data-cid='" + c._id + "'>");
  $("<a class='author' href='/u/" + c.uId + "'>")
    .append("<span style='background-image:url(/img/u/" + c.uId + ");'>")
    .append($('<p>').text(c.uNm).append($("<span class='t'>").text(t)))
    .appendTo($com);
  $("<p class='text'>").html(_renderCommentText(c.text)).appendTo($com);
  $("<div class='delete'>").click(_commentDeleteHandler).appendTo($com);
  return $com.ajaxify ? $com.ajaxify() : $com;
}

function updatePostStats($post /*, $ext*/) {
  //var $ext = $post.find(".stats") || $ext ;

  const nbComments = $post.find('.comment').length;
  $post.find('.nbComments span').text(nbComments);
  const hasReposts = parseInt($post.find('.nbReposts span').text()) > 0;
  const hasLikes = parseInt($post.find('.nbLoves span').text()) > 0;
  const hasComments = $post.find('.comment').length > 0;

  // $ext.find(".stats").toggle(hasReposts || hasLikes);
  $post.find('.nbReposts').toggle(hasReposts);
  $post.find('.nbLoves').toggle(hasLikes);
  $post.find('.nbComments').toggle(hasComments);
}

function toggleComments(pId, toggle) {
  getPostById(pId, function ($post) {
    const $ext = $post
      .find('.ext')
      .toggleClass('hidden', toggle != undefined ? !toggle : undefined);
    if ($ext.hasClass('hidden')) return;
    if ($ext.ajaxify) $ext.ajaxify();
    // init comment input
    const $btn = $ext.find('input[type=submit]');
    const $textField = $ext.find('textarea').mentionsInput({
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
      onValueChange: function (text) {
        if ((text.trim ? text.trim() : text).length == 0)
          $btn.attr('disabled', 'disabled');
        else $btn.removeAttr('disabled');
      },
    });
    // init "post" button
    $ext
      .find('form')
      .unbind('submit')
      .submit(function (e) {
        e.preventDefault();
        $textField.mentionsInput('val', function (text) {
          if ((text.trim ? text.trim() : text).length == 0) return false;
          addComment(pId, text, function (c) {
            c = (c || {}).responseJSON || { error: 'null response' };
            if (c.error) showMessage('Error: ' + c.error, true);
            else {
              $textField.mentionsInput('reset'); //val("");
              $ext.find('.newComment').before(_renderComment(c[0] || c));
              updatePostStats($post, $ext);
            }
          });
        });
        return false;
      });
    // init counters
    updatePostStats($post, $ext);
    // init "show more" link
    if (!$ext.find('.showMore').length) {
      const $hidden = $ext.find('.comments > div.hidden');
      if ($hidden.length)
        $("<p class='showMore'>Show more comments</p>")
          .insertBefore($hidden.first())
          .click(function () {
            $hidden.removeClass('hidden');
            $(this).remove();
          })
          .prepend('<div>');
    }
    // init "delete" icons
    $ext.find('.delete').unbind('click').click(_commentDeleteHandler);
    // focus en comment input
    $ext.find('textarea').focus().click();
  });
}

window.showPostLovers = function (pId) {
  _fetchPostInfo(pId, 'lovers', function (users) {
    _showUserListDlg(users, 'People loved this track');
  });
};

window.showReposts = function (pId) {
  _fetchPostInfo(pId, 'reposts', function (users) {
    _showUserListDlg(users, 'People also added this track');
  });
};

window.showSubscribers = function (uid) {
  _fetchUserInfo(uid || window.pageUser.id, 'followers', function (users) {
    _showUserListDlg(users, 'Follower(s)');
  });
};

window.showSubscriptions = function (uid) {
  _fetchUserInfo(uid || window.pageUser.id, 'following', function (users) {
    _showUserListDlg(users, 'Following(s)');
  });
};

window.showEditProfileDlg = function () {
  openRemoteDialog('/html/dlgEditProfile.html', 'dlgEditProfile');
  $('.btnEditProfile').removeClass('active');
};

window.showEditProfileCoverDlg = function () {
  openRemoteDialog('/html/dlgEditProfileCover.html', 'dlgEditProfileCover');
  $('.btnEditProfile').removeClass('active');
};

window.dlgCreatePlaylist = function () {
  delete window.pagePlaylist;
  openRemoteDialog('/html/dlgEditPlaylist.html', 'dlgEditPlaylist');
};

window.dlgEditPlaylist = function () {
  openRemoteDialog(
    '/html/dlgEditPlaylist.html',
    'dlgEditPlaylist',
    function ($dlg) {
      //console.log("window.pagePlaylist", window.pagePlaylist);
      $dlg.find('h1').text('Edit playlist');
    },
  );
};

window.modalPostBox = function (/*onPosted*/) {
  alert('To add a track, use the search bar at the top of the page.');
};

function modalRepostBox(trackOrPid /*onPosted*/) {
  let url = '/post';
  const params = window.whydCtx ? ['ctx=' + window.whydCtx] : [];
  if (typeof trackOrPid == 'string') url += '/' + trackOrPid /*+'/add'*/;
  // ?pid='+pId; //postData.pId+'&embed='+postData.eId+'&text='+postData.text;
  else if (trackOrPid.eId)
    ['eId', 'title', 'img'].forEach(function (field) {
      params.push(field + '=' + encodeURIComponent(trackOrPid[field]));
    });
  openRemoteDialog(
    url + (params.length ? '?' + params.join('&') : ''),
    'dlgPostBox dlgRepostBox',
    function ($box) {
      $box.prepend('<h1>Add this track to your page</h1>');
      $box.find('#contentThumb').addClass('loading');
    },
  );
}

window.modalPostEditBox = function (pId /*, onPosted*/) {
  const url = '/post/' + pId + '/edit';
  openRemoteDialog(url, 'dlgPostBox dlgRepostBox', function ($box) {
    $box.prepend('<h1>Edit this track</h1>');
    $box.find('#contentThumb').addClass('loading');
  });
};

/* notifs */

let lastNotifData = null;
let $notifPanel = $('#notifPanel');
let $notifIcon = $('#notifIcon');

const refreshNotifCounter = function () {
  const notifs = lastNotifData;
  let total = 0;
  for (const i in notifs) total += notifs[i].n || 1;
  $notifIcon.text(total);
  $notifIcon.removeClass('someNotif');
  if (total == 0) $notifPanel.hide();
  else $notifIcon.addClass('someNotif');
};

const fetchNotifs = function () {
  $.ajax({
    type: 'GET',
    url: '/api/notif',
    dataType: 'json',
    cache: false,
    success: function (notifs) {
      lastNotifData = notifs;
      refreshNotifCounter();
    },
  });
};

const renderNotif = function (notif) {
  let content, href;
  if (notif.pId.indexOf('/reposts') > -1) {
    href = '/c/' + notif.pId.replace('/reposts', '');
    content =
      '<span>' +
      encodeHtmlEntities(notif.lastAuthor.name) +
      (notif.n > 1 ? ' + ' + (notif.n - 1) + ' other people' : '') +
      '</span> reposted your track <span>' +
      encodeHtmlEntities(notif.track.name) +
      '</span>';
  } else if (notif.pId.indexOf('/loves') > -1) {
    href = '/c/' + notif.pId.replace('/loves', '');
    content =
      '<span>' +
      encodeHtmlEntities(notif.lastAuthor.name) +
      (notif.n > 1 ? ' + ' + (notif.n - 1) + ' other people' : '') +
      '</span> loved your track <span>' +
      encodeHtmlEntities(notif.track.name) +
      '</span>';
  } else if (notif.html) {
    href = notif.href;
    content = notif.html;
  } else {
    href = notif.pId; // actually leads to the user's profile
    content =
      '<span>' +
      encodeHtmlEntities(notif.track.name) +
      '</span> subscribed to your stream!';
  }
  let imgId;
  if (notif.lastAuthor.id) imgId = '/u/' + notif.lastAuthor.id;
  else if ((notif.pId || '').indexOf('/') == 0) imgId = notif.pId;
  else imgId = '/u/' + notif.pId.split('/')[0];
  return (
    '<li data-pid="' +
    notif.pId +
    '" >' +
    '<div class="img" style="background-image:url(' +
    (notif.img || '/img' + imgId) +
    ');"></div>' +
    '<div class="remove" onclick="clearNotif(\'' +
    notif.pId +
    '\')"></div>' + // remove
    '<a onclick="openNotif(\'' +
    notif.pId +
    '\')" href="' +
    href +
    '">' +
    content +
    '</a></li>'
  );
};

const refreshNotifPanel = function () {
  let content =
    '<div onclick="clearNotifs();">Clear all</div>' +
    '<p>Your notifications</p><ul>';
  const notifs = lastNotifData;
  for (const i in notifs) content += renderNotif(notifs[i]);
  $notifPanel.html(content + '</ul>').ajaxify();
};

window.clearNotif = function (pId) {
  $.ajax({
    type: 'POST',
    url: '/api/notif',
    data: { action: 'delete', pId: pId },
    complete: fetchNotifs,
  });
  $('#notifPanel li').each(function () {
    if ($(this).attr('data-pid') == pId) $(this).remove();
  });
};

window.clearNotifs = function () {
  $.ajax({
    type: 'POST',
    url: '/api/notif',
    data: { action: 'deleteAll' },
    complete: fetchNotifs,
  });
  $notifPanel.hide();
};

window.openNotif = function (/*pId*/) {
  $notifPanel.hide();
  //clearNotif(pId);
};

/* bio update */

window.submitBio = function () {
  const bio = $('.bio');
  bio.parent().addClass('submitting');
  $.ajax({
    type: 'GET',
    url: '/api/user',
    data: { bio: bio.val() },
    complete: function (/*data*/) {
      setTimeout(function () {
        bio.parent().removeClass('submitting');
      }, 500);
    },
  });
};

/* share dialog */

window.sharePost = function (pId) {
  getPostById(pId, function ($post) {
    let post = extractPostData(
      $post /*, {uId:window.pageTopic.mid, uNm:window.pageTopic.name}*/,
    );
    console.log('post data', post);
    const $btn = $post.find('.btns > .btnShare');
    $btn.addClass('active');
    const offset = $btn.offset();
    //$(".sharePopin").remove();
    const postUrl =
      window.location.href.substr(0, window.location.href.indexOf('/', 10)) +
      '/c/' +
      post.id;
    window.onDialogClose = function () {
      $btn.removeClass('active');
      delete window.onDialogClose;
    };
    const TEMPLATE = [
      '<div id="sharepopin-overlay"></div>',
      '<div id="sharePopin">',
      '<div class="pointe"></div>',
      '<div class="sharing">',
      '<iframe class="twitter-share-button twitter-count-horizontal" src="//platform.twitter.com/widgets/tweet_button.1347008535.html#_=1347354227175&amp;count=horizontal&amp;id=twitter-widget-0&amp;lang=en&amp;size=m&amp;text=' +
        encodeURIComponent('♫ ' + post.name /*+ " " + postUrl*/) +
        '&amp;url=' +
        encodeURIComponent(postUrl) +
        '&amp;via=open_whyd&amp;original_referer=' +
        encodeURIComponent(window.location.href) +
        '" title="Twitter Tweet Button" data-twttr-rendered="true" allowtransparency="true" frameborder="0" scrolling="no"></iframe>',
      '<iframe class="fblikeBtn" src="//www.facebook.com/plugins/like.php?href=' +
        encodeURIComponent(postUrl) +
        '&amp;layout=button_count&amp;show_faces=false&amp;width=100&amp;action=like&amp;font&amp;colorscheme=light&amp;height=21&amp;appId=169250156435902" scrolling="no" frameborder="0" allowTransparency="true"></iframe>',
      '</div>',
      '<p>Permalink</p>',
      '<input type="text" value="' +
        postUrl +
        '" readonly="readonly" onclick="this.focus();this.select();(this.innerText.createTextRange()).execCommand(\'Copy\');"></input>',
      '</div>',
    ].join('\n');

    if ($('#sharePopin').length > 0) {
      $('#sharePopin').remove();
      $('#sharepopin-overlay').remove();
    } else {
      const container = $($btn).parent().parent();
      const share = $(TEMPLATE);
      $(container).append(share);
      offset.top += 25;
      offset.left -= 30;
      $('#sharePopin').offset(offset);
      $('#sharepopin-overlay').width($('body').width());
      $('#sharepopin-overlay').height($('body').height());
      $('#sharepopin-overlay').bind('click', function () {
        $('#sharePopin').remove();
        $('#sharepopin-overlay').remove();
      });
    }

    try {
      post = extractPostData($post);
      window.Whyd.tracking.log('Clicked share button', post.id);
    } catch (e) {
      console.trace('error', e);
    }
  });
};

/* repost dialog */

window.publishPost = function (pId) {
  if (!window.user || !window.user.id) return login();
  modalRepostBox(pId, onNewPost); //onRepostComplete
};

/* main init */

window.makeUrl = function (getParamsObj) {
  let wlh = window.getCurrentUrl
    ? window.getCurrentUrl()
    : window.location.href;
  wlh = wlh.split('#')[0];
  const hasParams = wlh.indexOf('?') > -1;
  /*
  if (hasParams && wlh.indexOf("#") > -1 && wlh.indexOf("_suid") > -1) { // finds canonical url from ajax/hash-based urls (e.g. in IE9)
    wlh = wlh.substr(0, wlh.indexOf("/", 10)) + "/" + wlh.split("#").pop().split("?")[0];
    hasParams = false;
  }
  */
  if (getParamsObj) {
    wlh += hasParams ? '&' : '?';
    const p = [];
    for (const i in getParamsObj)
      p.push(encodeURIComponent(i) + '=' + encodeURIComponent(getParamsObj[i]));
    wlh += p.join('&');
  }
  return wlh;
};

function onPageLoad() {
  const $body = $('body');
  if ($body.hasClass('pgPost'))
    toggleComments($('.post').first().attr('data-pid'), true);
}

$(document).ready(function () {
  const keyShortcuts = {
    32: function () {
      // space: play/pause
      window.whydPlayer.playPause();
    },
    102: function () {
      // F: toggle fullscreen for videos
      window.whydPlayer.toggleFullscreen();
    },
    110: function () {
      // N: switch to next track
      window.whydPlayer.next();
    },
    112: function () {
      // P: switch to prev track
      window.whydPlayer.prev();
    },
  };

  const keyUpShortcuts = {
    27: function () {
      // escape: disable fullscreen mode
      window.whydPlayer.toggleFullscreen(false);
    },
    37: function () {
      // left arrow => previous (playlist) page
      if (window.prevPageInList) goToPage(window.prevPageInList);
    },
    39: function () {
      // right arrow => next (playlist) page
      if (window.nextPageInList) goToPage(window.nextPageInList);
    },
  };

  $(document).keypress(function (e) {
    if (
      e.target &&
      e.target.tagName != 'INPUT' &&
      e.target.tagName != 'TEXTAREA' &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      keyShortcuts[e.which]
    ) {
      e.preventDefault();
      keyShortcuts[e.which]();
    }
  });

  $(document).keyup(function (e) {
    if (
      e.target &&
      e.target.tagName != 'INPUT' &&
      e.target.tagName != 'TEXTAREA' &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      keyUpShortcuts[e.which]
    ) {
      console.log('shortcut', e.which);
      e.preventDefault();
      keyUpShortcuts[e.which]();
    }
  });

  // init notifications

  const notifUpdateInterval = 20000;
  $notifPanel = $('#notifPanel');
  $notifIcon = $('#notifIcon');

  window.setInterval(fetchNotifs, notifUpdateInterval);
  fetchNotifs();

  $notifIcon.click(function () {
    if ($(this).text() == 0) return $notifPanel.hide();
    refreshNotifPanel();
    $notifPanel.toggle();
  });

  // init search bar

  const noResultsYet = function (q) {
    return /*$(*/ [
      '<ul class="showAllResults loading">',
      '<li><a href="/search?q=' +
        encodeURIComponent(q) +
        '" target="_blank">Show all results...</a></li>',
      '</ul>',
    ].join('\n') /*).ajaxify()[0]*/;
  };

  window.quickSearch =
    window.quickSearch ||
    new QuickSearch($('#searchBar'), {
      noMoreResultsOnEnter: true,
      submitQuery: function (query, display) {
        // called a short delay after when a query was entered
        // display(htmlResults, stillSearch) is to be called when new results are found
        display(noResultsYet(query), true); // clear the result list and keep the searching animation rolling
        function renderTrack(track) {
          return (
            '<li>' +
            '<a href="' +
            track.url +
            '" onclick="window.goToPage(\'' +
            (track.eId || track.id).split('#')[0] +
            '\');return false;" target="_blank">' +
            '<div style="background-image:url(\'' +
            track.img +
            '\');"></div>' +
            htmlEntities(track.name) +
            '</a>' +
            '</li>'
          );
          // TODO: link to non-posted track page, instead of source url
        }
        function prependExternalTracks(tracks, resultsHtml) {
          return !tracks.length
            ? resultsHtml || ''
            : (resultsHtml || '</ul>').replace(
                '</ul>',
                '</ul>' +
                  "<ul class='resultCategory'>" +
                  '<div>Tracks</div>' +
                  tracks.map(renderTrack).join('\n') +
                  '</ul>',
              );
        }
        if (/^https?:\/\//.test(query))
          whydPlayer.fetchTrackByUrl(query, function (track) {
            console.log('detected track by url:', track);
            track = track || {};
            track.name = track.name || track.title;
            display(
              track.eId
                ? prependExternalTracks([track])
                : '<div class="noResults">' +
                    "<p>Sorry, we don't recognize this URL...</p>" +
                    '<p>We currently support URLs from Youtube, Soundcloud and Vimeo.</p>' +
                    '<p>Please install and try <a href="/button">our "Add Track" button</a> from that page.</p>' +
                    '</div>',
              false,
            );
            // TODO: send this URL back to whyd/playemJS team
          });
        else {
          submitSearchQuery(
            { q: query, format: 'html', context: 'header' },
            function (resultsHtml) {
              // Handle error response
              if (resultsHtml && typeof resultsHtml === 'object' && resultsHtml.error) {
                console.error('Search error:', resultsHtml.error);
                // Show "Show all results..." without loading animation
                const errorResultsHtml = noResultsYet(query).replace(' loading', '');
                display(errorResultsHtml, false); // Stop loading animation on error
                return;
              }
              
              resultsHtml =
                (resultsHtml &&
                  typeof resultsHtml === 'string' &&
                  resultsHtml) ||
                '';
              const foundTracks =
                resultsHtml.indexOf('<div>Tracks</div>') != -1;
              display(resultsHtml, !foundTracks); // stop the searching animation only if tracks were found
              if (!foundTracks) {
                const externalTracks = [];
                window.searchExternalTracks(query, function (track) {
                  if (track) {
                    track.name = track.title;
                    externalTracks.push(track);
                  } else
                    display(
                      prependExternalTracks(
                        externalTracks.slice(0, 2),
                        resultsHtml,
                      ),
                      false,
                    );
                });
              }
            },
          );
        }
      },
      onResultClick: function (href, a) {
        if (!a.onclick) window.goToPage(href);
        return false;
      },
    });

  // init other stuff...

  onPageLoad();
});

// AJAXIFY https://gist.github.com/854622
(function (window /*, undefined*/) {
  // Prepare our Variables
  const $ = window.jQuery,
    document = window.document;

  // Wait for Document
  $(function () {
    // Prepare Variables
    const /* Application Specific Variables */
      contentSelector = /*#contentPane*/ '#mainPanel', //'#content,article:first,.article:first,.post:first',
      $menu = $('#menu,#nav,nav:first,.nav:first').filter(':first'),
      activeClass = 'active selected current youarehere',
      activeSelector = '.active,.selected,.current,.youarehere',
      menuChildrenSelector = '> li,> ul > li',
      /* Application Generic Variables */
      $body = $(document.body) /*.find(contentSelector).first()*/,
      rootUrl = window.location.origin;
    let newState = false; // HACK to restore scroll position on previous page of history

    let $content = $(contentSelector).filter(':first');
    const contentNode = $content.get(0);

    // Ensure Content
    if ($content.length === 0) {
      $content = $body;
    }

    // Internal Helper
    $.expr[':'].internal = function (obj /*, index, meta, stack*/) {
      // Prepare
      const $this = $(obj);
      const url = $this.attr('href') || '';
      const isInternalLink =
        url.substring(0, rootUrl.length) === rootUrl || url.indexOf(':') === -1;

      // Ignore or Keep
      return isInternalLink;
    };

    // HTML Helper
    const documentHtml = function (html) {
      // Prepare
      const result = String(html)
        .replace(/<!DOCTYPE[^>]*>/i, '')
        .replace(
          /<(html|head|body|title|meta|script)([\s>])/gi,
          '<div class="document-$1"$2',
        )
        .replace(/<\/(html|head|body|title|meta|script)>/gi, '</div>');

      // Return
      return result;
    };

    // Ajaxify Helper
    $.fn.ajaxify = function () {
      // Prepare
      const $this = $(this);

      // Ajaxify
      $this.find('a:internal:not(.no-ajaxy)').click(function (event) {
        // Prepare
        const $this = $(this),
          url = $this.attr('href'),
          title = $this.attr('title') || null;

        newState = true;
        //url = decodeURIComponent(url); // fix for non-latin characters

        const noProtocol = (url || '').split('//').pop();
        const isLocal =
          noProtocol.charAt(0) == '/' || noProtocol.indexOf(urlDomain) == 0;

        // Continue as normal for cmd clicks etc
        if (!isLocal || event.which == 2 || event.metaKey) {
          return true;
        }

        goToPage(url, title, { streamToTop: true });
        event.preventDefault();
        return false;
      });

      // Chain
      return $this;
    };

    // Ajaxify our Internal Links
    $body.ajaxify();

    function loadPage({ url }) {
      const relativeUrl = url.replace(rootUrl, '');

      window.getCurrentUrl = function () {
        return url;
      };

      // Loading animation
      $body.addClass('loading');
      $content.animate({ opacity: 0.6 }, 300);

      if (window.onPageLeave) {
        window.onPageLeave();
        window.onPageLeave = null;
        delete window.onPageLeave;
      }

      $('div.tipsy').remove(); // bug fix: make sure to remove tooltips on ajax page change

      // Ajax Request the Traditional Page
      $.ajax({
        url: url,
        success: function (data) {
          // Prepare
          const $data = $(documentHtml(data)),
            $dataHead = $data.find('.document-head:first'),
            $dataBody = $data.find('.document-body:first'),
            $dataContent = $dataBody.find(contentSelector).filter(':first');

          // Fetch the scripts
          const $scripts = $dataContent.find('.document-script');
          if ($scripts.length) {
            $scripts.detach();
          }

          // Fetch the content
          const contentHtml = $dataContent.html(); /*||$data.html()*/
          if (!contentHtml) {
            document.location.href = url;
            return false;
          }

          // Update the menu
          let $menuChildren;
          $menuChildren = $menu.find(menuChildrenSelector);
          $menuChildren.filter(activeSelector).removeClass(activeClass);
          $menuChildren = $menuChildren.has(
            'a[href^="' +
              relativeUrl +
              '"],a[href^="/' +
              relativeUrl +
              '"],a[href^="' +
              url +
              '"]',
          );
          if ($menuChildren.length === 1) {
            $menuChildren.addClass(activeClass);
          }

          // Update the content
          $content.stop(true, true);
          $content
            .html(contentHtml)
            .ajaxify()
            .css('opacity', 100)
            .show(); /* you could fade in here if you'd like */

          // Update the title
          document.title = $data.find('.document-title:first').text();
          try {
            document.getElementsByTagName('title')[0].innerHTML = _.escape(
              document.title,
            ); // use underscore.js to encode html entities
          } catch (err) {
            console.trace(err);
          }

          // Add the scripts
          $scripts.each(function () {
            const $script = $(this),
              src = $script.attr('src'),
              scriptNode = document.createElement('script');
            if (src) scriptNode.src = src;
            else
              scriptNode.appendChild(
                document.createTextNode(/*$script.text()*/ this.innerHTML),
              );
            contentNode.appendChild(scriptNode);
          });

          // Update CSS code
          const currentLinks = {};
          let anonCounter = 0;
          $('link').each(function () {
            const src = $(this).attr('href');
            if (src.indexOf('static.olark.com/css') == -1)
              currentLinks[src || anonCounter++] = $(this);
          });
          $dataHead.find('link').each(function () {
            const src = $(this).attr('href');
            if (currentLinks[src]) {
              //console.log("skip link: ", src, $(this));
              delete currentLinks[src];
            } else {
              //console.log("add link: ", src, $(this));
              $('head').append($(this));
            }
          });
          for (const i in currentLinks) {
            //console.log("remove link: ", i, currentLinks[i]);
            currentLinks[i].remove();
          }

          $body.removeClass('loading');

          try {
            // update the body class
            $('body').attr(
              'class',
              data.split('<body')[1].split('class=')[1].split(/["']/)[1],
            );
            // re-position the player
            window.whydPlayer.refresh();
            // hide search results and query (when not on search results page)
            $('#searchResults').hide();
            if (window.quickSearch && url.indexOf('search?q=') == -1)
              window.quickSearch.clear(); //$("#q").val("");
            // final page init
            initWhydTooltips('#contentPane *[title]');
            onPageLoad();
            // inform analytics
            window.Whyd.tracking.sendPageview();
          } catch (e) {
            console.trace(e);
          }
          if (newState) {
            window.scrollTo(0, 0);
            newState = false;
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.trace(errorThrown);
          setTimeout(function () {
            document.location.href = url;
          }, 300);
          return false;
        },
      }); // end ajax
    }

    // Hook into State Changes
    window.addEventListener('popstate', (event) => {
      // Note: properties like window.location will already reflect the state change (if it affected the current URL),
      // but document might still not.
      // => to catch the moment when the new document state is already fully in place, use a zero-delay setTimeout().
      // cf https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event#the_history_stack
      setTimeout(
        () =>
          loadPage(
            event.state ?? history.state ?? { url: document.location.href },
          ),
        0,
      );
    });

    window.goToPage = function (url, title, opts) {
      if (window.location.href === url) loadPage({ url });
      else {
        // fix mp3/audiofile track URLs (which eId/path contain an HTTP URL => not accepted as-is by router)
        let httpPos = url.substring(4).search(/https?:\/\//); // 4 because it could be a relative URL prefixed by /fi/
        if (httpPos != -1) {
          httpPos += 4;
          url =
            url.substring(0, httpPos) +
            encodeURIComponent(url.substring(httpPos));
        }
        window.history.pushState({ ...opts, url }, title, url); // does not trigger popstate
        loadPage({ url });
      }
    };
  }); // end onDomLoad
})(window); // end closure

$.ajaxSetup({
  cache: false,
});

var initWhydTooltips = (function () {
  function showTip() {
    $(this).tipsy('show');
  }
  function hideTip() {
    //$('div.tipsy').remove();
    //$.fn.tipsy.revalidate();
    $(this).tipsy('hide');
  }
  return function (selector, p) {
    $(selector)
      .tipsy({ trigger: 'manual', gravity: (p || {}).gravity })
      .on('mouseenter', showTip)
      .on('click mouseleave', hideTip);
  };
})();

initWhydTooltips('#whydPlayer *[title]', { gravity: 's' });
initWhydTooltips('#contentPane *[title]');

$("<div id='pageLoader'></div>").appendTo('body');

//sort playlists
window.sortPlaylists = function (sortType) {
  const playlistsContainer = document.querySelector('#playlists');
  const allPlaylists = playlistsContainer.querySelectorAll('.playlist');
  const playlistsFragment = document.createDocumentFragment();
  const allPlaylistsObject = {};
  let sortedPlaylistObjectKeys = [];

  if (allPlaylists.length > 2) {
    allPlaylists.forEach((playlist, index) => {
      if (playlist.dataset.playlistname) {
        //store playlist name in a variable and add index to create a unique key in allPlaylistsObject
        const playlistNameKey =
          playlist.dataset.playlistname.toLowerCase() + index;

        if (!playlist.dataset.index) {
          playlist.setAttribute('data-index', index);
        }

        if (sortType === 'alphabetize') {
          allPlaylistsObject[playlistNameKey] = playlist;
        } else if (sortType === 'date') {
          allPlaylistsObject[playlist.dataset.index] = playlist;
        }
      } else {
        playlistsFragment.appendChild(playlist);
      }
    });

    playlistsContainer.innerHTML = '';

    if (sortType === 'date') {
      sortedPlaylistObjectKeys = Object.keys(allPlaylistsObject).sort(
        //if sorting by date first convert index key string to a number with '+' then compare to sort in ascending order.
        function (firstPlaylistIndex, secondPlaylistIndex) {
          return +firstPlaylistIndex - +secondPlaylistIndex;
        },
      );
    } else {
      sortedPlaylistObjectKeys = Object.keys(allPlaylistsObject).sort();
    }

    sortedPlaylistObjectKeys.forEach((playlist) =>
      playlistsFragment.appendChild(allPlaylistsObject[playlist]),
    );

    playlistsContainer.appendChild(playlistsFragment);
  }
};
