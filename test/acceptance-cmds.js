var assert = require('assert');
var { URL_PREFIX } = require('./fixtures.js');

const WAIT_DURATION = 10000;

// custom wdio / webdriver.io commands

browser.addCommand('injectJS', function async(scriptUrl) {
  return browser.execute(function (scriptUrl) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    document.body.appendChild(script);
  }, scriptUrl);
});

browser.addCommand('waitForReady', function async() {
  return browser.waitUntil(
    function () {
      return (
        browser.execute(function () {
          return document.readyState;
        }).value === 'complete'
      );
    },
    WAIT_DURATION,
    `page should be ready within 5 seconds`,
    500 // => will check every 500 milliseconds
  );
});

browser.addCommand('waitForLinkWithText', function async(text) {
  return browser.waitUntil(
    function () {
      return browser.execute(function (text) {
        return !!$("a:contains('" + text + "')")[0];
      }, text).value;
    },
    WAIT_DURATION,
    `a "${text}" link should be in the page within ${WAIT_DURATION /
    1000} seconds`,
    500 // => will check every 500 milliseconds
  );
});

browser.addCommand('clickOnLinkWithText', function async(text) {
  return browser.execute(function (text) {
    return $("a:contains('" + text + "')")[0].click();
  }, text);
});

browser.addCommand('waitForContent', function async(regex, context) {
  return browser.waitUntil(
    function async() {
      return $(context || 'body').then(elem => elem.getHTML()).then(content => {
        //console.log(content.length, content.substr(0, 10), regex.toString(), regex.test(content))
        return regex.test(content);
      });
    },
    WAIT_DURATION,
    `${regex.toString()} should be in the page within 5 seconds`
  );
});

browser.addCommand('clickOnContent', function (text) {
  return browser
    .element(`//*[contains(text(), '${text.replace(/'/g, "\\'")}')]`)
    .click();
});

browser.addCommand('clickOnVisibleSelector', function (selector) {
  $$(selector)
    .filter(node => node.isVisible())[0]
    .click();
  return browser;
});

// other helpers
/*
exports.takeSnapshot = function takeSnapshot() {
  var results = browser.checkDocument(); // http://webdriver.io/guide/services/visual-regression.html
  results.forEach((result) => {
    assert(result.isWithinMisMatchTolerance, 'a difference was find on a snapshot');
  });
};
*/
