/**
 * scripts for city pages
 * @author: adrienjoly, whyd
 **/

var initCityPage = function (urlPrefix, cityName) {
  var htmlEntities = htmlEntities || function htmlEntities (str) {
    return $('<div>').text(str).html()
  }

  function include (src, callback) {
    var inc = document.createElement('script'), timer, interval = 100, retries = 10
    function check () {
      var loaded = inc.readyState && (inc.readyState == 'loaded' || inc.readyState == 'complete' || inc.readyState == 4)
      if (loaded || --retries <= 0) {
        timer = timer ? clearInterval(timer) : null
        callback && callback({loaded: loaded})
      }
    }
    timer = callback ? setInterval(check, interval) : undefined
    inc.onload = inc.onreadystatechange = check
    try {
      inc.src = src
      document.getElementsByTagName('head')[0].appendChild(inc)
    } catch (exception) {
      timer = timer ? clearInterval(timer) : null
      callback ? callback(exception) : console.log(src + ' include exception: ', exception)
    }
  };

  function fetch (url, cb) {
    console.info('fetching data from ' + url + '...')
    var cbName = '_whyd_city_callback_' + Date.now() + '_' + (window._whyd_counter = (window._whyd_counter || 0) + 1)
    window[cbName] = function (res) {
      cb(res)
      delete window[cbName]
    }
    include(url + (url.indexOf('?') == -1 ? '?' : '&') + 'callback=' + cbName)
  }

  function preventAjax () {
    var links = document.getElementsByTagName('a')
    for (var i = links.length - 1; i > -1; --i) { links[i].className = (links[i].className || '') + ' no-ajaxy' }
  }

  // minimal template engine, http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
  function t (s, d) {
    for (var p in d) { s = s.replace(new RegExp('{' + p + '}', 'g'), htmlEntities(d[p])) }
    return s.replace(/\{\w*\}/gi, '') // remove un-populated slots
  }

  /*
	function makeDivRenderer(template, divOrCallback){
		return function(res){
			var html = res.data.map(function(item, i){
				item.index = i;
				return t(template, item);
			}).join("\n");
			if (typeof divOrCallback == "function")
				divOrCallback(html);
			else
				divOrCallback.innerHTML = html;
		};
	}
	*/

  var playlistTimeInit = 1400709600000 // 22/05/2014 00:00:00
  var playlistTime = undefined

  var TEMPLATE_TRACKS = [
    '<li class="post" data-pid="{_id}" style="list-style:none;">',
    '<a class="thumb no-ajaxy" href="{url}" data-eid="{eId}" onclick="{onclick}" style="background-image:url({img});">',
    '<img src="{img}">',
    '<div class="play"></div>',
    '</a>',
    '<a class="title no-ajaxy" target="_blank" href="' + urlPrefix + '/c/{_id}" onclick="{onclick}">{name}</a>',
    '<p class="author">',
    '<span style="background-image:url(' + urlPrefix + '/img/u/{uId});"></span>',
    '<a href="' + urlPrefix + '/u/{uId}">{uNm}</a>',
    '</p>',
    '</li>'
  ].join('')

  var TEMPLATE_PEOPLE = [
    '<li data-id="{id}">',
    '<a class="no-ajaxy" target="_blank" href="' + urlPrefix + '/u/{id}">',
    '<div class="thumb" style="background-image:url(' + urlPrefix + '/img/u/{id}?width=100&amp;height=100);"></div>',
    '<p class="username">{name}</p>',
    '</a>',
    '<p class="userbio">{bio}</p>',
    '</li>'
  ].join('')

  var TEMPLATE_PLAYLISTS = [
    '<li data-id="{id}">',
    '<a class="no-ajaxy" target="_blank" href="' + urlPrefix + '/u/{uId}/playlist/{plId}#autoplay">',
    '<div class="thumb" style="background-image:url(' + urlPrefix + '/img/playlist/{id});"></div>',
    '<p class="title"><span class="plName">{name}</span> by <span class="plAuthor">{uNm}</span></p>',
    '</a>',
    '<p class="nbTracks"><span>{nbTracks}</span> tracks</p>',
    '</li>'
  ].join('')

  // make sure that ajax navigation is prevented on all links
  // document.addEventListener('DOMContentLoaded', preventAjax);

  function truncateLines () {
	    var $p = $(this)
	    var divh = 48 // 3 lines
	    while ($p.outerHeight() > divh) {
	        $p.text(function (index, text) {
	            return text.replace(/\W*\s(\S)*$/, '...')
	        })
	    }
  }

  function pushTopPlaylists (data) {
	 	// Push the playlists we want to feature first (playlists.js)
    for (var j = 0; j < PLAYLISTS_TOP.length; j++) {
      var playlist = PLAYLISTS_TOP[j]
      console.log('Pushing at ' + playlist.index)
      data.splice(playlist.index, 0, playlist)
    }
    return data
  }

  function removeBlacklistedPlaylists (data) {
	 	for (var k = 0; k < data.length; k++) {
      var playlist = data[k]
      var index = indexOfObject(PLAYLISTS_BLACKLIST, playlist.id)
      if (index != -1) {
        console.log('Blacklisted: ' + playlist.id)
        data.splice(PLAYLISTS_TOP.length + index, 1)
      }
    }
    return data
  }

  function getFeaturedPlaylistIndex (nbPlaylist) {
    var date = new Date(playlistTime)
    var day = date.getDay()

    var list = PLAYLISTS_FEATURED
    var nb = list.length
    var diff = playlistTime - playlistTimeInit

    var days = Math.floor(diff / 1000 / 60 / 60 / 24)
    var index = days * nbPlaylist // We want 3 playlists

    // The index where to start picking the first playlist
    var start = index % nb

    return start
  }

  // INDEX

  function startIndexPage () {
    function renderTracks (template, div) {
      return function (res) {
        // Save server timestamp for playlists
        playlistTime = res.time
        // We have the server timestamp, get the playlists
        getPlaylists(3)

        div.innerHTML = res.data.map(function (item, i) {
          item.index = i
          item.url = '#'
          item.onclick = 'return playTrack(this);'
          return t(template, item)
        }).join('\n')
        $(div).find('.title').each(truncateLines)
      }
    }

    function makeDivRendererPeople (template, divOrCallback) {
      return function (res) {
        var html = res.data.map(function (item, i) {
          item.index = i
          return t(template, item)
        }).join('\n')
		       divOrCallback.innerHTML = html
		       $(divOrCallback).find('.userbio').each(truncateLines)
		       // Adapt layout to screen size
        adaptScreen()
      }
    }

    function makeDivRendererPlaylists (template, divOrCallback) {
      return function (res) {
        res.data = pushTopPlaylists(res.data)

        var html = res.data.map(function (item, i) {
          item.index = i
          return t(template, item)
        }).join('\n')
		       divOrCallback.innerHTML = html
      }
    }

    function adaptScreen () {
      // Window height
      var h = $(window).height()

      // Columns height
      var categories = document.getElementById('wrap-cat').clientHeight
      // Height of header+panel+columns
      var rest = 648 + categories

      // If the window's height is greater than the element's height
      if (h > rest) {
        var wrap = document.getElementById('wrap-cat')
        wrap.style.position = 'absolute'
        wrap.style.bottom = '0px'

        document.getElementById('mainPanel').style.position = 'initial'
        document.getElementById('contentPane').style.position = 'initial'
      } else {
        if (document.getElementById('mainPanel').style.position = 'initial') {
          document.getElementById('mainPanel').style.position = 'relative'
          document.getElementById('contentPane').style.position = 'relative'
          document.getElementById('wrap-cat').style.position = 'relative'
        }
      }
    };

    function getPlaylists (nbPlaylist) {
      var start = getFeaturedPlaylistIndex(nbPlaylist)
      var list = PLAYLISTS_FEATURED

      // If we're about to overflow the array
      if ((start + (nbPlaylist - 1)) > (list.length - 1)) {
        list = list.concat(list)
      }

      // Get all the playlist id
      var req = '/api/playlist?'
      for (var i = start; i < (nbPlaylist + start); i++) {
        var id = list[i]
        if (i != start) {
          req += '&'
        }
        req += 'id=' + id
      }

      console.log(req)

      // Make API call
      $.getJSON(req, function (data) {
        console.log(data)
        var html = data.map(function (item, i) {
          return t(TEMPLATE_PLAYLISTS, item)
        }).join('\n')

        $('.playlists').eq(0).append(html)
      })
    }

    fetch(urlPrefix + '/api/city/' + cityName + '/posts?limit=3', renderTracks(TEMPLATE_TRACKS, document.getElementsByClassName('posts')[0]))
    fetch(urlPrefix + '/api/city/' + cityName + '/peopleCurrent?limit=3', makeDivRendererPeople(TEMPLATE_PEOPLE, document.getElementsByClassName('people')[0]))

    preventAjax()

    window.onresize = adaptScreen
  }

  // TRACKS

  function startTracksPage (autoplay) {
    var NB_TRACKS = 20

    var GENRES = [
      'All',
      'Electro',
      'Hip-Hop',
      'Indie',
      'Folk',
      'Rock',
      'Punk',
      'Metal',
      'Blues',
      'R&B',
      'Soul',
      'Jazz',
      'Classical',
      'Reggae',
      'Pop',
      'Latin',
      'World'
    ]

    var checkDup = []

    var genres = document.getElementsByClassName('genres')[0]

    function populatePosts (genre, after, cb) {
      var url = urlPrefix + '/api/city/' + cityName + '/posts?limit=' + NB_TRACKS + '&genre=' + genre
      var div = document.getElementById('page2').getElementsByClassName('posts')[0]
      console.log('AFTER: ' + after)
      if (after) { url += '&after=' + after }
      fetch(url, function (res) {
        var html = res.data.map(function (item, i) {
          if (checkDup.indexOf(item.eId) == -1) {
            item.index = i
            item.url = '#'
            item.onclick = 'return playTrack(this);'
            checkDup.push(item.eId)
            return t(TEMPLATE_TRACKS, item)
          } else {
            console.log('Hiding duplicate track: ' + item.name)
            return ''
          }
        }).join('\n')
        if (after) { div.innerHTML += html } else { div.innerHTML = html }
        cb && cb()
      })
    }

    var genre

    function onGenreClick (e) {
      checkDup = []
      genre = $(e.target).text()
      $('#genres .selected').removeClass('selected')
      e.target.className = 'selected'
      $('body').addClass('loading')
      populatePosts(genre, null, function () {
        $('body').removeClass('loading')
      })
    }

    function loadMoreCityTracks () {
      $('.btnLoadMore').fadeTo(200, 0.75)
      $('.btnLoadMore').text('Loading...')
      var $frame = $('#tracks posts')
      var after = $('#tracks .post').last().attr('data-pid')
      $frame.ready(function () {
        populatePosts(genre, after, function () {
          $frame.ready(function () {
            $('.btnLoadMore').fadeTo(200, 1.0)
            $('.btnLoadMore').text('Load more')
            window.whydPlayer.updateTracks()
            // $(this).ajaxify();
          })
        })
      })
    }

    GENRES.map(function (genre) {
      var li = document.createElement('li')
      li.onclick = onGenreClick
      $(li).text(genre)
      genres.appendChild(li)
    })

    $('.genres li').first().addClass('selected')

    populatePosts(genre = 'All', null, function () {
      (function parseParams (params) {
        params.map(function (p) {
          /* var s = p.split("=");
                    var key = s.shift();
                    var value = s.pop();
                    if (key == "play") */
          console.log('Autoplay: ' + autoplay)
          if (autoplay == true) {
            whydPlayer.playAll(document.getElementsByClassName('post')[0])
          }
        })
      })((window.location.href.split('?').pop() || '').split('&'))
    })
    // preventAjax();
    $('.btnLoadMore').off().click(loadMoreCityTracks)
  }

  // PEOPLE

  function startPeoplePage () {
    function makeDivRenderer (template, divOrCallback) {
      return function (res) {
        var html = res.data.map(function (item, i) {
          item.index = i
          return t(template, item)
        }).join('\n')
        divOrCallback.innerHTML = html
        $(divOrCallback).find('.userbio').each(truncateLines)
      }
    }

    // Show popup
    $('.see-all').off().click(function seeEverybody () {
      GGPopup.setBlurred([document.getElementById('header'), document.getElementById('mainPanel')])
      GGPopup.show('ggpopup', '<h1>Loading...</h1>')
      fetch(urlPrefix + '/api/city/' + cityName + '/people?limit=200', function (res) {
        var obj = _renderUserList(res.data)
        var html = $(obj).html()
        GGPopup.update(html)
      })
    })

    function indexOfObject (arr, obj) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) {
          return i
        }
      }
      return -1
    }

    function loadTopFeatured (callback) {
      // Select one random users
      var rindex = Math.floor(Math.random() * FEATURED_PEOPLE.length)
      var u1 = FEATURED_PEOPLE[rindex]

      // Check we're still in the array length, if not we got back at the beginning
      rindex++
      if (rindex > FEATURED_PEOPLE.length - 1) {
        rindex = 0
      }

      var u2 = FEATURED_PEOPLE[rindex]

      rindex++
      if (rindex > FEATURED_PEOPLE.length - 1) {
        rindex = 0
      }

      var u3 = FEATURED_PEOPLE[rindex]

      // Build users array
      var users = [u1, u2, u3]
      var loaded = [false, false, false], load = 0

      var $container = $('.top-posts').children()

      for (var i = 0; i < users.length; i++) {
        var uid = users[i]

        if (uid == undefined) {
          console.log('User undefined ' + i, users)
          break
        }

        // Make API req
        $.getJSON('/api/user?id=' + uid + '&includeTags=1', function (data) {
          console.log('Top user ' + uid + ' fetched')
          var index = indexOfObject(users, data.id)
          if (index == -1) {
            console.log('User was not found in array: ' + data.id)
          }

          var $li = $container.eq(index)
          // console.log(index);
          // console.log($li);
          // console.log(data);

          // Populate
          $li.attr('data-id', data.id)
          $li.find('.cover > a').attr('href', '//openwhyd.org/u/' + data.id)

          // Does user have a cover image
          if (data.cvrImg) {
            // Apply cover image
            $li.find('.cover').css('background-image', 'url(//openwhyd.org' + data.cvrImg + ')')
          } else {
            // Not cover image, just grey
            $li.find('.cover').css('background', 'rgba(0, 0, 0, 0.5)')
          }

          $li.find('.thumb').css('background-image', 'url(/img/u/' + data.id + '?width=100&amp;height=100)')
          $li.find('.username').html('<a href="//openwhyd.org/u/' + data.id + '">' + data.name + '</a>')
          $li.find('.userbio').text('')
          $li.find('.userbio').text(data.bio)
          $li.find('.action a').attr('href', '//openwhyd.org/u/' + data.id)

          // Check if user has a personal website
          if (data.lnk) {
            if (data.lnk.home) {
              $li.find('.website a').text(data.lnk.home).attr('href', data.lnk.home)
            }
          }

          // Load genres tags
          var $ul = $li.find('.tags')
          $ul.empty()
          var limit = data.tags.length
          if (limit > 3) {
            limit = 3
          }

          for (var j = 0; j < limit; j++) {
            var tag = data.tags[j]
            // Create li
            var $lig = $('<li><a href="#" onclick="return false;">' + tag.id + ' <i>' + tag.c + '</i></a></li>')
            $ul.append($lig)
          }

          // Load last artists
          var $part = $li.find('.artists')
          var artists = data.lastArtists
          for (var j = 0; j < artists.length; j++) {
            var art = artists[j]
            var still = $part.text()
            if (still.length > 0) {
              still += ', '
            }
            $part.text(still + art)
          }

          // This user is now loaded
          loaded[index] = true
          load++

          // All the users have been loaded
          console.log(load, users.length)
          if (load == users.length) {
            $('.top-featured > .load').hide()
            // Display div
            $('.top-posts').show()

            // What do we do next?
            if (callback && typeof callback === 'function') {
              callback()
            }
          }
        })
      }
    }

    $('#people .top-posts').find('.userbio').each(truncateLines)

    // Load top featured users
    loadTopFeatured(function () {
      // After the top featured have been loaded
      console.log('Top featured loaded')
      fetch(urlPrefix + '/api/city/' + cityName + '/peopleRecent?limit=6', makeDivRenderer(TEMPLATE_PEOPLE, document.getElementById('page3').getElementsByClassName('posts')[0]))
    })

    // preventAjax();
  }

  // PLAYLISTS

  function startPlaylistsPage () {
    var TEMPLATE_PLAYLISTS_GRID = [
      '<li data-id="{id}" class="post">',
			    '<div class="username"><a class="no-ajaxy" target="_blank" href="' + urlPrefix + '/u/{uId}"><span style="background-image:url(' + urlPrefix + '/img/u/{uId});"></span><p>{uNm}</p></a></div>',
      '<a class="no-ajaxy" target="_blank" href="' + urlPrefix + '/u/{uId}/playlist/{plId}#autoplay">',
      '<div class="thumb" style="background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0, rgba(0, 0, 0, 0.7)), color-stop(0.20, transparent)), url(' + urlPrefix + '/img/playlist/{id});background-image: -moz-linear-gradient(top, rgba(0, 0, 0, 0.7) 0%, transparent 20%), url(' + urlPrefix + '/img/playlist/{id});background-image: -o-linear-gradient(top, rgba(0, 0, 0, 0.7) 0%, transparent 20%), url(' + urlPrefix + '/img/playlist/{id});background-image: linear-gradient(top, rgba(0, 0, 0, 0.7) 0%, transparent 20%), url(' + urlPrefix + '/img/playlist/{id});"><div class="play"></div></div>',
      '</a>',
      '<div class="genres">',
      '<ul>',
      '{genres}',
      '</ul>',
      '</div>',
      '<div class="infos">',
      '<p class="plName"><a href="' + urlPrefix + '/u/{uId}/playlist/{plId}#autoplay">{name}</a></p>',
      '<p class="nbTracks"><strong>{nbTracks}</strong> tracks</p>',
      '<p class="artists">{artists}</p>',
      '</div>',
      '</li>'
    ].join('')

    function indexOfObject (arr, obj) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) {
          return i
        }
      }
      return -1
    }

    function makeDivRendererPlaylists (template, divOrCallback) {
      return function (res) {
        var alldata = res.data

        // Push the playlists we want to feature first (playlists.js)
        alldata = pushTopPlaylists(alldata)

        // Remove the blacklisted playlists
        alldata = removeBlacklistedPlaylists(alldata)

        // Populate HTML
        var html = alldata.map(function (item, i) {
          // item.index = i+PLAYLISTS_TOP.length;

          // Replace title with a description if available (in playlists.js)
          /* if(plDesc[item.id]) {
						item.name = plDesc[item.id];
					} */

          return t(template, item)
        }).join('\n')
        if (typeof divOrCallback === 'function') { divOrCallback(html) } else { divOrCallback.innerHTML = html }
      }
    }

    function showFeaturedPlaylists (nbPlaylist) {
      // Change selected playlist everyday

      var start = getFeaturedPlaylistIndex(nbPlaylist)
      var list = PLAYLISTS_FEATURED
      var nb = list.length

      // If we're about to overflow the array
      if ((start + (nbPlaylist - 1)) > (nb - 1)) {
        list = list.concat(list)
      }

      // Get all the playlist id
      var req = '/api/playlist?'
      for (var i = start; i < (nbPlaylist + start); i++) {
        var id = list[i]
        if (i != start) {
          req += '&'
        }
        req += 'id=' + id
      }

      // Make API call
      $.getJSON(req + '&includeTags=1', function (data) {
        var garray = new Array()

        var html = data.map(function (item, i) {
          garray[i] = new Array()

          // Get genres
          for (var j = 0; j < item.tags.length; j++) {
            var title = item.tags[j].id
            // var $g = $("<li>" + title + "</li>");
            garray[i][j] = title
            // $('#playlists > .posts li').eq(i).find('.genres ul').append($g);
          }

          // Get artists
          var strart = ''
          for (var j = 0; j < item.lastArtists.length; j++) {
            var artist = item.lastArtists[j]
		                if (strart.length > 0) {
		                    strart += ', '
		                }
		                strart += artist
          }
          item.artists = strart

          return t(TEMPLATE_PLAYLISTS_GRID, item)
        }).join('\n')

        $('#playlists > .posts').append(html)

        // Append genres
        for (var j = 0; j < garray.length; j++) {
          var tags = garray[j]
          for (var k = 0; k < tags.length; k++) {
            var tag = tags[k]
            $li = $('<li>' + tag + '</li>')
            $('#playlists > .posts > li').eq(j).find('.genres ul').append($li)
          }
        }
      }).done(function () {
        $('#playlists > .posts .load').hide()
      })
    }

    // preventAjax();

    showFeaturedPlaylists(3)
  }

  // PAGE ROUTING

  function switchPage (link) {
    // Do we want to autoplay?
    var autoplay = !!($(link).data('autoplay'))

    var adr = $(link).attr('href')
    var from = adr.split('#')[1].toLowerCase()

    var loading = '<p class="load">Loading...</p>'

    // Hide every page
    $('.switch-page').hide()

    if (from == 'tracks') {
      $('#page2 #genres ul').html('')
      $('#page2 #tracks .posts').html(loading)

      // Show page, loading...
      $('body').addClass('pgCitySection')
      $('#page2').show()

      startTracksPage(autoplay)
    } else if (from == 'people') {
      // $('#page3 #people .top-posts').html(loading);
      $('#page3 #people .posts').html(loading)

      $('#page3').show()
      $('body').addClass('pgCitySection')

      startPeoplePage()
    } else if (from == 'playlists') {
      $('#page4 #playlists .posts').html(loading)

      $('#page4').show()
      $('body').addClass('pgCitySection')

      startPlaylistsPage()
    } else {
      // Index page
      $('body').removeClass('pgCitySection')
      $('#page1').show()

      startIndexPage()

      adaptScreen()
    }
  }
  startIndexPage()

  $('.cityBtn').click(function (e) {
    switchPage(e.target)
  })
}

if (window.onCityPageReady) { window.onCityPageReady(initCityPage) }
