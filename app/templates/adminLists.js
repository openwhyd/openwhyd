/**
 * template for management consoles based on lists
 * @author adrienjoly, whyd
 **/

var mainTemplate = require('../templates/mainTemplate.js');
var uiSnippets = require('../templates/uiSnippets.js');

function cleanInfoArray(_info) {
  var result = [];
  var info = _info && _info.join ? _info : [_info];
  for (let i in info)
    if (info[i]) result.push(/*uiSnippets.htmlEntities*/ info[i]);
  return result;
}

exports.AdminLists = function () {
  var lists = [];

  var renderList = function (items, title, actionNames, formParams) {
    var html = [];
    for (let i in items) {
      var u = items[i];
      var info = cleanInfoArray(u.info);
      html.push(
        '<p>' +
          (u.img
            ? '<img src="' + uiSnippets.htmlEntities(u.img) + '" />'
            : '') +
          '<div>' +
          (actionNames
            ? '<input type="checkbox" name="_id" value="' +
              (u._id || u.id) +
              '" />'
            : '') +
          (u.href ? '<a href="' + u.href + '">' : '') +
          '<span class="itemName">' +
          uiSnippets.htmlEntities(u.name) +
          '</span>' +
          (u.href ? '</a>' : '') +
          (u.nameSuffix ? '&nbsp;' + u.nameSuffix : '') +
          (info
            ? '<br/>&nbsp;<small>' +
              /*u.*/ info.join('<br/>&nbsp;') +
              '</small>'
            : '') +
          '</div>' +
          '</p>',
      );
    }
    html = html.join('\n');

    if (actionNames) {
      if (formParams)
        for (let i in formParams)
          if (formParams[i])
            // prevent null values
            html +=
              '<input type="hidden" name="' +
              i +
              '" value="' +
              formParams[i] +
              '" />';
      var buttons = '';
      for (let i in actionNames)
        buttons +=
          '<input type="submit" name="action" value="' +
          actionNames[i] +
          '"' +
          ' onclick="return confirm(\'Your are going to ' +
          actionNames[i] +
          " the following items(s):\\n' + getSelectedCheckbox(form._id) + '\\nAre you sure?')\" />";

      html = '<form method="post">' + buttons + html + buttons + '</form>';
    }

    return (
      '<div class="userList">' +
      (title ? '<h2>' + title + '</h2>' : '') +
      html +
      '</div>'
    );
  };

  var renderWideList = function (items, title, actionNames, formParams) {
    var html = [];
    for (let i in items) {
      var u = items[i];
      var info = cleanInfoArray(u.info);
      html.push(
        '<li>' +
          (u.img
            ? '<img src="' + uiSnippets.htmlEntities(u.img) + '" />'
            : '') +
          '<div>' +
          (actionNames
            ? '<input type="checkbox" name="_id" value="' +
              (u._id || u.id) +
              '" />'
            : '') +
          (u.href ? '<a href="' + u.href + '">' : '') +
          '<span class="itemName">' +
          uiSnippets.htmlEntities(u.name) +
          '</span>' +
          (u.href ? '</a>' : '') +
          (u.nameSuffix ? '&nbsp;' + u.nameSuffix : '') +
          (info
            ? '<br/>&nbsp;<small>' +
              /*u.*/ info.join('<br/>&nbsp;') +
              '</small>'
            : '') +
          '</div>' +
          '</li>',
      );
    }
    html = '<ul>' + html.join('\n') + '</ul>';

    if (actionNames) {
      if (formParams)
        for (let i in formParams)
          if (formParams[i])
            // prevent null values
            html +=
              '<input type="hidden" name="' +
              i +
              '" value="' +
              formParams[i] +
              '" />';
      var buttons = '';
      for (let i in actionNames)
        buttons +=
          '<input type="submit" name="action" value="' +
          actionNames[i] +
          '"' +
          ' onclick="return confirm(\'Your are going to ' +
          actionNames[i] +
          " the following items(s):\\n' + getSelectedCheckbox(form._id) + '\\nAre you sure?')\" />";

      html = '<form method="post">' + buttons + html + buttons + '</form>';
    }

    return (
      '<div class="wideList">' +
      (title ? '<h2>' + title + '</h2>' : '') +
      html +
      '</div>'
    );
  };

  // examples:
  //renderList(pendingTopics, "pending validation", ["validate"], {}),
  //renderList(validTopics, "in search index", null, {})

  return {
    addList: function (items, title, actionNames, formParams) {
      lists.push(renderList(items, title, actionNames, formParams));
    },

    addWideList: function (items, title, actionNames, formParams) {
      lists.push(renderWideList(items, title, actionNames, formParams));
    },

    addScript: function (html) {
      lists.push(
        ['<script>', '/*<![CDATA[*/', html, '/*]]>*/', '</script>'].join('\n'),
      );
    },
    renderPage: function (params = {}) {
      if (params.css) params.css.unshift('admin.css');
      else params.css = ['admin.css'];

      var out = [
        '<h1>' + params.title + '</h1>',
        '► <a href="/">home</a>',
        '► <a href="?' + new Date().getTime() + '">REFRESH</a>',
        lists.join('\n'),
        '<script>',
        '/*<![CDATA[*/',
        'function getSelectedCheckbox(buttonGroup) {',
        '   // Go through all the check boxes. return an array of all the ones',
        '   // that are selected (their position numbers). if no boxes were checked,',
        '   // returned array will be empty (length will be zero)',
        '   var retArr = new Array();',
        '   var lastElement = 0;',
        '   if (buttonGroup[0]) { // if the button group is an array (one check box is not an array)',
        '      for (let i=0; i<buttonGroup.length; i++) {',
        '         if (buttonGroup[i].checked) {',
        '            retArr.length = lastElement;',
        '            retArr[lastElement] = buttonGroup[i].value;',
        '            lastElement++;',
        '         }',
        '      }',
        "   } else { // There is only one check box (it's not an array)",
        '      if (buttonGroup.checked) { // if the one check box is checked',
        '         retArr.length = lastElement;',
        '         retArr[lastElement] = buttonGroup.value; // return zero as the only array value',
        '      }',
        '   }',
        '   return retArr;',
        '} // Ends the "getSelectedCheckbox" function"',
        '/*]]>*/',
        '</script>',
      ].join('\n');

      return mainTemplate.renderWhydFrame(out, params);
    },
  };
};
