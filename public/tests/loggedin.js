function include(src, callback) {
  let inc = document.createElement('script'),
    timer,
    interval = 100,
    retries = 10;
  function check() {
    const loaded =
      inc.readyState &&
      (inc.readyState == 'loaded' ||
        inc.readyState == 'complete' ||
        inc.readyState == 4);
    if (loaded || --retries <= 0) {
      timer = timer ? clearInterval(timer) : null;
      callback && callback({ loaded: loaded });
    }
  }
  timer = callback ? setInterval(check, interval) : undefined;
  inc.onload = inc.onreadystatechange = check;
  try {
    inc.src = src;
    document.getElementsByTagName('head')[0].appendChild(inc);
  } catch (exception) {
    timer = timer ? clearInterval(timer) : null;
    callback
      ? callback(exception)
      : console.log(src + ' include exception: ', exception);
  }
}

function fetch(url, cb) {
  console.info('fetching data from ' + url + '...');
  const cbName =
    '_whyd_callback_' +
    Date.now() +
    '_' +
    (window._whyd_counter = (window._whyd_counter || 0) + 1);
  window[cbName] = function (res) {
    cb(res);
    delete window[cbName];
  };
  include(url + (url.indexOf('?') == -1 ? '?' : '&') + 'callback=' + cbName);
}

fetch('/api/user', function (res) {
  const loggedUser = !!(res || {})._id && res;
  if (loggedUser) {
    document.body.className = (document.body.className || '') + 'loggedIn';
    document.body.innerHTML = 'logged in';
  }
});
