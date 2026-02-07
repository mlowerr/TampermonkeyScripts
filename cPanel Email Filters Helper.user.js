// ==UserScript==
// @name         cPanel Email Filters Helper
// @namespace    https://example.com/cpanel-email-filters
// @version      0.1.0
// @description  Adds helper actions on cPanel's email filters page: extract rules to a text file and add multiple rules from a list.
// @author       Your Name
// @match        *://*/frontend/*/mail/filters.html*
// @include      *://*/cpsess*/frontend/*/mail/filters.html*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const UI_ID = "tm-cpanel-filters-bar";

  const downloadText = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const normalize = value => value.trim().toLowerCase();

  const getSelectedText = select => {
    if (!select) return "";
    const option = select.selectedOptions?.[0];
    return option ? option.textContent.trim() : "";
  };

  const selectByText = (select, text) => {
    if (!select || !text) return false;
    const target = normalize(text);
    const options = Array.from(select.options);
    const exact = options.find(opt => normalize(opt.textContent) === target);
    const partial = options.find(opt => normalize(opt.textContent).includes(target));
    const chosen = exact || partial;
    if (chosen) {
      select.value = chosen.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  };

  const collectRuleRows = () => {
    const candidates = Array.from(
      document.querySelectorAll("tr, .ruleRow, .filterRow, .rule, .fieldset")
    );

    return candidates
      .map(row => {
        const selects = row.querySelectorAll("select");
        const input = row.querySelector(
          "input[type=\"text\"], input:not([type])"
        );
        if (selects.length >= 2 && input) {
          return { row, selects, input };
        }
        return null;
      })
      .filter(Boolean);
  };

  const findAddRuleButton = () => {
    const buttons = Array.from(
      document.querySelectorAll("button, input[type=\"button\"], input[type=\"submit\"], a")
    );

    return buttons.find(button => {
      const text = button.textContent || button.value || "";
      return /add\s+.*rule/i.test(text);
    });
  };

  const extractRules = () => {
    const rows = collectRuleRows();

    if (!rows.length) {
      alert("No rules detected on this page. Make sure you're on the Email Filters screen.");
      return;
    }

    const lines = ["Header\tOperator\tValue"];

    rows.forEach(({ selects, input }, index) => {
      const header = getSelectedText(selects[0]) || "(unknown header)";
      const operator = getSelectedText(selects[1]) || "(unknown operator)";
      const value = input.value?.trim() || "";
      lines.push(`${index + 1}. ${header}\t${operator}\t${value}`);
    });

    const now = new Date();
    const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadText(`cpanel-email-filters-${stamp}.txt`, lines.join("\n"));
  };

  const parseValues = raw =>
    raw
      .split(/[\n,]+/)
      .map(value => value.trim())
      .filter(Boolean);

  const addRuleRow = () => {
    const button = findAddRuleButton();
    if (button) {
      button.click();
      return true;
    }
    return false;
  };

  const addNewRule = () => {
    const header = window.prompt(
      "Header/Field to match (example: \"From\", \"Subject\", \"Any Header\"). Leave blank to keep current.",
      ""
    );
    if (header === null) return;

    const operator = window.prompt(
      "Operator to use (example: \"contains\", \"is\", \"does not contain\"). Leave blank to keep current.",
      "contains"
    );
    if (operator === null) return;

    const rawValues = window.prompt(
      "Enter value(s) for the rule (comma-separated or one per line).",
      ""
    );
    if (rawValues === null) return;

    const values = parseValues(rawValues);
    if (!values.length) {
      alert("No values provided. Nothing to add.");
      return;
    }

    const rowsBefore = collectRuleRows();
    if (!rowsBefore.length) {
      alert("Could not find existing rule rows to clone or update.");
      return;
    }

    values.forEach((value, index) => {
      if (index > 0) {
        if (!addRuleRow()) {
          alert("Could not find an 'Add Rule' button to create additional rows.");
          return;
        }
      }

      const rows = collectRuleRows();
      const target = rows[rows.length - 1];
      if (!target) return;

      if (header) selectByText(target.selects[0], header);
      if (operator) selectByText(target.selects[1], operator);

      target.input.value = value;
      target.input.dispatchEvent(new Event("input", { bubbles: true }));
      target.input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    alert("Rules added. Review them and click Save in cPanel to apply changes.");
  };

  const buildBar = () => {
    if (document.getElementById(UI_ID)) return;

    const bar = document.createElement("div");
    bar.id = UI_ID;
    Object.assign(bar.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      display: "flex",
      gap: "4px",
      padding: "4px 6px",
      background: "rgba(0, 0, 0, 0.85)",
      color: "#fff",
      fontFamily: "sans-serif",
      zIndex: 99999999,
      alignItems: "center"
    });

    const makeBtn = (label, onClick) => {
      const button = document.createElement("button");
      button.textContent = label;
      Object.assign(button.style, {
        background: "#2d6cdf",
        color: "#fff",
        border: "none",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px"
      });
      button.addEventListener("click", onClick);
      return button;
    };

    bar.appendChild(makeBtn("Extract All Rules", extractRules));
    bar.appendChild(makeBtn("Add New Rule", addNewRule));

    const note = document.createElement("span");
    note.textContent = "(Remember to click Save in cPanel)";
    note.style.fontSize = "11px";
    note.style.opacity = "0.8";
    bar.appendChild(note);

    document.documentElement.appendChild(bar);
  };

  const boot = () => {
    buildBar();
  };

  if (document.readyState !== "loading") {
    boot();
  } else {
    window.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  const observer = new MutationObserver(boot);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
