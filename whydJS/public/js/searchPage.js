function selectTab() {
  $('#tabSelector a.selected').removeClass('selected');
  $(this).addClass('selected');
  $('.resultPage').hide();
  var current = $(this)
    .attr('href')
    .split('#')
    .pop();
  $('.resultPage#' + current).show();

  if (current == 'tracks') {
    $('#search-filters').show();
  } else {
    $('#search-filters').hide();
  }
}

/** FILTER **/
$('#search-filters li').on('click', function() {
  $('.posts .post').show();

  if (!$(this).hasClass('active')) {
    $('#search-filters li').removeClass('active');
    $(this).addClass('active');
    if ($(this).hasClass('soundcloud')) {
      $('.posts .post:not(.sc)').hide();
    } else if ($(this).hasClass('youtube')) {
      $('.posts .post:not(.yt)').hide();
    } else {
      $('.posts .post.sc, .posts .post.yt').hide();
    }
  } else {
    $(this).removeClass('active');
  }
});

$('#tabSelector a').click(selectTab);
if (window.location.href.indexOf('tab=') != -1) {
  var tab = (window.location.href.split('tab=').pop() || '').split('&')[0];
  if (tab) $('#tab_' + tab).each(selectTab);
}

// merges results from youtube and soundcloud with currently displayed results
$(window).ready(
  function(query) {
    var $body = $('body');
    $body.addClass('loading');
    function renderTrack(track) {
      return (
        '<div class="post external ' +
        track.eId.substr(1, 2) +
        '">' +
        '<a class="thumb" href="' +
        track.url +
        '" target="_blank" data-eid="' +
        track.eId +
        '"' +
        ' onclick="return playTrack(this);" style="background-image:url(\'' +
        track.img +
        '\');">' +
        '<img src="' +
        track.img +
        '">' +
        '<div class="play"></div>' +
        '</a>' +
        '<h2 ><a  onclick="window.goToPage(\'' +
        track.eId.split('#')[0] +
        '\');return false;"  target="_blank">' +
        htmlEntities(track.name) +
        '</a></h2>' +
        '</a><p class="author">' +
        '<span style="background-image:url(\'/images/icon-' +
        track.playerLabel.toLowerCase() +
        '.png\');"></span>' +
        'Powered by ' +
        track.playerLabel +
        '</p>' +
        '<div class="btns">' +
        '<a class="btnRepost" href="javascript:publishPost({eId:\'' +
        track.eId +
        '\'});">Add to</a>' +
        '</div>' +
        '</div>'
      );
    }
    function isAlreadyListed(track) {
      return !!document.querySelector('a.thumb[data-eid="' + track.eId + '"]');
    }
    var tracks = [];
    function displayDynamicSearchResults() {
      var trackCounter = document.getElementById('tab_tracks');
      var trackCount = parseInt(trackCounter.innerHTML);
      document.getElementById('tracks').innerHTML += tracks
        .map(renderTrack)
        .join('\n');
      trackCounter.innerHTML = trackCounter.innerHTML.replace(
        '' + trackCount,
        trackCount + tracks.length
      );
      $body.removeClass('loading');
      if (trackCount + tracks.length === 0) {
        $('#tracks .noResult').show();
      }

      if ($('#playlists.resultPage .playlist').length) {
        $('#playlists.resultPage .noResult').hide();
      } else {
        $('#playlists.resultPage .noResult').show();
      }

      if ($('#users.resultPage .user').length) {
        $('#users.resultPage .noResult').hide();
      } else {
        $('#users.resultPage .noResult').show();
      }
    }
    window.searchExternalTracks(query, function(track) {
      if (track && !isAlreadyListed(track)) {
        track.name = track.title;
        tracks.push(track);
      } else displayDynamicSearchResults();
    });
  }.bind(window, document.getElementById('q').value)
);
