/* globals chrome */

chrome.action.onClicked.addListener(function (tab) {
  console.log('clicked');
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['inject.js'],
  });
});
