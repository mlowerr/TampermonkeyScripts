// ==UserScript==
// @name         Reddit – highlight visited links
// @namespace    https://reddit.com/
// @version      1.0
// @description  Draw a red box around links you have already clicked on Reddit.
// @author       you
// @match        https://www.reddit.com/*
// @match        https://old.reddit.com/*
// @match        https://reddit.com/*
// @grant        none
// ==/UserScript==

(() => {
  /* ----------------------------- Config ----------------------------- */
  const STORAGE_KEY = 'reddit_visited_links';
  const LINK_SELECTOR = 'a[href]'; // all anchor tags
  const CLASS_NAME = 'tmpr-visited-link'; // CSS class to add

  /* --------------------------- CSS Injection ------------------------ */
  const style = document.createElement('style');
  style.textContent = `
    .${CLASS_NAME} {
      border: 2px solid red !important;
      padding: 2px !important;
      border-radius: 3px !important;
    }
  `;
  document.head.appendChild(style);

  /* --------------------------- Utilities --------------------------- */
  /** Canonicalise a URL (drop hashes, strip trailing slashes). */
  const canonical = url => {
    const u = new URL(url, location.origin);
    u.hash = '';
    return u.href.replace(/\/+$/, '');
  };

  const getVisited = () =>
    new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));

  const saveVisited = set =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

  /* ------------------- Record the current page --------------------- */
  const maybeRecordCurrentPage = () => {
    const visited = getVisited();
    visited.add(canonical(location.href));
    saveVisited(visited);
  };

  /* ------- Record any link the user clicks before navigation ------- */
  const installClickRecorder = () => {
    document.addEventListener(
      'click',
      e => {
        const a = e.target.closest('a[href]');
        if (a) {
          const visited = getVisited();
          visited.add(canonical(a.href));
          saveVisited(visited);
        }
      },
      true // capture phase
    );
  };

  /* --------------------- Highlight visited links ------------------- */
  const highlightVisited = () => {
    const visited = getVisited();
    document.querySelectorAll(LINK_SELECTOR).forEach(a => {
      if (visited.has(canonical(a.href))) {
        a.classList.add(CLASS_NAME);
      }
    });
  };

  /* -------- Observe DOM mutations (infinite scroll, etc.) ---------- */
  const observeChanges = () => {
    const observer = new MutationObserver(highlightVisited);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  /* ------------------------------ Run ------------------------------ */
  maybeRecordCurrentPage();
  installClickRecorder();
  highlightVisited();
  observeChanges();
})();
