# Tampermonkey Scripts

A small collection of personal Tampermonkey userscripts aimed at improving everyday browsing experiences.

## File overview
- **README.md**: Explains the repository and summarizes each included userscript.
- **AGENTS.md**: Contributor notes for future agents working in this repository.
- **Reddit – highlight visited links-1.0.user.js**: Records visited Reddit links in `localStorage` and highlights them with a red outline, including links added via dynamic page changes.
- **Reddit Gallery Downloader Bar.user.js**: Injects a fixed header bar on Reddit that adds a 📥 Gallery button to download all full-resolution images from gallery posts and reappears on SPA navigation.
- **Speedy Sites (YouTube only).user.js**: Automatically sets YouTube playback speed (default `1.5x`, normal speed for live videos), provides a floating speed-control bar, and rehooks videos as the page changes.
- **cPanel Email Filters Helper.user.js**: Adds a helper bar on cPanel email filters pages to export existing rules and open a form-based multi-rule builder (header/operator/interaction/action), defaults new rules to `From` when available, normalizes bracketed email input for sender/recipient headers (including `To` and `Any Recipient`), and inserts fresh rule rows before writing each value.
