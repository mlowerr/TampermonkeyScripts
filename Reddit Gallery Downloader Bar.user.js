// ==UserScript==
// @name         Reddit Gallery Downloader Bar
// @namespace    https://example.com/reddit-gallery-dl
// @version      0.2.0
// @description  Adds a small bar at the top of every Reddit page with a 📥 Gallery button that downloads all full‑resolution images in a gallery post.
// @author       Your Name
// @match        *://*.reddit.com/*
// @exclude      *://*.reddit.com/chat/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // ──────────────────────────────
  // Helper: build the top bar (only once)
  // ──────────────────────────────
  function buildBar() {
    if (document.getElementById("rgd-bar")) return; // already exists

    const bar = document.createElement("div");
    bar.id = "rgd-bar";
    Object.assign(bar.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      display: "flex",
      gap: "1px",
      padding: "1px 1px",
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
        background: "#ff4500",
        color: "#fff",
        border: "none",
        padding: "1px 1px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "8px"
      });
      b.addEventListener("click", onClick);
      return b;
    };

    bar.appendChild(makeBtn("📥 Gallery", downloadGalleryImages));

    document.documentElement.appendChild(bar);
  }

  // ──────────────────────────────
  // Core logic (same as original bookmarklet)
  // ──────────────────────────────
  async function downloadGalleryImages() {
    const fullLinks = [
      ...new Set(
        [...document.querySelectorAll(".gallery-preview a.gallery-item-thumbnail-link")]
          .map(a => a.href)
          .filter(Boolean)
      )
    ];

    if (!fullLinks.length) {
      alert("No full‑resolution gallery images found on this page.");
      return;
    }

    const nameFromUrl = url => {
      try {
        return new URL(url).pathname.split("/").pop().split("?")[0] || "image";
      } catch {
        return "image";
      }
    };

    for (const link of fullLinks) {
      try {
        const blob = await (await fetch(link, { mode: "cors" })).blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = nameFromUrl(link);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      } catch (err) {
        console.error("Could not download", link, err);
      }
    }

    alert(`Finished – attempted to download ${fullLinks.length} full‑resolution image(s).`);
  }

  // ──────────────────────────────
  // Boot + observe SPA navigation
  // ──────────────────────────────
  function boot() {
    buildBar();
  }

  if (document.readyState !== "loading") {
    boot();
  } else {
    window.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  // Re‑inject bar on Reddit SPA navigations
  const observer = new MutationObserver(boot);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
