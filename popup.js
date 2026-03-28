/**
 * YouTube Ad Blocker — Popup Script
 * Fetches the blocked-request count from the background worker and displays it.
 */

(function () {
  "use strict";

  const countEl = document.getElementById("blocked-count");

  chrome.runtime.sendMessage({ type: "getBlockedCount" }, (response) => {
    if (response && typeof response.count === "number") {
      countEl.textContent = response.count.toLocaleString();
    }
  });
})();

