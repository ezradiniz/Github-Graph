"use strict";

const START_ACTION = 'START';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === START_ACTION) {
      fetch(chrome.extension.getURL("/view/index.html"))
        .then(response => response.text())
        .then(html => document.body.innerHTML = html)
        .then(() => sendResponse({ status: 'DONE' }))
        .catch(() => sendResponse({ status: 'FAIL' }));
      }
  return true;
});
