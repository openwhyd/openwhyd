/* globals $ */

// AJAX functions

window.$ =
  window.$ ||
  new (function FakeJquery() {
    function loadJS(src, cb) {
      var inc = document.createElement('script');
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
      var r = new XMLHttpRequest();
      r.onload = function () {
        var res = undefined;
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

    var _getJSON_counter = 0;
    return {
      getJSON: function (url, cb) {
        if (url[0] == '/' || url.indexOf('=?') == -1)
          // local request
          loadJSON(url, cb);
        else {
          var wFct = '_getJSON_cb_' + ++_getJSON_counter;
          var wUrl = url.replace('=?', '=' + wFct);
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

// search engines

function WhydTrackFinder() {
  var JAMENDO_CLIENT_ID = '2c9a11b9';
  var SOUNDCLOUD_CLIENT_ID = 'eb257e698774349c22b0b727df0238ad';
  var MAX_RESULTS_PER_ENGINE = 10;

  // from postBox.js
  var searchEngines = {
    wd: function () {
      return {
        label: 'Whyd',
        query: function (q, cb) {
          var url =
            '/search?context=quick&max-results=' +
            MAX_RESULTS_PER_ENGINE +
            '&q=' +
            encodeURIComponent(q);
          $.getJSON(
            url,
            function (r) {
              cb((r || {}).results);
            },
            'json'
          );
        },
      };
    },
    yt: function () {
      return {
        label: 'Youtube',
        query: function (q, cb) {
          var url =
            'http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&first-index=0&max-results=' +
            MAX_RESULTS_PER_ENGINE +
            '&q=' +
            encodeURIComponent(q) +
            '&callback=?';
          var that = this;
          $.getJSON(
            url,
            function (json) {
              var items = ((json || {}).data || {}).items;
              cb(
                !items
                  ? json
                  : {
                      Youtube: items.map(function (r) {
                        return {
                          eId: '/yt/' + r.id,
                          img:
                            r.img ||
                            r.thumbnail.hqDefault ||
                            r.thumbnail.sqDefault,
                          url: r.url || r.player['default'],
                          name: r.name || r.title,
                          playerLabel: that.label,
                        };
                      }),
                    }
              );
            },
            'json'
          );
        },
      };
    },
    sc: function () {
      var URL =
        'http://api.soundcloud.com/tracks?limit=' +
        MAX_RESULTS_PER_ENGINE +
        '&client_id=' +
        SOUNDCLOUD_CLIENT_ID +
        '&format=json&callback=?';
      return {
        label: 'Soundcloud',
        query: function (q, cb) {
          var that = this;
          $.getJSON(URL + '&q=' + encodeURIComponent(q), function (json) {
            var items =
              json instanceof Array ? json : ((json || {}).data || {}).items;
            cb(
              !items
                ? json
                : {
                    Soundcloud: items.map(function (r) {
                      r.title = r.title || r.name;
                      var permalink = (r.url || r.permalink_url).split('/');
                      return {
                        eId:
                          '/sc/' +
                          permalink.slice(permalink.length - 2).join('/') +
                          '#' +
                          r.uri,
                        img:
                          r.img ||
                          r.artwork_url ||
                          '/images/cover-soundcloud.jpg',
                        url: r.url || r.permalink_url + '#' + r.uri,
                        name:
                          (r.title.indexOf(' - ') == -1
                            ? (r.uploader || r.user.username) + ' - '
                            : '') + r.title,
                        playerLabel: that.label,
                      };
                    }),
                  }
            );
          });
        },
      };
    },
  };

  for (let i in searchEngines) searchEngines[i] = new searchEngines[i]();

  this.query = function (q, cb) {
    for (let i in searchEngines)
      (function (engine) {
        engine.query(q, function (res) {
          cb(res, engine);
        });
      })(searchEngines[i]);
  };

  this.length = Object.keys(searchEngines).length;

  return this;
}

// main logic of mobile/index.html

(function () {
  // TrackFinder configuration

  var LABELS = {
    myPlaylists: 'My playlists',
    playlistTracks: 'Tracks',
    myLastPosts: 'My recent tracks',
    myPosts: 'My tracks',
    theirPosts: 'Other tracks',
  };

  function eidToUrl(eId) {
    return (eId || '')
      .replace('/yt/', 'https://youtube.com/watch?v=')
      .replace('/sc/', 'https://soundcloud.com/')
      .replace('/dm/', 'https://dailymotion.com/video/')
      .replace('/dz/', 'https://deezer.com/track/')
      .replace('/vi/', 'https://vimeo.com/');
  }

  // general utils / tools

  function htmlEscape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function whenAllTasksDone(tasks, cb) {
    var remaining = tasks.length;
    function onTaskEnd() {
      console.log('task: done');
      if (!--remaining) cb();
    }
    for (let i in tasks) tasks[i](onTaskEnd);
  }

  // rendering

  function renderResults(array, name, q) {
    return ['<h1>' + (LABELS[name] || name) + '</h1>', '<ul>']
      .concat(
        array.map(function (item) {
          var name = htmlEscape(item.name);
          if (q) name = name.replace(new RegExp(q, 'gi'), '<b>$&</b>'); // highlight matching part
          return (
            "<li class='" +
            (item.cssClass || '') +
            "' " + //  class='"+(item.playerLabel||"")+"'
            (item.img ? " data-img='" + htmlEscape(item.img) + "'" : '') +
            (item.eId ? " data-eid='" + htmlEscape(item.eId) + "'" : '') +
            (item.id ? " data-pid='" + htmlEscape(item.id) + "'" : '') +
            '>' +
            "<div class='btnAdd'>✚</div>" +
            "<a href='" +
            htmlEscape(item.url) +
            "' target='_blank'>" +
            "<div class='thumb' style='background-image:url(" +
            htmlEscape(item.img) +
            ")'></div>" +
            name +
            '</a>' +
            //+ ((item.pl || {}).name ? "<p>" + htmlEscape(item.pl.name) + "</p>" : "")
            '</li>'
          );
        })
      )
      .concat(['</ul>'])
      .join('\n');
  }

  // data retrieval

  function loadStream(url, id, cb) {
    function renderLastPost(t) {
      return {
        url: eidToUrl(t.eId),
        img: t.img,
        name: t.name,
      };
    }
    $.getJSON(
      url + '?format=json',
      function (r) {
        if (r)
          document.getElementById(id).innerHTML = renderResults(
            r.map(renderLastPost),
            id
          );
        cb && cb(r);
      },
      'json'
    );
  }

  function loadUserPlaylists(cb) {
    $.getJSON('/api/user', function (u) {
      if (!u || !u.pl) return;
      var uid = u._id,
        i = 0,
        more = { cssClass: 'showMore', name: 'More...' };
      function renderPlaylist(t) {
        return {
          cssClass: 'playlist' + (++i > 3 ? ' hidden' : ''),
          url: t.url,
          img: '/img/playlist/' + uid + '_' + t.id,
          name: t.name,
        };
      }
      document.getElementById('myPlaylists').innerHTML = renderResults(
        u.pl.map(renderPlaylist).concat(more),
        'myPlaylists'
      );
      document.getElementsByClassName('showMore')[0].onclick = function (e) {
        e.preventDefault();
        this.parentNode.removeChild(this);
        fadeIn(document.getElementsByClassName('hidden'));
        return false;
      };
      cb && cb(u, document.getElementsByClassName('playlist'));
    });
  }
  /*
	function lookupSpotifyTrack(title, cb) {
		$.getJSON("//ws.spotify.com/search/1/track.json?q=" + encodeURIComponent(title), function (data) {
			var tracks = (data || {}).tracks;
			cb(tracks && tracks.length ? tracks[0] : null)
		});
	}
	*/
  function loadPlaylist(playlist) {
    var url = playlist.href.substr(playlist.href.indexOf('/u/'));
    document.getElementById('playlistName').innerText = playlist.innerText;
    document.getElementById('playlistTracks').innerHTML = '';
    var i = 0;
    loadStream(url, 'playlistTracks', function (tracks) {
      tracks = tracks || [];
      /*
			var tracks = tracks || [], trackIds = [];
			function whenDone(){
				var urls = [
					"spotify:trackset:"+encodeURIComponent(playlist.innerText)+":"+trackIds.join(","),
					//"spotify://http://open.spotify.com/trackset:"+encodeURIComponent(playlist.innerText)+":"+trackIds.join(","),
					//trackIds.map(function(t){return "spotify:track:"+t;}).join(","),
					//trackIds.map(function(t){return "spotify:track:"+t;}).join("\n")
				]
				console.log(i, urls[i]);
				window.location.href = urls[i];
				//alert(i++);
			}
			function lookupNextTrack(){
				var track = tracks.shift();
				if (!track)
					whenDone();
				else
					lookupSpotifyTrack(track.name, function(spoTrack) {
						if (spoTrack && spoTrack.href)
							trackIds.push(spoTrack.href.split(":").pop());
						lookupNextTrack();
					});				
			}
			document.getElementById("toSpotify").onclick = lookupNextTrack;
			*/
      document.getElementById('toDeezer').onclick = function () {
        var trackIds = [],
          tasks = [
            function (cb) {
              DeezerExport.checkLogin(cb);
            },
            function (cb) {
              (function lookupNextTrack() {
                var track = tracks.shift();
                if (!track) cb();
                else
                  DeezerExport.lookupTrack(track.name, function (match) {
                    if (match && match.id) trackIds.push(match.id);
                    lookupNextTrack();
                  });
              })();
            },
          ];
        whenAllTasksDone(tasks, function whenDone() {
          console.log('=> track ids:', trackIds);
          DeezerExport.playTracks(trackIds, '[WHYD] ' + playlist.innerText);
        });
      };
    });
    switchToPage('pgPlaylist');
  }

  // main logic

  function loadMainPage() {
    loadUserPlaylists(function (user, playlists) {
      document.getElementById('pleaseLogin').style.display = 'none';
      loadStream('/me', 'myLastPosts');
      for (let i = 0; i < playlists.length; ++i)
        playlists[i].onclick = function (e) {
          e.preventDefault();
          loadPlaylist(e.target);
          return false;
        };
    });
  }

  function switchToPage(id) {
    var pages = document.getElementsByClassName('page');
    for (let i = 0; i < pages.length; ++i) pages[i].style.display = 'none';
    document.getElementById(id).style.display = 'block';
  }

  function onAddTrack(btn) {
    var elt = btn.target.parentElement;
    var track = elt.dataset;
    var postData = {
      action: 'insert',
      ctx: 'mob',
      eId: track.eid,
      img: track.img,
      name: elt.getElementsByTagName('a')[0].innerText,
      'src[id]': 'http://openwhyd.org/mobile',
      'src[name]': 'Openwhyd Mobile Track Finder',
    };
    console.log('posting...', postData);
    var params = Object.keys(postData).map(function (key) {
      return key + '=' + encodeURIComponent(postData[key]);
    });
    $.getJSON('/api/post?' + params.join('&'), function (post) {
      console.log('posted:', post);
      if (!post || post.error)
        alert(
          'Sorry, we were unable to add this track\n' +
            ((post || {}).error || '')
        );
      else alert('Succesfully added this track!');
    });
  }

  //var mainResults = document.getElementById("mainResults");
  var defaultResults = document.getElementById('pgResults').innerHTML;

  var tF = new WhydTrackFinder();
  var qS = new QuickSearch(document.getElementById('searchField'), {
    noMoreResultsOnEnter: true,
    submitQuery: function (query, display) {
      // called a short delay after when a query was entered
      display(defaultResults, true); // clear the result list and keep the searching animation rolling
      var remaining = tF.length;
      function handleResults(res, engine) {
        --remaining;
        if (!res || res.error || res.errors)
          console.log('error(s)', engine.label, res);
        else
          for (let i in res) {
            var container = document.getElementById(i);
            display(renderResults(res[i], i, query), remaining, container);
            var btns = container.getElementsByClassName('btnAdd');
            for (let i in btns) btns[i].onclick = onAddTrack;
          }
      }
      tF.query(query, handleResults);
    },
    onNewQuery: function () {
      //mainResults.style.display = "none";
      switchToPage('pgResults');
    },
    onEmpty: function () {
      //mainResults.style.display = "block";
      switchToPage('pgMain');
    },
  });

  document.getElementsByClassName('searchClear')[0].onclick = function () {
    qS.search('');
  };

  document.getElementById('exitPlaylist').onclick = function () {
    switchToPage('pgMain');
  };

  // fade-in effect for results
  function fadeIn(nodeSet, liCondition) {
    var fadeQueue = [];
    for (let i = 0; i < nodeSet.length; ++i) {
      var li = nodeSet[i];
      //if (log) console.log(li);
      if (li.nodeName == 'LI' && (!liCondition || liCondition(li))) {
        fadeQueue.push(li);
        li.className = (li.className || '') + ' hidden';
      }
    }
    if (fadeQueue.length)
      var interval = setInterval(function () {
        var elt = fadeQueue.shift();
        if (elt) elt.className = elt.className.replace('hidden', 'fadeIn');
        else clearInterval(interval);
      }, 10);
  }

  document.getElementById('searchPane').addEventListener(
    'DOMNodeInserted',
    function (ev) {
      if (ev.target.nodeName == 'UL')
        fadeIn(ev.target.children, function (li) {
          return li.className.indexOf('hidden') == -1;
        });
    },
    false
  );

  loadMainPage();
})();
