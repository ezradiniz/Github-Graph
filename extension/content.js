"use strict";

const START_ACTION = 'START';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === START_ACTION) {
    // Create a iframe and inject into github page
    // TODO: ???
    document.body.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', chrome.extension.getURL('app/app.html'));
    iframe.scrolling = 'no';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    document.body.appendChild(iframe);
  }
  return true;
});
