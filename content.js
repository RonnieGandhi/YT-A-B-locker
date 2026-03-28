/**
 * YouTube Ad Blocker — Content Script
 *
 * Runs on every YouTube page and continuously removes ad elements from the DOM.
 * Handles:
 *   - Pre-roll / mid-roll video ads (skips them automatically)
 *   - Overlay ads inside the player
 *   - Banner ads in the feed / sidebar
 *   - Promoted / sponsored cards
 *   - Masthead ads
 *   - "Ad" badges and companion ads
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  const AD_SELECTORS = [
    /* ---- Video player ad overlays ---- */
    ".ad-showing",
    ".ytp-ad-module",
    ".ytp-ad-overlay-container",
    ".ytp-ad-overlay-slot",
    ".ytp-ad-image-overlay",
    ".ytp-ad-text-overlay",
    ".ytp-ad-skip-button-container",
    ".ytp-ad-player-overlay",
    ".ytp-ad-player-overlay-instream-info",
    ".ytp-ad-action-interstitial",

    /* ---- Page-level ad banners / cards ---- */
    "ytd-ad-slot-renderer",
    "ytd-banner-promo-renderer",
    "ytd-statement-banner-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-promoted-sparkles-text-search-renderer",
    "ytd-display-ad-renderer",
    "ytd-companion-slot-renderer",
    "ytd-action-companion-ad-renderer",
    "ytd-promoted-video-renderer",
    "ytd-player-legacy-desktop-watch-ads-renderer",
    "#masthead-ad",
    "#player-ads",
    "#panels > ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-ads']",

    /* ---- Search result ads ---- */
    "ytd-search-pyv-renderer",

    /* ---- Sidebar / related ads ---- */
    "#related ytd-ad-slot-renderer",

    /* ---- Mobile web ---- */
    "ytm-promoted-sparkles-web-renderer",
    "ytm-companion-ad-renderer",
  ];

  /* ---- Selectors that hint a video ad is currently playing ---- */
  const VIDEO_AD_INDICATORS = [
    ".ad-showing",
    ".ytp-ad-player-overlay",
    ".ytp-ad-player-overlay-instream-info",
  ];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /** Remove matching elements from the page. */
  function removeAdElements() {
    const selector = AD_SELECTORS.join(", ");
    document.querySelectorAll(selector).forEach((el) => {
      el.remove();
    });
  }

  /** If a video ad is playing, skip it instantly. */
  function skipVideoAd() {
    const player = document.querySelector("video.html5-main-video");
    if (!player) return;

    const adShowing = document.querySelector(".ad-showing");
    if (adShowing) {
      // Fast-forward the ad to the end so it finishes immediately.
      player.currentTime = player.duration || 9999;
      player.playbackRate = 16; // max speed fallback

      // Click the skip button if available.
      const skipBtn =
        document.querySelector(".ytp-ad-skip-button") ||
        document.querySelector(".ytp-ad-skip-button-modern") ||
        document.querySelector('button.ytp-ad-skip-button-container') ||
        document.querySelector(".ytp-skip-ad-button");
      if (skipBtn) skipBtn.click();
    }
  }

  /** Remove "Ad" overlay badges that sometimes persist. */
  function removeAdBadges() {
    document
      .querySelectorAll(
        ".ytp-ad-preview-container, .ytp-ad-message-container, .ytp-ad-visit-advertiser-button"
      )
      .forEach((el) => el.remove());
  }

  /** Main cleanup pass. */
  function cleanPage() {
    removeAdElements();
    skipVideoAd();
    removeAdBadges();
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  // Run an initial cleanup as early as possible.
  cleanPage();

  // Re-run when the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanPage);
  }

  // Use a MutationObserver to catch dynamically-injected ads.
  const observer = new MutationObserver((mutations) => {
    let shouldClean = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldClean = true;
        break;
      }
    }
    if (shouldClean) cleanPage();
  });

  // Start observing once body is available.
  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      // Body not yet available — wait a tick.
      requestAnimationFrame(startObserver);
    }
  }
  startObserver();

  // Periodic fallback: every 1 s catch anything the observer may miss.
  setInterval(cleanPage, 1000);

  // Listen for YouTube SPA navigation (pushState / popState).
  window.addEventListener("yt-navigate-finish", cleanPage);

  console.log("[YouTube Ad Blocker] Content script loaded ✔");
})();

