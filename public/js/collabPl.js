/* global $ */

/**
 * client-side code for collaborative playlist pages
 * @author adrienjoly, whyd
 **/

$(function () {
  function searchUsers(q, cb) {
    submitSearchQuery(
      { q: q, /*uid: window.user.id,*/ format: 'json' },
      function (results) {
        if (typeof results == 'string') results = JSON.parse(results);
        cb(((results || {}).results || {})['user']);
      }
    );
  }

  function renderUserList(users) {
    if (!users || !users.length) return '';
    var resultsHtml = '';
    for (var i in users)
      resultsHtml +=
        '<li>' +
        '<div class="thumb" style="background-image:url(' +
        users[i].img +
        ')"></div>' +
        users[i].name +
        '</li>';
    return resultsHtml;
  }

  function DlgPlContributors($dlg) {
    var $results = $dlg.find('.searchResults');
    var quickSearch = new QuickSearch($dlg, {
      noMoreResults: true,
      noMoreResultsOnEnter: true,
      submitQuery: function (query, display) {
        // called a short delay after when a query was entered
        display('', true); // clear the result list and keep the searching animation rolling
        searchUsers(query, function (users) {
          console.log('resulting users', users);
          display(renderUserList(users), false); // stop the searching animation
        });
      },
      onEmpty: function () {
        //$results.html("");
      },
    });
  }

  window.dlgPlContributors = function (options) {
    options = options || {};
    var url = options.collabId
      ? '/playlist/' + options.collabId
      : window.location.href.split('?')[0];
    console.log(url + '/contributors');
    openRemoteDialog(url + '/contributors', 'dlgPlContributors', function (
      $dlg
    ) {
      new DlgPlContributors($dlg);
    });
  };
});
