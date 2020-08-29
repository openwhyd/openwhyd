/* global $, goToPage, showMessage, _renderUserInList */

function htmlDecode(s) {
  return $('<div />').html(s).text();
}

var sections = {
  featured: function ($content) {
    var $img = $content.find('input[name=img]');
    var $thumb = $content.find('.thumb');
    function updateThumb() {
      $thumb.css('background-image', "url('" + $img.val() + "')");
    }
    $img.bind('keyup input onpaste', updateThumb);
    $('#addFeatured').submit(function (e) {
      e.preventDefault();
      $.post($(this).attr('action'), $(this).serialize(), function (json) {
        console.log('response', json);
        goToPage();
      });
    });
    var $url = $('input[name=url]').bind('keyup input onpaste', function () {
      $.get('/discover', { ajax: 'parseBlogPost', url: $url.val() }, function (
        json
      ) {
        //console.log("parseBlogPost response", json)
        for (let f in json) {
          json[f] = htmlDecode(json[f]);
          console.log(f, json[f]);
          $('input[name=' + f + ']').val(json[f]);
        }
        if (json.img) updateThumb();
      });
    });
    function renderPost(p) {
      var $li = _renderUserInList({
        url: '/u/' + p.uId, //p.url,
        img: p.img,
        id: p.uId,
        name: p.uNm,
        subscribed: p.subscribed,
        thumbClickHandler: function () {
          $(this).closest('li').find('a.blogLink')[0].click();
        },
      });
      $li
        .find('small')
        .text(p.desc)
        .append(
          '<br><br><a href="' +
            p.url +
            '" class="blogLink">Read ' +
            p.uNm +
            "'s full interview</a>"
        );
      if (p.date) $('<div>').text(p.date).appendTo($li.find('.thumb'));
      return $li;
    }
    $.get('/discover', { ajax: 'featured' }, function (json) {
      $('.loading').removeClass('loading');
      console.log('featured', json);
      if (json && !json.error && json.posts) {
        var $out = $('ul');
        for (let i = 0; i < json.posts.length; ++i)
          $out.append(renderPost(json.posts[i]));
        if ($out.ajaxify) $out.ajaxify();
      } else (json || {}).error ? showMessage(json.error) : console.log('rankings error', json);
    });
  },
  ranking: function ($content) {
    function renderUserRanking(users) {
      var $out = $('<ul>').addClass('userList');
      for (let i = 0; i < users.length; ++i) {
        var $li = _renderUserInList(users[i]);
        var $box = $('<div class="statBox">')
          .append($('<div class="nbSubscribers">').text(users[i].nbSubscribers))
          .append($('<div class="nbAdds">').text(users[i].nbAdds))
          .append($('<div class="nbLikes">').text(users[i].nbLikes))
          .append($('<div class="nbPlays">').text(users[i].nbPlays));
        $out.append($li.prepend($box));
      }
      return $out.ajaxify ? $out.ajaxify() : $out;
    }
    $.get('/discover', { ajax: 'ranking' }, function (json) {
      $('.loading').removeClass('loading');
      console.log('ranking', json);
      if (json && !json.error) {
        var $li = $content
          .html(renderUserRanking(json))
          .prepend(
            '<p>The World Openwhyd Ranking reflects the most influential people sharing music on Openwhyd this week</p>'
          )
          .find('li');
        $li.eq(0).append("<div class='rankMedal rank1'>1</div>");
        $li.eq(1).append("<div class='rankMedal rank2'>2</div>");
        $li.eq(2).append("<div class='rankMedal rank3'>3</div>");
      } else (json || {}).error ? showMessage(json.error) : console.log('rankings error', json);
    });
  },
};

$(function () {
  var $panel = $('.whitePanel');
  $('#bigTabSelector a') /*.removeClass("loading")*/
    .click(function () {
      $panel.addClass('loading');
    })
    .each(function () {
      var $tab = $(this);
      if (window.location.href.indexOf($tab.attr('href')) != -1) {
        $panel.addClass('loading');
        $tab.addClass('selected') /*.addClass("loading")*/;
        $('.section').hide();
        var $content = $($tab.attr('id').replace('tab', '#sec')).show();
        sections[$tab.attr('href').split('/').pop()]($content); // run section-specific code
      }
    });
});
