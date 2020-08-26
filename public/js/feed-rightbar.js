/* global $, showMessage */

/* === bookmarklet ad == */

(function initBookmarkletAd() {
  $('#bookmarkletAd .postRemove').click(function () {
    $.ajax({
      type: 'POST',
      url: '/api/user',
      data: { pref: { hideBkAd: 1 } },
      success: function (res) {
        $('#bookmarkletAd').animate({ height: 0 }, function () {
          $(this).remove();
        });
      },
      error: function (e) {
        showMessage(e);
      },
    });
  });
})();

/* === invite by email === */

(function initEmailInvite() {
  var $inviteEmail = $('.inviteAd .fld');
  var $inviteSubmit = $('.inviteAd input[type=submit]');
  var emailCheck = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

  $inviteEmail
    .find('input')
    .bind('click keydown', function () /*backtonormal*/ {
      $(this).parent().removeClass('error').removeClass('valid');
    })
    .blur(function () /*validateEmail*/ {
      var val = $(this).val();
      if (val == '') return 0;
      var valid = emailCheck.test(val);
      $inviteEmail.addClass(valid ? 'valid' : 'error');
      return valid ? 1 : -10;
    });
  /*click(backtonormal).keydown(backtonormal);*/

  var $form = $('.inviteAd').submit(function (event) {
    event.preventDefault();
    $form.addClass('sending');
    $.ajax({
      type: 'POST',
      url: '/invite',
      data: $form.serialize(),
      success: function (res) {
        console.log('res', res);
        var sent = res && res.ok && res.email;
        if (sent) $('.valid').addClass('sent');
        $form.removeClass('sending');
        showMessage(
          sent
            ? 'Invitation is on its way to ' + res.email + '! Thank you!'
            : 'Invitation was not send. Please check that the email address is valid',
          !sent
        );
      },
      error: function () {
        $form.removeClass('sending');
      },
    });
  });

  $(document).ready(function () {
    $inviteEmail.placeholder();
  });
})();

/* === suggested users === */

function clearSuggestedUser(elt) {
  $(elt)
    .css({ overflow: 'hidden' })
    .animate({ height: '0px', opacity: '0' }, function () {
      $(this).remove();
    });
}
var subscribeTimer = null;
function subscribeToUserAndClear(elt) {
  var $li = $(elt); /*.closest("li[data-uid]");*/
  var $link = $li.find('.subscribe');
  if ($link.html() == 'Follow') {
    $link.html('Unfollow');
    subscribeTimer = setTimeout(function () {
      subscribeTimer = null;
      subscribeToUser($li.attr('data-uid'), function () {
        clearSuggestedUser(elt);
      });
    }, 2000);
  } else {
    $link.html('Follow');
    if (subscribeTimer) {
      clearTimeout(subscribeTimer);
      subscribeTimer = null;
    }
  }
}

/* === city page ad == */

(function initIphoneAppAd() {
  var COOKIE_DEF = 'whydIosAppAd=0',
    COOKIE_EXP = 365 * 24 * 60 * 60 * 1000; // 1 year
  // display date: Mon Jun 23 2014 16:10:29 GMT+0200 (CEST)
  var display =
    Date.now() > 1403532629547 &&
    (document.cookie || '').indexOf(COOKIE_DEF) == -1;
  if (display) {
    var $box = $('#iphoneAppAd').show();
    $box.find('.postRemove').click(function () {
      document.cookie =
        COOKIE_DEF +
        '; expires=' +
        new Date(Date.now() + COOKIE_EXP).toGMTString();
      $box.animate({ height: 0 }, function () {
        $(this).remove();
      });
    });
  }
})();
