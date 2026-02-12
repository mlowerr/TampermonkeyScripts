// ==UserScript==
// @name         cPanel Email Filters Helper
// @namespace    https://example.com/cpanel-email-filters
// @version      0.2.3
// @description  Adds helper actions on cPanel's email filters page: extract rules to a text file and add multiple rules from a list.
// @author       Your Name
// @match        *://*/frontend/*/mail/filters/*
// @include      *://*/cpsess*/frontend/*/mail/*
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

  const HEADER_OPTIONS = [
    "From",
    "Subject",
    "To",
    "Reply Address",
    "Body",
    "Any Header",
    "Any Recipient",
    "Has Not Been Previously Delivered",
    "Is an Error Message",
    "List ID",
    "Spam Status",
    "Spam Bar",
    "Spam Score"
  ];

  const OPERATOR_OPTIONS = [
    "equals",
    "matches regex",
    "contains",
    "does not contain",
    "begins with",
    "ends with",
    "does not begin",
    "does not end with",
    "does not match",
    "is above (#s only)",
    "is not above (#s only)",
    "is below (#s only)",
    "is not below (#s only)"
  ];

  const INTERACTION_OPTIONS = ["or", "and"];

  const ACTION_OPTIONS = [
    "Discard Message",
    "Redirect to Email",
    "Fail With Message",
    "Stop Processing Rules",
    "Deliver to Folder",
    "Pipe to a Program"
  ];

  const optionMatches = (select, candidates) =>
    candidates.some(candidate =>
      Array.from(select.options).some(
        option => normalize(option.textContent) === normalize(candidate)
      )
    );

  const classifyRuleSelects = selects => {
    const interaction = selects.find(select =>
      optionMatches(select, INTERACTION_OPTIONS)
    );
    const operator = selects.find(select => optionMatches(select, OPERATOR_OPTIONS));
    const header = selects.find(select => optionMatches(select, HEADER_OPTIONS));

    if (header && operator) {
      return { header, operator, interaction };
    }

    const fallback = selects.filter(select => select !== interaction);
    return {
      header: header || fallback[0],
      operator: operator || fallback[1],
      interaction
    };
  };

  const collectRuleRows = () => {
    const candidates = Array.from(
      document.querySelectorAll("tr, .ruleRow, .filterRow, .rule, .fieldset")
    );

    return candidates
      .map(row => {
        const selects = Array.from(row.querySelectorAll("select"));
        const input = row.querySelector(
          "input[type=\"text\"], input:not([type])"
        );
        if (selects.length >= 2 && input) {
          const { header, operator, interaction } = classifyRuleSelects(selects);
          if (!header || !operator) return null;
          return { row, selects, header, operator, interaction, input };
        }
        return null;
      })
      .filter(Boolean);
  };

  const findActionSelect = () => {
    const selects = Array.from(document.querySelectorAll("select"));
    return selects.find(select => optionMatches(select, ACTION_OPTIONS));
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

  const findRowAddRuleButton = row => {
    if (!row) return null;
    const buttons = Array.from(
      row.querySelectorAll("button, input[type=\"button\"], input[type=\"submit\"], a")
    );
    return (
      buttons.find(button => {
        const text = (button.textContent || button.value || "").trim();
        const label = button.getAttribute("aria-label") || "";
        const title = button.getAttribute("title") || "";
        return (
          text === "+" ||
          /add/i.test(label) ||
          /add/i.test(title) ||
          /add/i.test(text)
        );
      }) || null
    );
  };

  const extractRules = () => {
    const rows = collectRuleRows();

    if (!rows.length) {
      alert("No rules detected on this page. Make sure you're on the Email Filters screen.");
      return;
    }

    const lines = ["Header\tOperator\tValue"];

    rows.forEach(({ header, operator, input }, index) => {
      const headerText = getSelectedText(header) || "(unknown header)";
      const operatorText = getSelectedText(operator) || "(unknown operator)";
      const value = input.value?.trim() || "";
      lines.push(`${headerText}\t${operatorText}\t${value}`);
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

  const isEmailHeader = headerValue => {
    const normalizedHeader = normalize(headerValue || "");
    return (
      normalizedHeader === "from" ||
      normalizedHeader === "to" ||
      normalizedHeader === "reply address" ||
      normalizedHeader === "any recipient" ||
      normalizedHeader.includes("email") ||
      normalizedHeader.includes("e-mail")
    );
  };

  const normalizeEmailValues = raw =>
    raw.replace(/</g, ",").replace(/>/g, "");

  const addRuleRow = () => {
    const rows = collectRuleRows();
    const lastRow = rows[rows.length - 1]?.row;
    const button = findRowAddRuleButton(lastRow) || findAddRuleButton();
    if (button) {
      button.click();
      return true;
    }
    return false;
  };

  const waitForRuleRows = (expectedCount, timeoutMs = 2000) =>
    new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        const rows = collectRuleRows();
        if (rows.length >= expectedCount) {
          resolve(rows);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          resolve(rows);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });

  const buildOptionList = (options, selected) =>
    options
      .map(option => {
        const isSelected = normalize(option) === normalize(selected);
        return `<option value="${option}"${isSelected ? " selected" : ""}>${option}</option>`;
      })
      .join("");

  const getSelectOptionTexts = select =>
    Array.from(select?.options ?? []).map(option => option.textContent.trim());

  const buildDialog = defaults => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999999";

    const panel = document.createElement("div");
    panel.style.background = "#fff";
    panel.style.color = "#111";
    panel.style.padding = "16px";
    panel.style.borderRadius = "8px";
    panel.style.width = "min(520px, 90vw)";
    panel.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
    panel.style.fontFamily = "sans-serif";

    panel.innerHTML = `
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Add Email Filter Rules</div>
      <label style="display: block; font-size: 12px; margin-top: 8px;">Header/Field</label>
      <select id="tm-rule-header" style="width: 100%; margin-top: 4px;">${buildOptionList(
        defaults.headerOptions,
        defaults.headerDefault
      )}</select>
      <label style="display: block; font-size: 12px; margin-top: 8px;">Operator</label>
      <select id="tm-rule-operator" style="width: 100%; margin-top: 4px;">${buildOptionList(
        defaults.operatorOptions,
        defaults.operatorDefault
      )}</select>
      <label style="display: block; font-size: 12px; margin-top: 8px;">Rule Interaction (AND/OR)</label>
      <select id="tm-rule-interaction" style="width: 100%; margin-top: 4px;">${buildOptionList(
        INTERACTION_OPTIONS,
        defaults.interactionDefault
      )}</select>
      <label style="display: block; font-size: 12px; margin-top: 8px;">Action</label>
      <select id="tm-rule-action" style="width: 100%; margin-top: 4px;">${buildOptionList(
        defaults.actionOptions,
        defaults.actionDefault
      )}</select>
      <label style="display: block; font-size: 12px; margin-top: 8px;">Values (comma or line separated)</label>
      <textarea id="tm-rule-values" rows="4" style="width: 100%; margin-top: 4px;" placeholder="value@example.com, other@example.com"></textarea>
      <div style="font-size: 11px; margin-top: 6px; color: #555;">
        Multiple values will be added as a single OR rule group.
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
        <button id="tm-rule-cancel" style="padding: 6px 10px;">Cancel</button>
        <button id="tm-rule-submit" style="padding: 6px 10px; background: #2d6cdf; color: #fff; border: none; border-radius: 4px;">Add Rules</button>
      </div>
    `;

    overlay.appendChild(panel);

    return { overlay, panel };
  };

  const addNewRule = () => {
    const rowsBefore = collectRuleRows();
    if (!rowsBefore.length) {
      alert("Could not find existing rule rows to clone or update.");
      return;
    }

    const headerOptions = getSelectOptionTexts(rowsBefore[0].header);
    const operatorOptions = getSelectOptionTexts(rowsBefore[0].operator);
    const headerDefault =
      headerOptions.find(option => normalize(option) === "from") ||
      getSelectedText(rowsBefore[0].header) ||
      headerOptions[0];
    const operatorDefault =
      getSelectedText(rowsBefore[0].operator) || operatorOptions[0];
    const interactionDefault =
      getSelectedText(rowsBefore[0].interaction) || INTERACTION_OPTIONS[0];
    const actionSelect = findActionSelect();
    const actionOptions = actionSelect
      ? getSelectOptionTexts(actionSelect)
      : ACTION_OPTIONS;
    const actionDefault = actionSelect
      ? getSelectedText(actionSelect)
      : ACTION_OPTIONS[0];

    const { overlay } = buildDialog({
      headerOptions,
      operatorOptions,
      headerDefault,
      operatorDefault,
      interactionDefault,
      actionOptions,
      actionDefault
    });

    const cleanup = () => overlay.remove();

    overlay.addEventListener("click", event => {
      if (event.target === overlay) cleanup();
    });

    overlay.querySelector("#tm-rule-cancel").addEventListener("click", cleanup);

    overlay.querySelector("#tm-rule-submit").addEventListener("click", async () => {
      const headerValue = overlay.querySelector("#tm-rule-header").value;
      const operatorValue = overlay.querySelector("#tm-rule-operator").value;
      const interactionValue = overlay.querySelector("#tm-rule-interaction").value;
      const actionValue = overlay.querySelector("#tm-rule-action").value;
      const rawValues = overlay.querySelector("#tm-rule-values").value;
      const processedValues = isEmailHeader(headerValue)
        ? normalizeEmailValues(rawValues)
        : rawValues;

      const values = parseValues(processedValues);
      if (!values.length) {
        alert("No values provided. Nothing to add.");
        return;
      }

      const effectiveInteraction =
        values.length > 1 ? "or" : interactionValue || "or";

      let rows = collectRuleRows();
      let targetCount = rows.length;

      for (const value of values) {
        if (!addRuleRow()) {
          alert("Could not find an 'Add Rule' button to create additional rows.");
          return;
        }
        targetCount += 1;
        rows = await waitForRuleRows(targetCount);
        const target = rows[rows.length - 1];
        if (!target) return;

        if (headerValue) selectByText(target.header, headerValue);
        if (operatorValue) selectByText(target.operator, operatorValue);
        if (target.interaction) {
          selectByText(target.interaction, effectiveInteraction);
        }

        target.input.value = value;
        target.input.dispatchEvent(new Event("input", { bubbles: true }));
        target.input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const activeActionSelect = findActionSelect();
      if (activeActionSelect && actionValue) {
        selectByText(activeActionSelect, actionValue);
      }

      cleanup();
      alert("Rules added. Review them and click Save in cPanel to apply changes.");
    });

    document.body.appendChild(overlay);
    overlay.querySelector("#tm-rule-values").focus();
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
