# Design: Border Button & SVG

## Architecture
### SVG Icons
We will use the existing `getIcon` helper in `src/icons.ts`.
Each control class in `src/maplat_control.ts` will be updated to:
1.  Check for custom `control_settings` images (legacy support).
2.  If no custom image, generate SVG HTML using `getIcon`.
3.  Remove `<img>` tag logic where it conflicts.

### Border Fill Logic
The `Border` functionality logic resides in `MaplatUi` (`src/index.ts` and `src/ui_init.ts`).
*   **Trigger**: `updateEnvelope()` is already called on `setShowBorder`.
*   **Swiper Integration**: `baseSwiper` and `overlaySwiper` need an event listener (`slideChange` or `transitionEnd`) that calls `updateEnvelope()`.
*   **Drawing**: `updateEnvelope()` iterates visible overlays. It uses OpenLayers `setEnvelope` (or equivalent). We need to ensure `setEnvelope` supports `fillColor` or add a new method for filling active overlay.
*   **Active Determination**: logic to find which slide is active in `overlaySwiper` and get its `mapID`.

## Alternatives Considered
*   **CSS only**: Cannot easily fill the map footprint (vector polygon) with CSS on the map canvas. Requires JS vector drawing.
