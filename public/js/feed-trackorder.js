/* global $ */

const init = function () {
  console.log('trackorder init');

  $('.posts').disableSelection().sortable({
    placeholder: 'postDropZone',
  });

  function submitTrackOrder(plId, order, cb) {
    $.ajax({
      type: 'POST',
      url: '/api/playlist',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        action: 'setOrder',
        id: plId,
        order: order,
      }),
      success: function (res) {
        cb(res);
      },
      error: function () {
        cb();
      },
    });
  }

  $('#playlistTrackOrderSubmit').click(function () {
    const order = [];
    $('.post').each(function () {
      order.push($(this).attr('data-pid'));
    });
    submitTrackOrder(plId, order, function (res) {
      if (!res || res.error) {
        showMessage('Something went wrong... Please excuse us and try again!');
        console.log('error', res);
      } else goToPage('/u/' + uId + '/playlist/' + plId);
    });
  });
};

$(function () {
  var interval = setInterval(function () {
    console.log('jquery ui loading ready?', !!$.fn.disableSelection);
    if ($.fn.disableSelection) {
      init();
      clearInterval(interval);
    }
  }, 500);
});
