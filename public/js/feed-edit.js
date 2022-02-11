/* global $ */

var $playlistNameField = $('#playlistNameField');
var $playlistNameSubmit = $('#playlistNameSubmit');
var currentPlaylistName = $playlistNameField.val();

var isNewPlaylist = window.location.href.indexOf('/playlist/create') != -1;
if (isNewPlaylist) {
  $playlistNameField.focus();
  $playlistNameSubmit.show();
  currentPlaylistName = '';
}

$playlistNameField.bind('keyup input onpaste', function () {
  $playlistNameSubmit.toggle($playlistNameField.val() != currentPlaylistName);
});

$playlistNameField
  .parent()
  .unbind()
  .submit(function (e) {
    e.preventDefault();
    var newPlaylistName = $playlistNameField.val();
    if (currentPlaylistName == newPlaylistName) return;
    $playlistNameSubmit.hide();
    $playlistNameField.addClass('loading');
    $.ajax({
      type: 'POST',
      url: '/api/playlist',
      //dataType: "json",
      data: {
        action: isNewPlaylist ? 'create' : 'rename',
        id: window.pagePlaylist.id,
        name: newPlaylistName,
      },
      complete: function (res, status) {
        $playlistNameField.removeClass('loading').focus();
        try {
          if (status != 'success' || !res.responseText) throw 0;
          var json = JSON.parse('' + res.responseText);
          //console.log("success", json);
          if (isNewPlaylist) {
            goToPage(
              window.location.href.replace(
                '/playlist/create',
                '/playlist/' + json.id
              )
            );
          } else {
            showMessage('Your playlist was successfully renamed');
            currentPlaylistName = json.name;
            $playlistNameSubmit.hide();
          }
        } catch (e) {
          showMessage('An error occured. Please try again.');
          $playlistNameSubmit.show();
          console.log('error', status, res);
        }
      },
    });
  });

var $deletePlaylist = $('.deletePlaylist').first();

function deletePlaylist() {
  if (confirm('Are you sure you want to delete this playlist?')) {
    $deletePlaylist.addClass('loading');
    $.ajax({
      type: 'POST',
      url: '/api/playlist',
      data: {
        action: 'delete',
        id: window.pagePlaylist.id,
      },
      complete: function (res, status) {
        $deletePlaylist.removeClass('loading');
        try {
          if (status != 'success' || !res.responseText) throw 0;
          var json = JSON.parse('' + res.responseText);
          //console.log("success", json);
          goToPage('/u/' + user.id + '/playlists');
        } catch (e) {
          showMessage('An error occured. Please try again.');
          console.log('error', status, res);
        }
      },
    });
  }
}
