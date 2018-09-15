DeezerExport = (function() {
  var INIT_PARAMS = {
    appId: '128545',
    channelUrl: window.location.href.replace(
      '/mobile/',
      '/html/deezer.channel.html'
    )
  };

  function whenLoggedIn() {
    console.log('Deezer: logged in!');
    DZ.api('/user/me', function(response) {
      console.log('Deezer: me', response);
    });
  }

  function login(cb) {
    console.log('Deezer: logging in...');
    DZ.login(
      function(response) {
        console.log('Deezer: login response', response);
        if ((response.authResponse || {}).accessToken) {
          whenLoggedIn();
          cb && cb();
        } else {
          console.log(
            'Deezer: User cancelled login or did not fully authorize.'
          );
        }
      },
      { perms: 'manage_library' }
    );
  }

  function checkLoginStatus(cb) {
    DZ.getLoginStatus(function(response) {
      console.log('Deezer: getLoginStatus response', response);
      if ((response.authResponse || {}).accessToken) {
        whenLoggedIn();
        cb && cb();
      } else {
        login(cb);
      }
    });
  }

  window.dzAsyncInit = function() {
    console.log('Deezer: init...');
    DZ.init(INIT_PARAMS);
  };

  var e = document.createElement('script');
  e.src = 'http://cdn-files.deezer.com/js/min/dz.js';
  e.async = true;
  document.getElementById('dz-root').appendChild(e);

  var methods = {
    checkLogin: checkLoginStatus,
    lookupTrack: function(title, cb) {
      DZ.api('search/autocomplete', { q: title }, function(res) {
        console.log('Deezer: search', title, res);
        cb && cb((((res || {}).tracks || {}).data || []).shift());
      });
    },
    playTracks: function(trackIds, plName) {
      checkLoginStatus(function() {
        DZ.api(
          'user/me/playlists',
          'POST',
          { title: plName || 'whyd mobile playlist' },
          function(response) {
            console.log('Deezer: created playlist', response);
            var plId = response.id;
            DZ.api(
              'playlist/' + plId + '/tracks',
              'POST',
              { songs: trackIds },
              function(response) {
                console.log('Deezer: added tracks', response);
                window.location.href =
                  'deezer://www.deezer.com/playlist/' +
                  plId +
                  '?referrer=whydMobileTrackFinder';
              }
            );
          }
        );
      });
    }
  };

  return new function DeezerExport() {
    return methods;
  }();
})();
