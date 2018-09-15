function include(src, callback) {
  var inc = document.createElement('script'),
    timer,
    interval = 100,
    retries = 10;
  function check() {
    var loaded =
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
  var cbName =
    '_whyd_callback_' +
    Date.now() +
    '_' +
    (window._whyd_counter = (window._whyd_counter || 0) + 1);
  window[cbName] = function(res) {
    cb(res);
    delete window[cbName];
  };
  include(url + (url.indexOf('?') == -1 ? '?' : '&') + 'callback=' + cbName);
}

function initAnalytics(loggedUser) {
  window._gaq = (window._gaq || []).concat([
    ['_setAccount', 'UA-83857066-1'],
    ['_setDomainName', 'openwhyd.org'],
    ['_setAllowHash', 'false'],
    ['_trackPageview'],
    ['_setCustomVar', 1, 'loggedIn', !!loggedUser, 2]
  ]);
  if (loggedUser)
    window._gaq = window._gaq.concat([
      ['_setCustomVar', 2, 'userId', loggedUser._id, 1],
      ['_setCustomVar', 3, 'hasFb', !!loggedUser.fbId, 1],
      ['_setCustomVar', 5, 'userName', loggedUser.name, 1]
    ]);
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src =
    ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') +
    '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
}

fetch('/api/user', function(res) {
  var loggedUser = !!(res || {})._id && res;
  if (loggedUser) {
    document.body.className = (document.body.className || '') + 'loggedIn';
    document.body.innerHTML = 'logged in';
  }
  //initAnalytics(loggedUser);
});
