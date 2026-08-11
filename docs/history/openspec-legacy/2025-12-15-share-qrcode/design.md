# Design: Share QR Code

## Context
Legacy Maplat (v0.10.6) used `qrcode.js` to render two QR codes in the Share modal: one for the base app URL and one for the current view (deep link). This features was dropped.

## Solution
Use the modern `qrcode` npm package.
The legacy logic split the URL to handle `pwa` parameters and specific formatting. We will replicate this logic to ensure consistent behavior.

### URL Logic (Legacy Port)
```javascript
const base = location.href;
const parts = base.split("#!");
const path = parts.length > 1 ? parts[1].split("?")[0] : "";
const baseParts = parts[0].split("?");
let uri = baseParts[0];
const query = baseParts.length > 1 ? baseParts[1].split("&").filter(q => q !== "pwa").join("&") : "";

if (query) uri = `${uri}?${query}`;
let view = uri;
if (path) view = `${view}#!${path}`;
```

### Rendering
We will use `QRCode.toCanvas(element, text, options)` or `QRCode.toDataURL`.
Legacy targeted `.qr_app` and `.qr_view`.
We need to ensure the Modal HTML structure contains these.
If the underlying `@maplat/core` provides the HTML and it still has these classes (hidden or empty), we just target them.
If they are missing, we might need to verify if `@maplat/core` needs update or if we can inject them via DOM manipulation in `src/index.ts`.
*Assumption*: The HTML structure is likely preserved in Core or `ui.core` templates, as `maplat_core` css often controls visibility.

### Toast Notification
- **Requirement**: Display "URL copied" message.
- **Implementation**:
  - Create a simple DOM element (`div.custom-toast`) with fixed positioning (e.g., top-center or bottom-center).
  - CSS transition for opacity (fade in/out).
  - TS function `showToast(message: string)` that appends the element, waits 3s, then removes it.
  - Allows removal of `iziToast` library.

### Library
`qrcode` (node-qrcode) is the standard choice.
Options: `{ errorCorrectionLevel: 'H', width: 128 }` to match legacy.

