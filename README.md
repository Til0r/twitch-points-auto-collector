# <img src="/images/icon.svg" width="45" align="center"> Twitch Points Auto Collector

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/cackkknkjnchcemedibohdnlejfgdben)](https://chrome.google.com/webstore/detail/twitch-points-auto-collec/cackkknkjnchcemedibohdnlejfgdben)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/cackkknkjnchcemedibohdnlejfgdben)](https://chrome.google.com/webstore/detail/twitch-points-auto-collec/cackkknkjnchcemedibohdnlejfgdben)
[![GitHub License](https://img.shields.io/github/license/til0r/twitch-points-auto-collector/LICENSE)](LICENSE)

A lightweight Chrome extension that **automatically collects Twitch channel points** for you — no manual clicks needed. Just install it, open Twitch, and let it do the work.

<p align="center">
    <img src="/images/screenshot.png" alt="Twitch Points Auto Collector Screenshot" width="400"/>
</p>

## Features

- **Automatic collection** — Clicks the bonus points button the moment it appears
- **Per-channel stats** — Track how many times points were claimed for each streamer
- **Badge counter** — See your claim count right on the extension icon (formatted as 1.5K, 2.3M for large numbers)
- **Zero configuration** — Install and forget, it works out of the box

## Installation

1. Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/twitch-points-auto-collec/cackkknkjnchcemedibohdnlejfgdben)
2. Open any Twitch stream
3. That's it — points are collected automatically

## How It Works

The extension watches for the community points bonus button on Twitch streams using a `MutationObserver`. When the button appears, it clicks it automatically and records the claim. Stats are stored locally in `chrome.storage` and displayed in the extension popup, grouped by streamer.

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Interact with the current Twitch tab |
| `tabs` | Detect page navigation to re-attach the observer |
| `storage` | Persist per-channel claim stats locally |
| `*://www.twitch.tv/*` | Run the content script on Twitch pages |

## Contributing

Found a bug or have a feature idea? [Open an issue](https://github.com/til0r/twitch-points-auto-collector/issues) or submit a pull request.
