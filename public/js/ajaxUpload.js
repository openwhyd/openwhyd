/* globals $ */

/**
 * ajax upload module
 * @author adrienjoly, whyd
 */

function AjaxUpload($form, onComplete, onPost) {
  var $uploadInput = $form.find('input[type=file]');
  var fieldName = $uploadInput.attr('name');
  if (!fieldName) $uploadInput.attr('name', (fieldName = 'file'));

  var lastUploadUrl = null;

  $form.attr('action', '/upload');
  $form.attr('method', 'post');
  $form.attr('enctype', 'multipart/form-data');

  function deleteTempImage() {
    if (lastUploadUrl)
      $.ajax({
        type: 'POST',
        url: '/upload',
        data: { id: lastUploadUrl.split('/').pop(), action: 'delete' },
      });
    lastUploadUrl = null;
  }

  $form.iframePostForm({
    post: function () {
      deleteTempImage();
      if (onPost) onPost($uploadInput.val());
    },
    complete: function (res) {
      var data = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      //console.log('json', data);
      var img = {};
      try {
        img = JSON.parse(data)[fieldName];
        lastUploadUrl = '' + img.path;
        if (!img.mime || !img.mime.indexOf('image/') == 0)
          img.error = 'Invalid image. Please try with another image!';
      } catch (e) {
        (img || (img = {})).error = e;
      }
      //console.log('img', img);
      onComplete(img);
    },
  });

  $uploadInput.change(function () {
    $form.submit();
  });

  return {
    cancel: function () {
      deleteTempImage();
    } /*,
		updateImage: function() {
			if (!lastImageUrl)
				return alert("Image upload failed... Please try again!");
			lastUploadUrl = null; // prevent file from being deleted
			$.ajax({
				type: "GET",
				url: "/api/user",
				data: {img:lastImageUrl},
				complete: function() {
					window.location.reload(false);
				}
			});
			$.modal.close();
		}*/,
  };
}
