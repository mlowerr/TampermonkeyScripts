// ==UserScript==
// @name         Speedy Sites (YouTube only)
// @namespace    https://example.com/speedy-sites
// @version      0.3.0
// @description  Auto‑sets YouTube playback speed to 1.5× once the video is actually playing (unless live) and provides a floating speed‑control bar.
// @author       Your Name
// @match        *://www.youtube.com/*
// @icon         https://www.youtube.com/s/desktop/6e31c0c4/img/favicon_32x32.png
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // ──────────────────────────────
  // Configuration
  // ──────────────────────────────
  const CONFIG = {
    defaultRate: 1.5,
    liveRate: 1
  };

  // ──────────────────────────────
  // Helper: create & style the control bar
  // ──────────────────────────────
  function buildBar() {
    if (document.getElementById("speedy-sites-bar")) return; // once per page

    const bar = document.createElement("div");
    bar.id = "speedy-sites-bar";
    Object.assign(bar.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      display: "flex",
      gap: "8px",
      padding: "4px 8px",
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      fontFamily: "sans-serif",
      zIndex: 99999999,
      alignItems: "center"
    });

    const makeBtn = (label, onClick) => {
      const b = document.createElement("button");
      b.textContent = label;
      Object.assign(b.style, {
        background: "#444",
        color: "#fff",
        border: "none",
        padding: "4px 10px",
        borderRadius: "4px",
        cursor: "pointer"
      });
      b.addEventListener("click", onClick);
      return b;
    };

    [1, 1.5, 2].forEach(r => bar.appendChild(makeBtn(r, () => setRate(r))));

    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.placeholder = "rate";
    input.style.width = "60px";
    bar.appendChild(input);

    bar.appendChild(makeBtn("E", () => {
      const v = parseFloat(input.value);
      if (!isNaN(v) && v > 0) setRate(v);
    }));

    document.documentElement.appendChild(bar);
  }

  // ──────────────────────────────
  // Helper: set rate on all <video> tags
  // ──────────────────────────────
  function setRate(rate) {
    document.querySelectorAll("video").forEach(v => (v.playbackRate = rate));
  }

  // ──────────────────────────────
  // YouTube‑specific: detect live badge
  // ──────────────────────────────
  function youtubeIsLive() {
    const badge = document.querySelector("ytd-badge-supported-renderer span, .badge-style-type-live-now, .ytp-live-badge");
    return badge && /live/i.test(badge.textContent);
  }

  // ──────────────────────────────
  // Attach listener to apply speed when video is truly playing
  // ──────────────────────────────
  function hookVideo(video) {
    if (video.__speedyHooked) return;
    video.__speedyHooked = true;

    const applyRate = () => {
      if (video.readyState >= 2 && !video.paused) {
        const rate = youtubeIsLive() ? CONFIG.liveRate : CONFIG.defaultRate;
        setRate(rate);
        video.removeEventListener("playing", applyRate);
      }
    };

    video.addEventListener("playing", applyRate);
  }

  function scanAndHook() {
    document.querySelectorAll("video").forEach(hookVideo);
  }

  // ──────────────────────────────
  // Boot
  // ──────────────────────────────
  function boot() {
    buildBar();
    scanAndHook();
  }

  if (document.readyState !== "loading") {
    boot();
  } else {
    window.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  const obs = new MutationObserver(scanAndHook);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  const _pushState = history.pushState;
  history.pushState = function () {
    _pushState.apply(this, arguments);
    setTimeout(boot, 500);
  };
  window.addEventListener("popstate", () => setTimeout(boot, 500));
})();
