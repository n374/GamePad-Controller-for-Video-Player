// This file contains the background script for the Chrome extension. 
// It listens for messages from the content script and manages the overall state of the extension.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setPlaybackSpeed") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "changePlaybackSpeed", speed: request.speed });
        });
    }
});