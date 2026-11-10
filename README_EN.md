# ImageCrate

<p align="center">
  <strong>Inspect web page images and batch-save only what you need.</strong><br>
  Chrome 116+ & Safari (iOS / macOS) Web Extension / Zero Dependencies / Privacy-First
</p>

<p align="center">
  <a href="https://github.com/TaigaShinohara/ImageCrate-public/actions/workflows/ci.yml"><img src="https://github.com/TaigaShinohara/ImageCrate-public/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Chrome-116%2B-brightgreen.svg" alt="Chrome 116+">
  <img src="https://img.shields.io/badge/Safari-iOS%20%2F%20macOS-blue.svg" alt="Safari iOS/macOS">
</p>

<p align="center">
  <strong>English</strong> | <a href="README.md">日本語</a>
</p>

---

## Overview

**ImageCrate** is an open-source browser extension designed to inspect images embedded in web pages and batch-download only the ones you choose.

Built from scratch using native Web APIs and Manifest V3, ImageCrate has **zero external runtime dependencies** (no analytics, no telemetry, no cloud servers). Everything runs entirely inside your browser.

---

## Key Features

- **Accurate Image Discovery**: Collects regular `<img>`, `<picture>` sources, `srcset` candidates, lazy-loaded images, CSS backgrounds, and open shadow DOM / same-origin frames.
- **Smart Ad & Tracker Filtering**: Shields against advertising networks, tracking pixels (1x1, beacon), and standard ad banner ratios by default, while preserving comics/webtoons and content graphics.
- **Preview & Inspection**: Thumbnail grid with full-size zoom modal, 1:1 pixel inspection, candidate comparison, and touch gestures (swipe between images, double-tap zoom).
- **Multiple Save Destinations**:
  - **Chrome Downloads**: Standard browser downloads into a custom subfolder (`ImageCrate/<Folder>/`).
  - **Folder Picker (File System Access API)**: Direct write into any selected local folder without polluting the browser download history.
  - **Zero-Dependency ZIP & Native Share**: Bundles selected images into a standard PKZIP 2.0 archive on the fly and integrates with the native iOS / Android Share Sheet (AirDrop, Save to Files, Google Drive, etc.).
- **Client-Side Format Conversion**: Convert on the fly to **JPEG**, **PNG**, or **WebP** directly inside the browser using native Canvas/OffscreenCanvas APIs.
- **Safari Web Extension Support**: Ready for iOS and macOS Safari via standard Swift wrapper (`safari-web-extension-converter`).

---

## Installation & Quick Start

### Google Chrome (Unpacked Extension)

1. Ensure Google Chrome 116 or higher is installed.
2. Open `chrome://extensions` in Chrome and enable **Developer mode** (toggle in top-right).
3. Click **Load unpacked** and select the **`extension/`** folder from this repository.
4. Navigate to any web page and click the ImageCrate icon from the extension toolbar.

### Safari on iOS / macOS

1. Run `npm run safari:convert` to generate the Xcode project under `safari/ImageCrate`.
2. Open `safari/ImageCrate/ImageCrate.xcodeproj` in Xcode.
3. Select your device (iPhone / iPad or Mac) and press **Run** (`Cmd + R`).
4. In iOS Settings → Safari → Extensions, enable **ImageCrate**.
5. In Safari, tap the extension menu (puzzle icon) to launch ImageCrate.

---

## Privacy & Permissions

- **Zero telemetry**: No analytics, accounts, or requests to the developer. Image bytes are fetched from the server that hosts each image.
- **No install-time access to every site**: The package does not declare required `host_permissions`. `optional_host_permissions` lists `http://*/*` and `https://*/*` only so Chrome can later grant a specific image host. Nothing is granted until you allow that host.
- **When access is requested**: Opening the extension does not ask for another site. Images on the same site as the page you opened can be previewed with the temporary access from the toolbar click. A different image host is requested only when you press that host's button, or when you save to a chosen folder, make a ZIP, or convert the file. Saving the original file into Chrome's download folder does not ask for site access.
- **Storage**: The current page address, image candidates, and save progress stay in Chrome session storage and are dropped when the browser session ends. A remembered save folder, if you leave that option on, stays in on-device IndexedDB.
- **Metadata**: Original-format saves keep camera metadata that was already in the file, which can include location. Conversion redraws the image on the device and is not a full anonymizer.

See [docs/PRIVACY.md](docs/PRIVACY.md) and the store privacy policy [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md).

---

## Development

ImageCrate requires **Node.js 22+**.

```sh
# Clone repository
git clone https://github.com/TaigaShinohara/ImageCrate-public.git
cd ImageCrate-public

# Run unit tests (built-in node:test runner)
npm test

# Run static checks (Manifest, CSP, module links, Safari compatibility)
npm run check

# Build the Chrome Web Store zip (contents of extension/ at the archive root)
npm run package

# Browser tests (requires devDependencies)
npm ci
npm run test:browser
npm run test:ux
npm run test:security
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development workflow, and pull request guidelines.

---

## License

This project is licensed under the [MIT License](LICENSE).

```
Copyright (c) 2026 ImageCrate contributors
```
