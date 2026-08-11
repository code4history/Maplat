# Function for Border Button

## Goal
1.  **Enforce SVG Defaults**: Ensure all UI controls (`Border`, `HideMarker`, `Zoom`, etc.) use embedded SVG icons (`getIcon`) by default.
    *   *Constraint*: Maintain support for legacy `<img>` tags **only if** a custom image path is provided in `control_settings`.
    *   *Cleanup*: Remove any hardcoded logic that might be injecting default PNG paths into `control_settings`.
2.  **Enhance Border Function**: When "Border" mode is active (`sb:1`):
    *   Draw the active overlay's footprint with a semi-transparent fill color matching its border.
    *   Update this fill dynamically when the overlay swiper changes active slides.
    *   Ensure correct initialization from URL/Local Storage.

## Why
*   **Modernization**: Transition built-in UI to SVGs to remove raster image dependencies and improve scaling.
*   **Usability**: Filled footprints provide better visual feedback for the "active" overlay map.

## Changes
*   **UI Controls**: Verify `src/maplat_control.ts` logic ensures `getIcon` is used unless `control_settings` explicitly overrides it. Remove unused `.png` imports/delegators if they are effectively dead code.
*   **Map Logic**: Update `src/index.ts` (specifically `updateEnvelope` and event listeners) to identify the active overlay and apply a fill style to its footprint.
*   **Events**: Hook into Swiper's `slideChange` event to trigger envelope updates.

## User Review Required
*   Confirm the fill opacity/style is satisfactory.

## Verification Plan
### Automated Tests
*   Run `pnpm build` to verify TS compilation and asset bundling.

### Manual Verification
*   **Border Fill**: Enable "Show Border" (`sb:1` or UI button) and verify the active overlay's footprint is filled with a semi-transparent color matching its border line.
*   **Swiper Sync**: Swipe the overlay slider and verify the fill moves to the new active map's footprint.
*   **Help Images**: Open the Help modal and verify that images (e.g. `home.png`, `plus.png`) are displayed correctly (not broken).
*   **Startup Restoration**: Load the app with `sb:1` in the URL and verify the border/fill renders correctly on startup without crashing.
