/* global $ */

// prevents bug in firefox 3
if (undefined == window.console) window.console = { log: function () {} }; // eslint-disable-line @typescript-eslint/no-empty-function

// === Popup dialogs / video overlays ===

function openHtmlDialog(html) {
  // Open Avgrund modal
  $(document).avgrund({
    openOnEvent: false,
    width: 560,
    height: 315,
    responsive: true,
    //holderClass: 'custom',
    showClose: true,
    showCloseText: 'close',
    //onBlurContainer: '#contentPane',
    enableStackAnimation: true,
    template: html,
    onLoad: function () {
      console.log('Avgrund loaded!');
    },
    onReady: function () {
      console.log('Avgrund ready!');
      overflowPopin();
    },
    onUnload: function () {
      console.log('Avgrund closed!');
      console.log('closing dialog, handler:', !!window.onDialogClose);
      window.onDialogClose && window.onDialogClose();
    },
  });
}

function overflowPopin() {
  var avgrund = $('.avgrund-popin');
  var child = $('.avgrund-popin').children().eq(1);

  if (child.innerHeight() > avgrund.height()) {
    avgrund.css('overflow-y', 'scroll');
    avgrund.css('overflow-x', 'hidden');
  } else {
    avgrund.css('overflow', 'hidden');
  }
}

function openJqueryDialog($element, dlgClass, title) {
  var dlg = $('<div>')
    .attr('class', 'dlg ' + (dlgClass || ''))
    .append($element);
  if (title) dlg.prepend('<h1>' + title + '</h1>');
  openHtmlDialog(dlg);
}

window.openRemoteDialog = function (url, dlgClass, callback) {
  openJqueryDialog('', (dlgClass || '') + ' loading');

  $.ajax({
    type: 'GET',
    url: url,
    complete: function (data) {
      var $ajaxFrame = $('.dlg');
      $ajaxFrame.html(data.responseText).ready(function () {
        //$(this).find("a").click(function(){$.modal.close();});
        $ajaxFrame.removeClass('loading');
        if (callback) callback($ajaxFrame);
      });
    },
  });
};

window.showMessage = function (txt, isError) {
  if (txt && typeof txt === 'object') {
    isError = isError || txt.error;
    txt = txt.error || txt.message || txt.result || txt;
  }
  $('#whydMessageContainer').remove();
  var $container = $(
    '<div id="whydMessageContainer" class="' +
      (isError ? 'error' : '') +
      '"><div>' +
      txt +
      '</div></div>',
  );
  $container.css('zIndex', 1002);
  $('body').append($container);
  function disappear() {
    $container.animate(
      { height: '0px' },
      300 /*, function(){ $(this).hide(); }*/,
    ); //.fadeOut();
  }
  $container
    .click(disappear)
    ./*css("max-height", 0).show().*/ animate({ height: '38px' }, 400);
  setTimeout(disappear, 4000);
  try {
    if ($.fn.ajaxify) $('body').ajaxify();
  } catch (e) {
    console.log(e, e.stack);
  }
};

// for WhydCanvas app, when embedded in a Facebook page tab
function adaptToWindowSize() {
  $('body').toggleClass('fbIframe', $(window).width() < 820);
}

$(window).resize(adaptToWindowSize);
$(adaptToWindowSize);
