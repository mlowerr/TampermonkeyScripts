# Agent Notes for TampermonkeyScripts

## Project summary
This repository contains a small set of personal Tampermonkey userscripts. Each `*.user.js` file is a standalone script intended to be installed in Tampermonkey and run in a browser. There is no build system, package manager, or automated test suite; edits are made directly in the userscript files and documented in the README.

## Repository layout
- `README.md`: High-level summary of the project and a brief overview of each userscript. Keep this in sync with the scripts present in the repo.
- `*.user.js`: Individual Tampermonkey userscripts. Update script metadata (`@name`, `@version`, `@match`/`@include`) when behavior changes.

## Working conventions
- Keep each script self-contained and focused on its target site.
- Preserve or increment the userscript version when modifying behavior.
- Favor minimal DOM manipulation and re-hook logic compatible with single-page apps.

## Ongoing maintenance requirements (must do)
- After completing each work request, review **this** `AGENTS.md` and update it if you learned new, useful project context.
- Every time you run, review and update `README.md` to keep it current with the repository contents.

## Current script context
- `cPanel Email Filters Helper.user.js` includes a form-driven rule builder (header/operator/interaction/action), defaults new rules to `From` when available, normalizes bracketed email addresses for sender/recipient headers (`From`, `To`, `Any Recipient`), and always inserts fresh rule rows before filling multi-value entries.
- Reddit scripts include: visited-link highlighting (`Reddit – highlight visited links`) and gallery image downloading via a fixed top bar (`Reddit Gallery Downloader Bar`).
- `Speedy Sites (YouTube only)` auto-applies playback speed (with live-video handling), shows a floating speed bar, and rehooks on dynamic page changes.
