/* global $, showMessage */

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
