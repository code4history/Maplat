# Proposal: Restore QR Code in Share Dialog

## Goal
Restore the QR code generation functionality in the "Share" dialog, which was available in the legacy version but lost during modernization.
The dialog should display two QR codes:
1. **App URL**: The base URL of the application.
2. **View URL**: The current view URL (including hash/parameters).

## Why
The QR code functionality allows users to easily share the map URL to mobile devices, which is a key use case for field usage (e.g., historical walks). Restoring this legacy feature ensures feature parity with v0.10.x and improves usability.

## Changes
### UI Layer (`src/index.ts`)
- Import `qrcode` library (npm package `qrcode`).
- In the `share` control handler:
  - Calculate `uri` (App URL) and `view` (View URL) using the legacy logic.
  - Target `.qr_app` and `.qr_view` elements in the modal.
  - Generate QR codes into these elements using `QRCode.toCanvas` or `toDataURL`.
  - Handle cases where elements might be missing (add them if necessary or handle gracefully).
  - **Identify and hook up SNS Share Buttons**:
    - **Twitter (X)**: Implement sharing using `https://twitter.com/intent/tweet`.
    - **Facebook**: Implement sharing using `https://www.facebook.com/sharer/sharer.php`.
    - **Copy URL**: Implement clipboard copy using `navigator.clipboard.writeText`.
  - **Toast Notification**:
    - Implement a custom, lightweight toast notification for "URL Copied" feedback.
    - **Remove `iziToast` dependency**: Replace with a vanilla JS implementation.

### Dependencies
- Add `qrcode` to `dependencies`.
- Add `@types/qrcode` to `devDependencies`.
- Remove `iziToast` from `dependencies`.


## Verification
- "Share" button click opens modal.
- Modal contains two valid QR codes.
- Scans resolve to correct URLs.
