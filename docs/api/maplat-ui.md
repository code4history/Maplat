# MaplatUi

The main class of `@maplat/ui`.

## Static Methods

- **`createObject(option: MaplatAppOption): Promise<MaplatUi>`**
  Creates a MaplatUi instance and returns a Promise that resolves when initialization is complete. This is the recommended way to create an instance.

## Constructor

- **`new MaplatUi(option: MaplatAppOption)`**
  Creates an instance but does not wait for initialization. You should wait for the `waitReady` property.

## Methods

- **`remove()`**: Destroys the application and releases resources.
- **`updateUrl()`**: Updates the URL to reflect current state (if `stateUrl` is enabled).

## Note: Shadow DOM

The UI is now rendered inside `<maplat-ui>` (Shadow DOM, open). The public shape of `MaplatUi`
(`createObject`, `waitReady`, `uiHooks`, `ui.core`, …) is unchanged, but the legacy UI's DOM class
names (`.ol-*`, `.swiper-*`, `.modal_*`, …) are gone; style the UI with `::part()` and CSS variables.
The compatibility layer for the legacy API only works on top of Core's `<maplat-app>`. See the
migration guide (Japanese): [旧 UI の DOM からの移行（Shadow DOM 化）](migration-ui-shadow-dom.md).
For the element itself (`<maplat-ui>`: attributes, properties, methods, events, and the
mapping from this class) see [`<maplat-ui>` element API](maplat-ui-element.md).

The legacy UI implementation (`src/ui_init.ts` and friends) has been removed; this class is **only** the
compatibility layer over `<maplat-ui>` (one code path draws the screen). The types of `ui.sliderNew`,
`ui.contextMenu`, `ui.baseSwiper`/`ui.overlaySwiper`, `ui.i18n` and `ui._t` are limited facades (see
"型の変化" in the migration guide).

## See also

- [`<maplat-ui>` element API](maplat-ui-element.md) — the Custom Element this class sits on top of
- [MaplatAppOption](maplat-app-option.md) — option object properties
- [UI core lifecycle](../ui-core-lifecycle.md) — lifecycle phases and uiHooks
- [Migration from the legacy UI DOM (Shadow DOM)](migration-ui-shadow-dom.md) — `::part` mapping
