/* global $, DndUpload */

window.WhydImgUpload = function (options) {
  options = options || {};
  options.onError = options.onError || console.log;

  let lastAvatarUrl = null,
    lastUploadUrl = null;
  const $dlg = options.holder;
  const $boxes = options.$boxes || $dlg.find('.uploadBox');
  const $img = $dlg.find('.dlgImgPane > img');
  const $input = $dlg.find('input[type=file]');
  const $avatarForm = $input.closest('form');
  const uploadUrl = options.url || $avatarForm.attr('action');
  const defaultImgUrl = options.defaultImgUrl || '/images/blank_user.gif';

  const self = this;

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
          data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1),
        );
    }
    try {
      const img = data.postImg || data.file;
      lastUploadUrl = (img.path[0] != '/' ? '/' : '') + img.path;
      if (img.mime && img.mime.indexOf('image/') == 0) {
        lastAvatarUrl = lastUploadUrl;
        options.onImageUploadComplete &&
          options.onImageUploadComplete(lastAvatarUrl);
      } else options.onError('Invalid image. Please try with another image!');
    } catch (e) {
      options.onError(
        data.error || 'Upload did not work... Please try again!',
        e,
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
    let destination;
    const $avatarDrop = $dlg.find('#avatarDrop');
    const $progress = $dlg.find('.progress');
    const $progressLevel = $progress.find('div');
    this.activate = function () {
      console.log('html5 upload activation');
      $boxes.hide();
      $avatarDrop.show();
    };
    $avatarDrop.find('button').click(function () {
      $input.click();
    });
    $avatarDrop.on('dragenter', function (event) {
      destination = event.target;
      $(this).addClass('hover');
    });
    $avatarDrop.on('dragleave', function (event) {
      if (
        !$(this).find(destination).size() &&
        !$(this).find(event.target).size()
      )
        $(this).removeClass('hover');
    });
    const handlers = {
      error: function () {
        $boxes.hide();
        $avatarForm.show();
        $progress.hide();
      },
      post: function () {
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
    DndUpload({
      form: $avatarForm[0],
      holder: $avatarDrop[0],
      url: uploadUrl,
      handler: function (eventName, eventData) {
        $(this).removeClass('hover');
        const handler = handlers[eventName];
        if (handler) handler(eventData);
        else console.log('DndUpload handler', eventName, eventData);
      },
    });
  }

  this.activate();
};
