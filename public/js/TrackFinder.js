/* globals $ */

// AJAX functions

window.$ =
  window.$ ||
  new (function FakeJquery() {
    function loadJS(src, cb) {
      const inc = document.createElement('script');
      if (cb)
        inc.onload = inc.onreadystatechange = function () {
          if (
            inc.readyState == 'loaded' ||
            inc.readyState == 'complete' ||
            inc.readyState == 4
          )
            cb();
        };
      inc.src = src;
      document.getElementsByTagName('head')[0].appendChild(inc);
    }

    function loadJSON(src, cb) {
      const r = new XMLHttpRequest();
      r.onload = function () {
        let res = undefined;
        try {
          res = JSON.parse(this.responseText);
        } catch (e) {
          console.error(e);
        }
        cb(res, this);
      };
      r.open('get', src, true);
      r.send();
    }

    let _getJSON_counter = 0;
    return {
      getJSON: function (url, cb) {
        if (url[0] == '/' || url.indexOf('=?') == -1)
          // local request
          loadJSON(url, cb);
        else {
          const wFct = '_getJSON_cb_' + ++_getJSON_counter;
          const wUrl = url.replace('=?', '=' + wFct);
          window[wFct] = function (data) {
            cb(data);
            // TODO: remove script element from DOM
            delete window[wFct];
          };
          loadJS(wUrl);
        }
      },
      getScript: loadJS,
    };
  })();

const getLoggedInUserId = async function () {
  const user = await new Promise((resolve) => $.getJSON('/api/user', resolve));
  return user && user._id;
};

// main logic of mobile/index.html

(async function () {
  const uId =
    new URL(window.location.href).searchParams.get('uId') ||
    (await getLoggedInUserId());

  if (uId) {
    window.location.href = `https://openwhyd.github.io/openwhyd-mobile-web-client/?uId=${uId}`;
  }
})();
