/**
 * YouTube Ad Blocker — Background Service Worker
 *
 * Keeps track of blocked request stats and provides them to the popup.
 */

// Track how many requests have been blocked this session.
let blockedCount = 0;

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  blockedCount++;
  chrome.storage.local.set({ blockedCount });
});

// Provide the blocked count to the popup on demand.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getBlockedCount") {
    chrome.storage.local.get("blockedCount", (data) => {
      sendResponse({ count: data.blockedCount || 0 });
    });
    return true; // keep the message channel open for async response
  }
});

// Reset count when extension is installed / updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blockedCount: 0 });
  console.log("[YouTube Ad Blocker] Extension installed / updated ✔");
});

