/* global $ */

$(function () {
  function loading(toggle) {
    $('body')
      .toggleClass('filtering', toggle)
      .append('<div id="loadingResults"><span>Loading results</span></div>');
    //$(".post").animate({"opacity": 0.1});
  }

  function applyFilter(toggle) {
    loading(false);
    $('.post.filtered, .noResults, #loadingResults').remove();
    $('.post, .btnLoadMore').toggle(!toggle) /*.css("opacity", 1)*/;
    //window.whydPlayer.updateTracks();
    window.whydPlayer.refresh();
  }

  var $box = $('#filterBox');

  var quickSearch = new QuickSearch($box, {
    noMoreResults: true,
    noMoreResultsOnEnter: true,
    submitQuery: function (query, display) {
      // called a short delay after when a query was entered
      // display(htmlResults, stillSearch) is to be called when new results are found
      display('', true); // clear the result list and keep the searching animation rolling
      loading(true);
      submitSearchQuery(
        { q: query, uid: window.pageUser.id, format: 'html' },
        function (resultsHtml) {
          if (!resultsHtml || typeof resultsHtml == 'object') resultsHtml = ''; // '<a href="#" class="noResults"><p>' + query + ' was not found</p></a>';
          applyFilter(true);
          var $results = $(resultsHtml).appendTo('.posts');
          $('.post:visible').addClass('filtered');
          display(resultsHtml, false); // stop the searching animation
          $results.ajaxify();
        }
      );
    },
    onEmpty: function () {
      applyFilter(false);
    },
  });

  function focusOnInput() {
    $box.find('.q').focus();
  }

  $('#btnFilter').on('click', function (e) {
    e.preventDefault();
    $('body').addClass('filterMode');
    setTimeout(focusOnInput, 200);
  });

  $box.find('.clear').on('click', function () {
    quickSearch.search('');
    $('body').removeClass('filterMode');
  });
});
