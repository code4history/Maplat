# Optimize Build and Asset Handling

## Background
The current Maplat build system relies on a mix of asset handling strategies. To modernize the build and reduce complexity, we need to support ESM/UMD output without CommonJS, and streamline how fonts and locales are handled.

## Goal
*   Remove CommonJS support.
*   Support ESM (for `script async` import) and UMD (for `script` tag).
*   Embed `parts` (images) during transpilation.
*   Load `locales` dynamically (not embedded) from `assets/locales`.
*   Replace `fonts` (Clarendon, FontAwesome) with vector outlines/embedded SVGs.

## Changes
*   **Build**: Update Vite config to copy locales and output ESM/UMD.
*   **Assets**: Remove font files; ensure parts are imported; separate locales.
*   **Code**: Refactor `ui_init.ts` and `maplat_control.ts` to use SVG icons instead of font classes.
