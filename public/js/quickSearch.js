/**
 * quickSearch module for whyd
 * @author adrienjoly, whyd
 **/

var SEARCH_DELAY = 300; // milliseconds between text entry and actual index request

function toggleClass(elem, className, showOrHide) {
  var newClassName = elem.className.replace(className, '');
  elem.className =
    newClassName +
    (showOrHide || newClassName == className ? ' ' + className : '');
  return elem;
}

var addEvent = window.addEventListener
  ? function (elem, type, method) {
      elem.addEventListener(type, method, false);
    }
  : function (elem, type, method) {
      elem.attachEvent('on' + type, method);
    };
/*
var removeEvent = window.removeEventListener ? function (elem, type, method) {
    elem.removeEventListener(type, method, false);
} : function (elem, type, method) {
    elem.detachEvent('on' + type, method);
};
*/

// native version, converted from jQuery implementation
function QuickSearch(searchForm, options) {
  var timeout;
  var prevVal = ''; // to prevent submitting the same query twice
  var selected = null; // index of selected result (hovered)
  var nbResults = 0; // number of results
  var options = options || {};
  var params = options.params || {};
  var cancelledQuery = false;
  //var searchForm = searchForm || document.getElementById("searchForm");
  searchForm = (searchForm && searchForm[0]) || searchForm; // compatibility with jQuery elements
  if (!searchForm || !searchForm.getElementsByClassName) {
    console.log('warning: searchForm not found', searchForm);
    return null;
  }
  var searchField = searchForm.getElementsByClassName('q')[0];
  var searchResults =
    searchForm.getElementsByClassName('searchResults')[0] ||
    document.createElement('div');
  var searchClear = searchForm.getElementsByClassName('searchClear')[0];

  function cancelQuery() {
    cancelledQuery = true;
    if (timeout) window.clearTimeout(timeout);
    timeout = null;
  }

  function hideResults() {
    searchResults.style.display = 'none';
  }

  hideResults();

  function unfocus() {
    hideResults();
    toggleClass(searchForm, 'grayOutline', false); // unfocus outline
  }

  function clearResults() {
    selected = null;
    nbResults = 0;
    //searchField.value = "";
    this.search('');
    unfocus();
  }

  function unhoverItem() {
    var liArray = searchResults.getElementsByTagName('li');
    for (let i = liArray.length - 1; i >= 0; --i)
      toggleClass(liArray[i], 'hover', false);
  }

  function hoverItem() {
    toggleClass(
      searchResults.getElementsByTagName('li')[selected],
      'hover',
      true
    );
  }

  function updateSelection(incr) {
    if (null == selected) return;
    unhoverItem();
    if (nbResults) selected = (nbResults + selected + incr) % nbResults;
    hoverItem();
  }

  function showResultsWhenAvail() {
    if (nbResults && nbResults > 0) searchResults.style.display = 'block';
    toggleClass(searchForm, 'grayOutline', true); // focus outline
  }

  /** called by search client, when the results where received and ready for display **/
  function onResults(html, stillSearching, destination) {
    if (cancelledQuery) return;

    if (searchClear && !stillSearching)
      toggleClass(searchClear, 'loading', false);

    (destination || searchResults).innerHTML = html;
    var anchors = searchResults.getElementsByTagName('li');
    searchResults.style.display = 'block';

    if (options.onResultClick) {
      function makeHandler(li) {
        var a = li.getElementsByTagName('a')[0];
        return function (e) {
          e.preventDefault();
          options.onResultClick(a.href, a);
          hideResults();
          return false;
        };
      }
      for (let i = anchors.length - 1; i >= 0; --i)
        addEvent(anchors[i], 'click', makeHandler(anchors[i]));
    }

    nbResults = anchors.length;
    if (!nbResults || params.noDefaultSelection) selected = -1;
    else {
      if (selected == null || selected < 0 || selected >= nbResults)
        selected = 0;
      updateSelection(0);
    }
  }

  function submitQuery() {
    cancelledQuery = false;
    searchClear && toggleClass(searchClear, 'loading', true);
    options.submitQuery(params.q, onResults);
  }

  function onQueryChange(event) {
    event = event || { keycode: -1 };
    if (event.keyCode == '13') {
      if (searchField.value.replace(/ /g, '') === '') {
        return;
      }
      // return
      hideResults();
      event.preventDefault();
      if (
        nbResults != null &&
        nbResults > 0 &&
        selected != null &&
        selected > -1
      ) {
        var a = searchResults.getElementsByTagName('a')[selected];
        if (a.onclick) a.onclick(event);
        if (options.onResultClick) return options.onResultClick(a.href, a);
        else window.location.href = a.href;
      } else if (options.noMoreResultsOnEnter || params.noMoreResultsOnEnter) {
        // do nothing
      } else if (!params.noMoreResults) {
        window.location.href =
          '/search?q=' + encodeURIComponent(searchField.value);
      } else {
        cancelQuery();
        hideResults();
      }
    } else if (event.keyCode == '27') {
      // esc
      hideResults();
    } else if (event.keyCode == '40') {
      // down
      event.preventDefault();
      updateSelection(1);
    } else if (event.keyCode == '38') {
      // up
      event.preventDefault();
      updateSelection(-1);
    } else {
      var val = searchField.value;
      if (prevVal == val) return;
      cancelQuery();
      nbResults = 0;
      selected = null;
      prevVal = params.q = val;
      if (val.length == 0) {
        hideResults();
        searchClear &&
          (toggleClass(searchClear, 'loading', false).style.display = 'none');
        options.onEmpty && options.onEmpty(this);
      } else {
        searchClear && (searchClear.style.display = 'block');
        timeout = window.setTimeout(submitQuery, SEARCH_DELAY);
        options.onNewQuery && options.onNewQuery(this);
      }
    }
  }

  addEvent(searchField, 'focus', showResultsWhenAvail);
  addEvent(searchField, 'click', showResultsWhenAvail);
  addEvent(searchField, 'keyup', onQueryChange);
  addEvent(searchField, 'input', onQueryChange);
  addEvent(searchField, 'onpaste', onQueryChange);

  this.cancelQuery = function () {
    cancelQuery();
    searchClear && toggle(searchClear, 'loading', false); // TODO: call toggleClass() instead
  };

  this.search = function (q) {
    searchField.value = q;
    onQueryChange.apply(searchField); //$searchField.each(onQueryChange);
  };

  this.clear = clearResults;
}
