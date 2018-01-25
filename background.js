"use strict";

const START_TYPE = 'START';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === START_TYPE) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: request.type }, (response) => {
        sendResponse(response);
      });
    });
  }
  return true;
});
