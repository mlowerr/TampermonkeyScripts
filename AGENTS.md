# Agent Notes for TampermonkeyScripts

## Project summary
This repository contains a small set of personal Tampermonkey userscripts. Each `*.user.js` file is a standalone script intended to be installed in Tampermonkey and run in a browser. There is no build system, package manager, or automated test suite; edits are made directly in the userscript files and documented in the README.

## Repository layout
- `README.md`: High-level summary of the project and a brief overview of each userscript. Keep this in sync with the scripts present in the repo.
- `*.user.js`: Individual Tampermonkey userscripts. Update script metadata (name, version, @match/@include) when behavior changes.

## Working conventions
- Keep each script self-contained and focused on its target site.
- Preserve or increment the userscript version when modifying behavior.
- Favor minimal DOM manipulation and re-hook logic compatible with single-page apps.

## Ongoing maintenance requirements (must do)
- After completing each work request, review **this** `AGENTS.md` and update it if you learned new, useful project context.
- Every time you run, review and update `README.md` to keep it current with the repository contents.

## Recent context
- Updated the cPanel email filters helper to open a dropdown-driven form for adding rules, including AND/OR interactions, actions, and OR-linked value lists.
