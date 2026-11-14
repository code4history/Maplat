# Migration from the legacy UI DOM (Shadow DOM)

The UI of `@maplat/ui` is now a single `<maplat-ui>` element (**Shadow DOM open**). The legacy
`MaplatUi` API remains as a compatibility layer, and its public shape (`new MaplatUi(option)`,
`createObject`, `waitReady`, `uiHooks`, `ui.core` and so on) is unchanged. What changes is
**where you apply your styles**.

- The legacy UI class names (`.ol-zoom`, `.swiper-slide`, `.modal_poi`, `.map-title span`, etc.)
  and the DOM that used to be built directly under `#map_div` are **gone**.
- The UI internals live inside a Shadow DOM, so page CSS selectors (such as `.modal_poi .title`)
  do not reach them. Style the UI with **`::part()`** and **CSS variables**.
- The compatibility layer for the legacy API **runs only on top of Core's `<maplat-app>`
  (layer A)**. Combining it with another layer A implementation such as Pro is out of scope
  (`<maplat-ui>` itself does not depend on a particular layer A).
- The map (OpenLayers) lives in `<maplat-app slot="map">`, a light DOM child of `<maplat-ui>`.
  Because the child element is in the light DOM, page CSS can target it with
  `maplat-ui > maplat-app` (`::slotted()` is a selector for use inside a Shadow DOM and is not
  used from page CSS; the internals are layer A's DOM).

## Mapping (legacy DOM / class → `::part` / attribute)

`src/element/maplat-ui.ts` and `src/element/slider.ts` are the source of truth for `part` names
(only the main ones are listed here).

| Legacy (DOM / class) | New (`::part` / attribute) | Notes |
| --- | --- | --- |
| `.maplat` (the whole `#map_div`) | `maplat-ui::part(frame)` | The frame. Positioned relative to `:host` |
| `.map-title` / `.map-title span` | `::part(map-title)` | The inner `.text` has no part (to change only the text, use `color` / `font` on `map-title`) |
| `.ol-zoom` / `.ol-zoom-in` / `.ol-zoom-out` | `::part(zoom)` / `::part(zoom-in)` / `::part(zoom-out)` | |
| `.home` | `::part(home)` | |
| `.ol-compass` (compass) | `::part(compass)` | |
| `.gps` | `::part(gps)` | |
| Map information button | `::part(info)` | |
| `.border` (map boundary button) | `::part(border)` | The color of the boundary lines drawn on the map is chosen per map by the element (CSS variables cannot change it) |
| `.hide_marker` | `::part(hide-marker)` | |
| Marker list button / screen | `::part(marker-list)` / `::part(marker-list-modal)` | List rows are `::part(marker-list-layer)` and `::part(marker-list-poi)` |
| Share button / screen | `::part(share)` / `::part(share-modal)` | `::part(share-button)` is the SNS / copy buttons inside the screen. QR codes are `::part(share-qr-app)` and `::part(share-qr-view)` (the QR SVG itself is `::part(qr-code)`) |
| `.ol-slidernew input` (transparency) | `::part(slider)` | `<input type="range">` |
| `.base-swiper` / `.overlay-swiper` | `::part(map-slider)` | Cards are `::part(map-slide)` (the selected one is `map-slide map-slide-selected`). The previous / next buttons are `::part(map-slider-prev)` / `::part(map-slider-next)` |
| `.swiper-slide` | `::part(map-slide)` | Not Swiper's DOM (each card is a button) |
| `.ol-ctx-menu-container` (context menu) | `::part(poi-menu)` | Items are `::part(poi-menu-item)`. The chooser for overlapping POIs is the same component |
| `.modalBase` such as `.modal_poi` | `::part(poi-modal)`, `::part(share-modal)`, `::part(help-modal)`, `::part(map-info-modal)`, `::part(marker-list-modal)`, `::part(gps-modal)`, `::part(splash)` | The legacy UI switched classes on a single modal. `::part(gps-modal)` is the GPS error screen; the out-of-map-range notice is now a toast (`::part(toast)`) |
| `.modal_poi .title` | `::part(poi-title)` | Also `share-title`, `help-title`, `map-info-title`, `marker-list-title`, `gps-title` |
| `.modal_poi .body` | `::part(poi-body)` | |
| POI media (Quyuan's slider `qy-swiper`, built on Chuci) | `::part(poi-media)` / `::part(poi-swiper)` | |
| POI `html` / `url` body | `::part(poi-html)` / `::part(poi-iframe)` | The `html` body is `poi-html`; the `url` body is the iframe `poi-iframe` |
| `.custom-toast` | `::part(toast)` | |
| Map information metadata | `::part(map-meta)` | Each row is `part="map-meta-<key>"` |
| IIIF bibliographic table (new) | `::part(map-meta-iiif)` | The last row of the map information. The inner tables are `::part(iiif-manifest)` and `::part(iiif-canvas)`, the copy date is `::part(iiif-copied-at)`, and the link to the Manifest is `::part(iiif-manifest-link)` |
| Cache section | `::part(map-cache)`, `::part(cache-heading)`, `::part(cache-size)`, `::part(cache-fetch)`, `::part(cache-delete)` | |

## CSS variables

| Variable | Where it applies |
| --- | --- |
| `--maplat-poi-media-theme-color` / `--maplat-poi-media-navigation-color` | Colors of the POI media (Quyuan's slider `qy-swiper`). Passed internally to Chuci's `--cc-slider-theme-color` / `--cc-slider-navigation-color` (default `#007aff`). Setting Chuci's variables directly on the page has no effect, because the declaration inside the Shadow DOM wins |
| `--maplat-envelope-color` | Only the **default color** of the dotted outline on the cards (`::part(map-slide)`) of maps that have a boundary, while boundaries are shown. A per-map color (one of the 25 colors the element assigns) wins when present, so it is normally not visible (every card with a boundary gets one, so in the current version a value set by the page is never visible). It affects neither the `::part(border)` button nor the boundary lines on the map |
| `--maplat-ui-control-gap` | The gap between adjacent buttons in the control columns (top left, bottom left, bottom right). Default `7px`. Touch devices use the same value. Set it on `<maplat-ui>` |

## Example

```css
/* Control buttons */
maplat-ui::part(zoom),
maplat-ui::part(home),
maplat-ui::part(gps) {
  background: rgba(0, 0, 0, 0.75);
}

/* Map title */
maplat-ui::part(map-title) {
  font-family: "Clarendon", serif;
  color: #402;
}

/* Colors of the POI media (Quyuan's slider) */
maplat-ui {
  --maplat-poi-media-theme-color: #a00;
  --maplat-poi-media-navigation-color: #a00;
}

/* Map switcher cards */
maplat-ui::part(map-slide-selected) {
  outline: 2px solid #a00;
}
```

## If you keep using the legacy API (`MaplatUi`)

- `new MaplatUi(option)`, `MaplatUi.createObject(option)`, `waitReady`, `ui.core` (Core's
  `MaplatApp`) and the 7 phases of `uiHooks` are unchanged. As before, decide the map size with
  page CSS. The `<maplat-ui>` host is `position: absolute; top/left/right/bottom: 0`, like the
  legacy map, and fills **its nearest positioned ancestor** (as before, `#map_div` itself may
  have a height of 0).
- `ui.contextMenu` is a limited facade. `extend`, `clear` and `on("open"/"close")` work, but
  `contextMenu.container` does not carry the legacy class name (`.ol-ctx-menu-container`).
- `ui.baseSwiper` and `ui.overlaySwiper` are limited facades. `slides` is an **array-like
  stand-in** shaped like the legacy one, not real DOM (Swiper's `.swiper-slide`).
- `ui.i18n` is a limited facade (`language`, `t`, `exists`, `changeLanguage`). i18next methods
  such as `addResourceBundle` print a warning and are ignored.
- `ui.sliderNew` is a facade for transparency. `set("slidervalue", 0..1)` writes the
  `transparency` attribute of `<maplat-ui>` (0 is opaque, 100 is transparent), and
  `get("slidervalue")` and `on("propertychange")` return the current value including user
  operations (the `transparency` written back by the child `<maplat-app>`). `setEnable`
  delegates to `<maplat-ui>`.
- `ui.addEventListener(type, fn)` now receives layer A events (`mapChanged`, `clickMarker`,
  `clickMap`, `lifecycle:*`, etc.) in the form `{ type, detail }` (the legacy `MaplatUi` did not
  dispatch them; `ui.core.addEventListener` still works as before).
- With the option `hideOutsidePois: true`, POIs outside the range of the old map are not drawn
  (the option is passed to the child as `appOption`, so it takes effect only at startup). To
  change it after startup, use the `hideOutsidePois` property (`hide-outside-pois` attribute) of
  `<maplat-ui>`.
- The `text` of `ui.showContextMenu([{icon, text, callback}])` is inserted as sanitized HTML
  (scripts and event attributes are dropped). When `ui.lastClickPixel` is absent, the menu is
  not suppressed as in the legacy UI; it opens at the last position where the map was clicked
  (or at the center of the map if there is none).
- **Type changes** (the legacy implementation was removed, so the compatibility layer defines
  its own types):
  - `ui.i18n` is not an i18next instance (type `i18n`) but a limited facade (type `LegacyI18n`),
    and `ui._t` is not i18next's `TFunction` but `(key, option?) => string`. Assignments such as
    `ui._t = …` and `ui.i18n = …` print a warning and are ignored (no exception is thrown).
    `ui.lang = "en"` flows to the `lang` attribute of `<maplat-ui>` and switches the display
    language (a `ui.lang = …` **before startup** only affects the value read until startup; the
    language after startup is decided by the element. The legacy UI also re-decided the
    language at startup, so the behavior is the same).
  - The type of `ui.sliderNew` is `LegacySliderFacade` (`element`, `get`, `set`, `setValue`,
    `setEnable`, `on`/`off`/`un("propertychange")`, plus `attach` and `detach`, which only the
    compatibility layer uses). It used to be an OL Control (`SliderNew`); now that it is a
    limited facade, `instanceof` and OL Control methods (`setMap`, `getMap`, etc.) are not
    available.
  - The type of `ui.contextMenu` is `LegacyContextMenuFacade`. It used to be a fork of
    ol-contextmenu (`ContextMenu`). The facade has only `container`, `Internal` (`openMenu`,
    `closeMenu`, `opened`), `extend`, `clear`, `push`, `pop`, `shift`, `countItems`, `isOpen`,
    `close`, `updatePosition`, `on`/`un`/`off` (plus `attach` and `detach`, which only the
    compatibility layer uses). It is a plain object, so any other name (such as the legacy
    `getDefaultItems`) is silently `undefined`, and calling it throws a `TypeError`.
  - The type of `ui.baseSwiper` and `ui.overlaySwiper` is `SwiperInstance` (= `LegacySwiper`).
    Each entry of `slides` is not a real DOM element but a **stand-in** object with
    `dataset.swiperSlideIndex` and `classList.contains("selected")` (`el`, `slides`,
    `activeIndex`, `slideTo`, etc. work).
- The legacy UI CSS (bootstrap in `src/styles/ui.scss` and the UI part of `ol/ol.css`) is no
  longer bundled. The map (OpenLayers) CSS is still loaded by the entry point (`@maplat/ui`).
  `src/styles/*.scss` (`maplat-specific.scss`, `ui.scss`, `contextmenu.scss`) remain in the
  repository **only for backward compatibility of the legacy API** and have no effect on the
  look of `<maplat-ui>` (the new UI carries its own CSS inside its Shadow DOM). The distributed
  `dist/maplat_ui.css` now contains only the OpenLayers CSS (about 5 KB; previously about 494 KB
  including the legacy UI CSS), and the legacy SCSS reaches users only as source files shipped in
  the package (`src/` in `files`). They will be removed in a major version.
- **The legacy UI implementation itself has been removed** (`src/ui_init.ts`, `ui_marker.ts`,
  `ui_utils.ts`, `maplat_control.ts`, `contextmenu/`, `swiper_*`, `pwa_init.ts`,
  `pointer_images.ts`, `function.ts`, `index.legacy.ts`). There is now a single path that draws
  the screen, `<maplat-ui>`, and the legacy API is a compatibility layer on top of it. The
  dependencies `swiper`, `@turf/turf`, `bootstrap.native`, `i18next`, `i18next-http-backend` and
  `page` were also removed (`@c4h/weiwudi` stays because the Service Worker build uses it).

## See also

- [`<maplat-ui>` element API](maplat-ui-element.md)
- [Legacy `MaplatUi` class](maplat-ui.md)
- Lifecycle: [`docs/ui-core-lifecycle.md`](../ui-core-lifecycle.md)
- Source of truth for `part` names: `src/element/maplat-ui.ts`, `src/element/slider.ts`
