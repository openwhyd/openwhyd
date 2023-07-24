/* global $, chrome */

(function () {
  console.log('rendering "bookmarklet" page from onboarding process');

  function toggleMode(e) {
    e && e.preventDefault();
    $('.modeBk, .modeExt').toggle();
    return false;
  }

  function moveTo(id, scrollTime) {
    $('html, body').animate(
      {
        scrollTop: $(id).offset().top,
      },
      scrollTime,
    );
  }

  $('.step1').click(function () {
    $(this).fadeOut(300, function () {
      $('.howToUseButtonNormal').height(542);
      $('.indication1').fadeIn(300, function () {
        $('.indication2').fadeIn(300);
      });
    });
    return false;
  });

  $('#linkToInstall').click(function () {
    moveTo('#installTest', 1000);
  });

  $('.toggleMode').click(toggleMode);

  // NB: this only works when run from openwhyd.org (verified domain for the chrome extension)
  if (
    $.browser.chrome &&
    parseInt(('' + $.browser.version).split('.')[0]) >= 15
  ) {
    $('#btnInstallChromeExt').click(function (e) {
      console.log('trying to install chrome extension', e.target.href);
      chrome.webstore.install(
        e.target.href,
        function () {}, // eslint-disable-line @typescript-eslint/no-empty-function
        function () {
          console.log('failed => opening chrome web store in a new tab...');
          //goToPage(e.href);
          window.open(e.target.href, '_blank').focus();
        },
      );
      return false;
    });
    //toggleMode();
    $('.modeExt').show();
  } else $('.modeBk').show();

  // adapt instructions to web browser in use
  $('li.instr').hide();
  var b = ['Opera', 'MSIE 8.', 'MSIE', 'Chrome', 'Safari', 'Firefox'];
  for (let i in b)
    if (navigator.userAgent.indexOf(b[i]) != -1) {
      $('.instr.' + b[i].toLowerCase().replace(/[^a-z0-9]+/g, '')).show();
      $('.browserIcon').attr('class', 'browserIcon ' + b[i].toLowerCase());
      break;
    }
})();
