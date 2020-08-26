/* global $ */

function WhydImgUpload(options) {
  options = options || {};
  options.onError = options.onError || console.log;

  var lastAvatarUrl = null,
    lastUploadUrl = null;
  var $dlg = options.holder;
  var $boxes = options.$boxes || $dlg.find('.uploadBox');
  var $img = $dlg.find('.dlgImgPane > img');
  var $input = $dlg.find('input[type=file]');
  var $avatarForm = $input.closest('form');
  var uploadUrl = options.url || $avatarForm.attr('action');
  var defaultImgUrl = options.defaultImgUrl || '/images/blank_user.gif';

  var self = this;

  this.activate = function () {
    console.log('legacy upload activation');
    $boxes.hide();
    $avatarForm.show();
  };

  this.getImgUrl = function () {
    console.log('lastAvatarUrl', lastAvatarUrl);
    lastUploadUrl = null; // prevent file from being deleted
    return lastAvatarUrl;
  };

  this.dispose = function () {
    // deleteTempAvatar()
    if (lastUploadUrl)
      $.ajax({
        type: 'POST',
        url: uploadUrl,
        data: {
          action: 'delete',
          id: lastUploadUrl.split('/').pop(),
        },
      });
    lastUploadUrl = null;
  };

  function setAvatar(url) {
    if (!url || typeof url != 'string') url = defaultImgUrl;
    $img.attr('src', url);
    lastAvatarUrl = url;
    $dlg.removeClass('loading');
  }

  $dlg.find('.dlgImgPane > span').click(setAvatar);

  function onImageUpload() {
    options.onImageUpload && options.onImageUpload();
    self.dispose(); //deleteTempAvatar();
    $dlg.addClass('loading');
  }

  function onImageUploadComplete(data) {
    lastAvatarUrl = null;
    console.log('received', data);
    if (typeof data == 'string') {
      if (data.indexOf('{') == -1 && data.toLowerCase().indexOf('too large'))
        data = {
          error: 'Your file is too large. Please resize it and try again.',
        };
      else
        data = JSON.parse(
          data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1)
        );
    }
    try {
      var img = data.postImg || data.file;
      lastUploadUrl = (img.path[0] != '/' ? '/' : '') + img.path;
      if (img.mime && img.mime.indexOf('image/') == 0) {
        lastAvatarUrl = lastUploadUrl;
        options.onImageUploadComplete &&
          options.onImageUploadComplete(lastAvatarUrl);
      } else options.onError('Invalid image. Please try with another image!');
    } catch (e) {
      options.onError(
        data.error || 'Upload did not work... Please try again!',
        e
      );
    }
    setAvatar(lastAvatarUrl);
  }

  // LEGACY IMAGE UPLOAD FORM

  $avatarForm.iframePostForm({
    post: onImageUpload,
    complete: onImageUploadComplete,
  });

  $input.change(function () {
    $avatarForm.submit();
  });

  // HTML5 UPLOAD FORM

  if (DndUpload) {
    console.log('this browser accepts drag&drop uploads :-)');
    var destination;
    var $avatarDrop = $dlg.find('#avatarDrop');
    var $progress = $dlg.find('.progress');
    var $progressLevel = $progress.find('div');
    this.activate = function () {
      console.log('html5 upload activation');
      $boxes.hide();
      $avatarDrop.show();
    };
    $avatarDrop.find('button').click(function () {
      $input.click();
    });
    $avatarDrop.on('dragenter', function (e) {
      destination = event.target;
      $(this).addClass('hover');
    });
    $avatarDrop.on('dragleave', function (e) {
      if (
        !$(this).find(destination).size() &&
        !$(this).find(event.target).size()
      )
        $(this).removeClass('hover');
    });
    var handlers = {
      error: function (eventData) {
        $boxes.hide();
        $avatarForm.show();
        $progress.hide();
      },
      post: function (eventData) {
        onImageUpload();
        $progressLevel.css('width', '0px');
        $progress.show();
      },
      progress: function (eventData) {
        $progressLevel.css('width', ((eventData * 100) | 0) + 'px');
      },
      complete: function (eventData) {
        $progress.hide();
        onImageUploadComplete(eventData);
      },
    };
    var dndUpload = new DndUpload({
      form: $avatarForm[0],
      holder: $avatarDrop[0],
      url: uploadUrl,
      handler: function (eventName, eventData) {
        $(this).removeClass('hover');
        var handler = handlers[eventName];
        if (handler) handler(eventData);
        else console.log('DndUpload handler', eventName, eventData);
      },
    });
  }

  this.activate();
}
