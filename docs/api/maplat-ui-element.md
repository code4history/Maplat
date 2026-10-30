# `<maplat-ui>` element API signatures

> Release-dependent signatures for the `<maplat-ui>` Custom Element of
> `@maplat/ui`.
> The release these signatures track is listed in the release block of the
> [README](../../README.md#quick-start).
> For the legacy `MaplatUi` class see [`maplat-ui.md`](maplat-ui.md).
> For the `::part()` names and CSS variables see the
> [migration guide](migration-ui-shadow-dom.md) (Japanese).
> For the conceptual guide see the
> [Wiki API-Reference](https://github.com/code4history/Maplat/wiki/API-Reference).

`<maplat-ui>` is the element form of the Maplat viewer ("layer B"). It lays
the viewer — the map title, the two map sliders, the control buttons, the POI
balloon, the dialogs, the toast — over a `<maplat-app>` element ("layer A",
the map itself) and uses **only the public surface** of that element. It
therefore runs on either implementation of `<maplat-app>`: MaplatCore
(`@maplat/core/element`, `implementation: "core"`) and the commercial
MaplatCore-Pro (`implementation: "core-pro"`). Which one it runs on is decided
by the page, by what it imports.

The legacy `MaplatUi` class remains available in the 1.x releases as a
compatibility layer on top of this element; see
[Relationship to the `MaplatUi` class](#relationship-to-the-maplatui-class).

## Getting started

```typescript
import 'ol/ol.css';               // REQUIRED by MaplatCore: OpenLayers CSS
import '@maplat/core/element';    // layer A: registers <maplat-app> (Core; for Core-Pro import its entry instead)
import '@maplat/ui/element';      // layer B: registers <maplat-ui> (side effect)
```

```html
<!-- minimal: reads the setting file apps/morioka.json; the <maplat-app> child is created for you -->
<maplat-ui app-id="morioka" lang="en" enable-share enable-border></maplat-ui>

<script type="module">
  const ui = document.querySelector('maplat-ui');
  ui.poiTemplate = '<h3>{{ name }}</h3>';       // property-only key, passed to the child
  await ui.ready;
  ui.addEventListener('mapChanged', (e) => console.log(e.detail.mapID)); // layer-A event, bubbles through
  console.log(ui.app.currentMapId, ui.currentLang);
</script>
```

```html
<!-- placing the <maplat-app> child yourself (slot="map" is required) -->
<maplat-ui lang="ja" enable-share state-url>
  <maplat-app slot="map" app-id="morioka" map-id="morioka_ndl" transparency="30" north-up="false"></maplat-app>
</maplat-ui>
```

- `@maplat/ui/element` is an ES module entry (`dist/element/index.js`); there
  is no UMD build of the element. It imports `@maplat/core/common` (and,
  lazily, `@c4h/chuci` for POI media and `qrcode` for the share QR code), so it
  needs a bundler or an import map. It does **not** import a layer-A
  implementation: the page imports `@maplat/core/element` (or the Core-Pro
  entry) itself. The element does not use OpenLayers; `ol/ol.css` and the
  `ol` / `mapbox-gl` / `maplibre-gl` peer dependencies belong to the layer-A
  implementation (the package also declares them for the legacy class entry).
- The element renders its own parts into a **Shadow DOM (`mode: "open"`)**.
  The map is the light-DOM child `<maplat-app slot="map">`: if such a child
  exists it is used, otherwise the element creates one as its own light-DOM
  child (so page CSS and the layer-A keys written on the child keep working).
  A `<maplat-app>` child without `slot="map"` is not used, and the element
  then creates one more `<maplat-app slot="map">`: the page ends up with **two
  maps**, so always put `slot="map"` on a child you place yourself. The element
  looks for the child **only when it is connected to the document** (not when
  the children change later): to swap the child, remove the element, replace
  the child, and attach the element again. When the element is connected while
  the HTML is still being parsed, it waits for `DOMContentLoaded` before
  looking for the child. The element does not touch the inside of the child.
- The element is the viewer's box. Default style (inside the Shadow DOM):
  `:host { display: block; position: relative; height: 400px; overflow: hidden }`
  and `:host([hidden]) { display: none }`. The font family, the font size and
  the colour are **inherited from the page** (the element sets none of them;
  the size of the controls follows the page font size). The child
  `<maplat-app>` is stretched to fill the box
  (`position: absolute; inset: 0; width: 100%; height: 100%` with
  `!important`), so size the map by sizing `<maplat-ui>`.
- `ready` resolves after the child's `ready`, once the language file is loaded
  and the parts (map list, title, buttons) are assembled. Before that, the
  three state methods (`setShowBorder`, `setHideMarker`, `openMarker`) do
  nothing, `mapsAt` resolves `[]`, and the other four methods work. Property
  writes are accepted at any time.
- Removing the element from the document detaches it from the child (the
  child disposes its map when it is removed as well). Moving it within the
  same task does not detach. `el.remove()` is the standard
  `HTMLElement.remove()`. Re-attaching re-binds the child and yields a new
  `ready` Promise.
- If another implementation has already registered `<maplat-ui>`, the import
  does not redefine it and warns
  (`<maplat-ui> is already defined by another implementation; …`). One layer-B
  implementation per document.
- TypeScript: `import type { MaplatUiElement } from '@maplat/ui/element'` is
  the element class (all keys below). `@maplat/core/common` also exports a
  `MaplatUiElement` interface that holds the layer-B surface only (it has no
  layer-A keys and no `compassAction`).
  `HTMLElementTagNameMap` is **not** augmented, so cast:
  `document.querySelector('maplat-ui') as MaplatUiElement`.
  `MaplatUiElement` is also exported as a **value** (the class itself), for
  example for `instanceof` or `customElements.get("maplat-ui") === MaplatUiElement`.
- Also exported from `@maplat/ui/element`: `MAPLAT_UI_VERSION` (the package
  version), `defineMaplatUi(tagName = "maplat-ui"): boolean` (registers the
  element under a tag name; the import has already registered the default
  tag, so call it with another name, and only when a different layer-B
  implementation holds the default tag — registering the same constructor
  twice, for example under a second name after the import, throws a
  `NotSupportedError`) and the types `CompassAction`, `MaplatMenuItem` and
  `MaplatMenuOptions`.

## Attributes and properties

Every attribute has a camelCase property that reads and writes the **same
value**. Attribute values are interpreted exactly as on `<maplat-app>` (see
[`maplat-app.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.md#attribute-values)):
boolean attributes are read by **value** (`""`, `"true"` or the attribute's
own name = `true`; `"false"` = `false`; absent = unspecified), numbers by
`Number()`, `""` is unspecified, and assigning `null` to a property removes
the attribute. `pwa-manifest` is the one mixed key: `""`, `"true"` or its own
name = `true`, `"false"` = `false`, anything else is a URL.

The element holds two groups of keys: its own (layer B) and the layer-A keys
it passes on to the child.

### Layer-B keys (attribute-backed)

| Attribute | Property | Type | Default | Startup | Change after startup |
|---|---|---|---|---|---|
| `lang` | `lang` (the HTML global property) | string | resolved, see [Languages](#languages) | no | Loads the language file and redraws the texts (asynchronous; `currentLang` changes at once) |
| `enable-share` | `enableShare` | boolean | `false` | no | Shows / hides the share button, the share row of the help and the QR in the POI balloon; turning it off closes the share dialog |
| `enable-border` | `enableBorder` | boolean | `false` | no | Shows / hides the border button (only when the child `supports("envelopes")`); turning it off also clears the drawn borders (`setShowBorder(false)`) |
| `enable-hide-marker` | `enableHideMarker` | boolean | `false` | no | Shows / hides the hide-marker button |
| `enable-marker-list` | `enableMarkerList` | boolean | `false` | no | Shows / hides the marker-list button (shown only while the map has POIs); turning it off closes the list |
| `enable-poi-html-no-scroll` | `enablePoiHtmlNoScroll` | boolean | `false` | no | From the next POI balloon opened: an `html` / `url` body gets no inner scroll |
| `presentation-mode` | `presentationMode` | boolean | `false` | no | `true` suppresses the toast shown on `outOfMap` and by the GPS button with `always-gps-on` (a `gps_out` result still shows its toast, and GPS errors still open the dialog) |
| `compass-action` | `compassAction` | `"auto"` \| `"north"` \| `"rotation"` | `"auto"` | no | What the compass button does: `north` = `resetDirection()` (north up), `rotation` = `resetRotation()` (screen rotation 0), `auto` = `north` when the child's `north-up` is `true`, otherwise `rotation`. Another value warns once and counts as `auto` |
| `tap-duration` | `tapDuration` | number (ms) | `3000` (`0` is valid) | no | From the next auto-hide of the controls |
| `tap-ui-vanish` | `tapUiVanish` | boolean | `false` | no | The controls are always hidden while the map is dragged, whatever this key says, and come back `tap-duration` after the map stops. This key decides only whether a **tap** on the map hides them: with `true` a tap hides them (they come back after `tap-duration`, or at the next tap while hidden) |
| `set-document-title` | `setDocumentTitle` | boolean | `true` | no | Whether `document.title` is set to the setting file's `appName` (in the current language) |
| `state-url` | `stateUrl` | boolean | `false` | **yes** | — (reads and writes the state in `location.hash`; see [State URL](#state-url)) |
| `pwa-manifest` | `pwaManifest` | boolean or string | unspecified (PWA off) | **yes** | — (`true` = `./pwa/${appId}_manifest.json`, a string = the manifest URL) |
| `pwa-worker` | `pwaWorker` | string | `./service-worker.js` | **yes** | — |
| `pwa-scope` | `pwaScope` | string | `./` | **yes** | — |
| `app-envelope` | `appEnvelope` | boolean | `false` | **yes** | — (development aid: logs the bounding box of all maps with an envelope once, `This app's envelope is: …`) |

The `enable-*` and `presentation-mode` keys are the former UI-only
`appOption` keys; `tap-duration` and `tap-ui-vanish` are the former layer-A
feature keys (`tapUIVanish` is now `tap-ui-vanish`). `set-document-title` and
`compass-action` are new with the element (`compass-action` is not in the
layer-B key table of the contract; this implementation decides which method
the compass calls).

### Layer-B keys (property-only)

| Property | Type | Startup | Note |
|---|---|---|---|
| `restore` | `Restore` + `showBorder?: boolean`, `openedMarker?: string` | yes | The layer-A keys of `Restore` (`mapID`, `backgroundID`, `position`, `transparency`, `hideMarker`, `hideLayer`) go to the child; `showBorder` and `openedMarker` are applied by the element at startup (with `restore-session` and no `restore`, the saved `showBorder` and `hideMarker` are used instead). Assigning the extension keys after startup warns once and is ignored (`… are read only at startup; the change was ignored (use setShowBorder() / openMarker()).`); the layer-A part is still passed on and follows the child's own rule. With `state-url`, a state in the URL **replaces** `restore` as a whole |
| `appOption` | object | yes | Migration entry: the whole legacy option object. It is passed **as is** to the child's `appOption` (layer-A keys). The element itself reads only `lang` (language resolution) and `appid` / `appId` (the default `pwa-manifest` path) from it; UI keys inside it (`enableShare`, `tapDuration`, …) are **not** applied — give them as attributes. Closes in the next major version |

### Layer-A keys passed to the child

All keys of `<maplat-app>` can be written on `<maplat-ui>`; the element passes
them to the child. The attribute-backed ones (18): `app-id`, `app-src`,
`map-id`, `transparency`, `no-rotate`, `north-up`, `home-margin-pixels`,
`always-gps-on`, `fake`, `enable-cache`, `restore-session`, `overlay`,
`debug`, `icon`, `selected-icon`, `no-center-marker`, `center-marker-src` and
the Pro-only `display-mode`. The property-only ones (12): `setting`,
`restore`, `restoreExtensionKeys`, `googleApiKey`, `mapboxToken`,
`maplibregl`, `mapboxgl`, `uiHooks`, `appOption`, `poiTemplate`, `poiStyle`,
`iconTemplate`. Their meaning, defaults and startup rules are those of
[`maplat-app.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.md#attributes-and-properties).

The rules of the hand-off:

- **The nearer one wins.** A key the child holds itself is never touched by
  the element; only keys the child does not hold are passed. "Held" is judged
  by the child's **attribute** for an attribute-backed key and by the child's
  **property** (`!== undefined`) for a property-only key. For the state keys
  (`map-id`, `transparency`, `display-mode`), which the child writes back to
  its own attributes, "held" is decided when the child is first bound.
- Attribute-backed keys are passed **as attributes**, property-only keys **as
  properties** (this keeps the child's own precedence, property > attribute).
- A key the element passed is remembered: changing it on `<maplat-ui>` later
  passes the new value again, and removing it (or assigning `null`) removes
  it from the child.
- **Mirroring.** When the child writes a state key back (`map-id` on every
  map change, `transparency` once per frame, `display-mode` on Core-Pro) and
  `<maplat-ui>` passed that key **and has the attribute itself**, the element
  copies the new value to its own attribute, so `ui.mapId` stays current. A
  state key that is not written on `<maplat-ui>` is not mirrored (the element
  does not add the attribute); keys the child holds itself are not mirrored
  either — read them from `ui.app`.
- The layer-A startup-only keys are locked by the **child**: writing them on
  `<maplat-ui>` after startup passes the value on, the child warns once and
  ignores it, and `ui.app.appId` keeps the startup value.
- `restoreExtensionKeys` passed to the child always includes `"showBorder"`
  (so `restore-session` restores the border state from `localStorage`).
- Keys the element passed are tied to the child they were passed to. The
  child is looked up only when the element is connected (see
  [Getting started](#getting-started)); if the element is attached again and
  binds a different child, it passes the keys to that child.

The setting file is read **once, by the child**. The element reads
`appName` (title and document title), `lang` (language) and `splash` (splash
image under `img/`) from the child's `appData`. It does **not** read the
feature (presentation) keys from the setting file — `tapDuration`,
`tapUIVanish`, `controls`, `noRotate`, `northUp`, `homeMarginPixels`, … —
give them as attributes or properties (of `<maplat-ui>` or of the child). If
the setting file still holds such a key, the child (MaplatCore) warns once per
key that it is a presentation setting and ignores it. Only the legacy class
path still reads them, with a deprecation warning.

### Startup-only keys of the element

The element locks five keys at startup: `stateUrl`, `pwaManifest`,
`pwaWorker`, `pwaScope` and `appEnvelope`. Once the element has started
(first connection), changing one of them — by attribute or by property — is
**ignored with a warning**, once per key:

```
<maplat-ui>: attribute "state-url" is fixed at startup and cannot be changed after the UI has started; the change was ignored.
```

The property keeps returning the value used at startup. A registered Service
Worker is not unregistered. To change them, replace the element.

The layer-B extension keys of `restore` (`showBorder`, `openedMarker`) are
also read only at startup and warn in the same way when assigned later;
`appOption` is locked by the child, with the child's warning.

## Controls and screens

What the element shows and when. Every item is a `::part()` (names in
parentheses); the main parts are in the
[migration guide](migration-ui-shadow-dom.md).

| Item | Shown | Does |
|---|---|---|
| Map title (`map-title`) | after `ready` | The current map's `officialTitle` / `title` / `label` in the current language |
| Map sliders (`map-slider` `data-kind="base"` / `"overlay"`, `map-slide`, …) | populated after `ready` | Left: the basemaps; right: the historical / overlay maps, in `listMaps()` order. Selecting a card calls `changeMap()`. The current map is marked `map-slide-selected`. `overlay="false"` does not hide the sliders |
| Zoom (`zoom`, `zoom-in`, `zoom-out`) | always; hidden on touch devices | `zoomBy(±1)` |
| Home (`home`) | always | `goHome()` |
| Compass (`compass`) | always | `resetDirection()` or `resetRotation()` per `compass-action`; the needle shows the real-world direction; dimmed when pressing would change nothing |
| GPS (`gps`) | always | `handleGPS()` (toggle; with `always-gps-on` always on). Dimmed while GPS is off |
| Transparency slider (`slider`) | after `ready`, unless the child's `overlay` is `false`; enabled only while a non-basemap is shown | `setTransparency()` (slider value 100 = opaque) |
| Map info (`info`) + dialog (`map-info-modal`) | button after `ready` | Metadata (`map-meta`), licence, and the tile-cache section (`map-cache`) when all three hold: the child `supports("tile-cache")`, the child's `enable-cache` is true, and `getMapCacheEnable()` is true for the current map |
| Border (`border`) | after `ready`, with `enable-border` and `supports("envelopes")` | `setShowBorder()`; draws the extent of the maps with `setEnvelopes()` (25 colours in `listMaps()` order) |
| Hide marker (`hide-marker`) | after `ready`, with `enable-hide-marker` | `setHideMarker()` |
| Marker list (`marker-list`) + dialog (`marker-list-modal`) | `enable-marker-list` and the map has POIs | Lists the POI layers (`marker-list-layer`) and POIs (`marker-list-poi`); a layer switch toggles `showPoiLayer` / `hidePoiLayer`, a POI row opens the balloon |
| Share (`share`) + dialog (`share-modal`) | after `ready`, with `enable-share` | See [Sharing](#sharing) |
| Help (`help`) + dialog (`help-modal`) | always (the button is there from the start, but the dialog opens only after `ready`) | The help text; the rows for share, border, hide-marker and marker-list appear with the matching `enable-*` |
| POI balloon (`poi-modal`, `poi-title`, `poi-body`, `poi-media`) | on `clickMarker` / `clickMarkers` with one POI, `openMarker()`, the list | Name, media (Chuci swiper), address, description; or the POI's `html` / `url`. A POI with `directgo` navigates instead. Selects the marker on the map |
| POI menu (`poi-menu`, `poi-menu-item`) | on `clickMarkers` with several POIs | Choose one of the overlapping POIs |
| GPS error dialog (`gps-modal`) | on GPS errors (denied, unavailable, timed out) | Title and message |
| Splash (`splash`) | at startup, only when no map is restored (`initialRestore.mapID` is empty) | `appName` and the `splash` image; hidden after 200 ms (1000 ms with an image) once the map is ready |
| Toast (`toast`) | `showToast()` and after copying a share URL | 1.5 s, at the bottom centre of the window (or next to the copied control) |
| Out-of-map toast (`toast`) | on `outOfMap` (unless `presentation-mode`), on a `gps_out` result, and when the GPS button is pressed outside the map with `always-gps-on` (unless `presentation-mode`) | 3 s, at the bottom centre of `<maplat-ui>`. Does not close open screens or move focus. The message says what happens: back to the default position, GPS turned off, or just out of map |

The controls, the transparency slider, the title and the map sliders are the
targets of the auto-hide: they hide while the map is dragged (always) and, with
`tap-ui-vanish`, on a tap on the map; they come back `tap-duration` after the
map stops.

## State (read-only properties)

- `ready: Promise<void>`
  - Resolves when the viewer is ready (see [Getting started](#getting-started)).
    Rejects if the child's `ready` rejects. A new Promise is created when the
    element is re-attached (the child is looked up again at that point).
- `implementation: "ui" | "ui-pro"`
  - The implementation name (`"ui"` for this package).
- `version: string`
  - The implementation's version (`@maplat/ui`'s version, `MAPLAT_UI_VERSION`).
- `app: MaplatAppElement | null`
  - The child `<maplat-app>` in use (its public surface only). `null` before
    the child is found or created.
- `currentLang: string`
  - The resolved language (see [Languages](#languages)).

## Methods (`MAPLAT_UI_METHODS`)

The 8 public methods. Before `ready`, `setShowBorder`, `setHideMarker` and
`openMarker` do nothing, `mapsAt` resolves `[]`, and `translateText`, `t`,
`getShareUrl` and `showToast` work.

- `translateText(fragment?: Localized): string | undefined`
  - Picks the `currentLang` value from a localized string
    (`"text"` or `{ ja: "…", en: "…" }`): the current language → `en` → the
    first non-empty language. `undefined` for `null` / `undefined`.
    (The former `MaplatUi.translate`; renamed so as not to clash with
    `HTMLElement.translate`.)
- `t(key: string, option?: object): string`
  - A UI string by key (`"control.zoom_in"`, `"html.share_title"`, …) in the
    current language, with `{{name}}` interpolation from `option`. Unknown keys
    return the key. Until the language file is loaded, the built-in dictionary
    (`ja`, `en`) answers.
- `setShowBorder(flag: boolean): void`
  - Shows or hides the extent of the maps (`setEnvelopes()` on the child;
    nothing is drawn on a child without `supports("envelopes")`). Written to
    the state as the extension key `showBorder` (so `updateState`,
    `restore-session` and the state URL `sb:` carry it).
- `setHideMarker(flag: boolean): void`
  - `hideAllMarkers()` / `showAllMarkers()` on the child (the child's state
    `hideMarker` is the truth; the state URL `hm:` follows).
- `openMarker(id: string): void`
  - Opens the POI balloon for the marker `id` (`getMarker(id)` on the child).
    Nothing happens for an unknown id. (The former `handleMarkerActionById`.)
- `mapsAt(point: LngLat, threshold = 10): Promise<string[]>`
  - The mapIDs of the maps whose envelope contains `point`
    (`{ longitude, latitude }`), smallest first. The current map is excluded,
    and so is a map whose envelope area is `threshold` times the viewport area
    or more (nothing is returned when the viewport corners cannot be
    converted). Computed from `getViewExtent()` and `getMapEnvelope()` of the
    child. (The former `xyToMapIDs(xy, threshold)`, which took map
    coordinates.)
- `getShareUrl(type: "app" | "view"): string`
  - `"app"`: `location.href` without query and hash. `"view"`: the current
    URL, after writing the current state into it when `state-url` is on.
- `showToast(message: string, target?: HTMLElement): void`
  - Shows `message` for 1.5 s inside the Shadow DOM: centred on `target` when
    given, otherwise at the bottom centre.

Any member of the element class that is not listed in this document is
internal (it serves the `MaplatUi` compatibility layer) and may change without
notice.

On MaplatCore-Pro the page can call the child's Pro-only methods through
`ui.app`, for example `ui.app.setDisplayMode(…)`; check
`ui.app.supports("display-mode")` first (MaplatCore does not define them).

## Events (`MAPLAT_UI_EVENTS`)

| Event | `detail` | When |
|---|---|---|
| `uiReady` | `{}` | Together with the resolution of `ready` (`bubbles: true`, `composed: false`) |
| all layer-A events (`mapChanged`, `changeViewpoint`, `clickMarker`, `lifecycle:*`, …) | those of [`maplat-app.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.md#events-maplat_app_events-element_own_events) | Dispatched by the child and **bubbling through** `<maplat-ui>` (the element does not re-dispatch them); listen on `<maplat-ui>` or on `ui.app` |

The element dispatches no other public event.

## Appearance (`::part()` and CSS variables)

The parts live in the Shadow DOM, so page selectors do not reach them; style
them with `maplat-ui::part(name)` and the CSS variables. The mapping from the
legacy class names, the list of parts and the CSS variables are in the
[migration guide](migration-ui-shadow-dom.md) (Japanese; it lists the main
parts only); the source of truth for the part names is
`src/element/maplat-ui.ts`, `src/element/slider.ts`, `src/element/share.ts`
(`qr-code`) and `src/element/poi-html.ts` (`poi-html`, `poi-iframe`).
The three variables are `--maplat-poi-media-theme-color` /
`--maplat-poi-media-navigation-color` (the colours of the POI media swiper,
default `#007aff`), `--maplat-envelope-color` (the default colour of the
dashed frame on the map-slider cards while borders are shown; a card that has
an extent always carries a per-map colour set by the element, which wins, so
a value set by the page is not visible in the current release — see the
migration guide) and `--maplat-ui-control-gap` (the gap between the control
buttons in the top-left, bottom-left and bottom-right columns, default `7px`;
the same value is used on touch devices). The child map is styled as
`maplat-ui > maplat-app` (its inside is the layer-A DOM).

```css
maplat-ui { width: 100%; height: 100vh; --maplat-poi-media-theme-color: #a00; }
maplat-ui::part(zoom), maplat-ui::part(home), maplat-ui::part(gps) { background: rgba(0, 0, 0, 0.75); }
maplat-ui::part(map-slide-selected) { outline: 2px solid #a00; }
```

## Languages

The UI texts exist in 11 languages: `de`, `en`, `es`, `fr`, `id`, `ja`,
`ko`, `th`, `vi`, `zh`, `zh-TW`. The language is resolved in this order
(`currentLang`):

```
lang attribute of <maplat-ui>  >  appOption.lang  >  the setting file's lang  >  the browser language  >  "en"
```

The element reads only its **own** `lang` attribute; `<html lang>` and other
ancestors are not inherited. `lang` is a layer-B key: it is not passed to the
child (the child keeps its own setting-file `lang`). `currentLang` is that
value with `zh-hk` / `zh-hant` turned into `zh-TW`; the language **file** is
looked up case-insensitively, an unknown region falls back to its base
language (`en-US` → `en`), and an unknown language to `en`.

Each language file is loaded with a dynamic `import()` when first needed (one
chunk per language). Until it is loaded, the built-in `ja` / `en` strings are
shown; a language that fails to load falls back to English with a warning.
Changing `lang` after startup redraws the texts, the title, the open dialogs
and the open balloon in the new language.

## Sharing, state URL and PWA

### Sharing

With `enable-share`, the share button opens a dialog with the app URL
(`getShareUrl("app")`) — copy to clipboard, X, Facebook, and a QR code
(`share-qr-app`) — and, when `state-url` is on, the URL of the current view
(`getShareUrl("view")`, `share-qr-view`). With `enable-share` **and**
`state-url`, the POI balloon also shows the QR code of the current view
(`poi-share`, `poi-qr`), which includes the opened POI. The QR encoder is
loaded on first use.

### State URL

With `state-url`, the element keeps the viewer state in `location.hash`, in
the same format as the legacy UI, so a URL made by one can be opened by the
other and by any Core / Core-Pro × UI combination:

```
#!s:<mapID>/b:<backgroundID>/t:<transparency>/x:<x>/y:<y>/z:<zoom>/r:<rotation>/sb:1/hm:1/hl:<hidden layers>/om:<opened POI>
```

- At startup the state in the URL is read and passed to the child as its
  `restore`: it is **stronger** than `restore`, `map-id` and `transparency`
  given to the element. The resulting map and transparency are mirrored to
  the element's own attributes only for the keys written on `<maplat-ui>`.
  If the child holds `restore` itself, or was created before the element
  could pass it, the state is applied with `changeMap()` after `ready`.
- A `hashchange` (back / forward, editing the URL) moves the viewer to that
  state.
- The URL is rewritten with `history.replaceState` (no history entries) on
  every map change, state change, end of a move, border toggle, and POI open
  / close.

### PWA

With `pwa-manifest`, at startup the element (once per element; the document's
links and the registration are not duplicated):

- adds `<link rel="manifest" href="…">` to `<head>` unless one exists
  (`pwa-manifest=""` / `"true"` → `./pwa/${appId}_manifest.json`, where
  `appId` is the child's `app-id`, else `appOption.appid`, else `"sample"`);
- registers the Service Worker `pwa-worker` (default `./service-worker.js`)
  with scope `pwa-scope` (default `./`) — the same worker file as the legacy
  UI, which holds the tile-cache receiver, so the relation to
  `<maplat-app enable-cache>` is unchanged (`enable-cache` alone registers
  nothing; the same worker and scope are not registered twice). A failure is
  logged (`Failed to register service worker: …`) and does not stop the
  viewer;
- adds `<link rel="apple-touch-icon">` from the manifest's `icons` unless one
  exists.

The three URLs must be `http(s)` or relative; otherwise the PWA is not
enabled, with a warning.

## Relationship to the `MaplatUi` class

In the 1.x releases `@maplat/ui` exposes both the legacy `MaplatUi` class and
the element. **The class is a compatibility layer on top of `<maplat-ui>`**:
one code path draws the screen, and the class keeps its outer shape
(`new MaplatUi(option)`, `createObject`, `waitReady`, the methods and fields,
`uiHooks`, `ui.core`). Two things set it apart from the element:

- The class **runs on Core's `<maplat-app>` only** (`ui.core` is Core's
  `MaplatApp`). Core-Pro provides the element API only; a page on Core-Pro
  uses `<maplat-ui>` directly.
- The class still reads the feature keys (`tapDuration`, `tapUIVanish`,
  `noRotate`, `northUp`, …) from the setting file, with a deprecation
  warning; the element does not.

The class is deprecated and **closes in the next major version (2.0)**, which
keeps the element API only.

| `MaplatUi` class | `<maplat-ui>` |
|---|---|
| `MaplatUi.createObject({ appid, div, enableShare, … })` / `new MaplatUi(option)` | `<maplat-ui app-id="…" enable-share>` + attributes / properties; `await ui.ready` |
| `ui.waitReady` | `ui.ready` |
| `appOption.div` | the element itself |
| `ui.core` (`MaplatApp`) | `ui.app` (the `<maplat-app>` element; its public surface only) |
| UI keys of `appOption` (`enableShare`, `tapUIVanish`, `stateUrl`, `pwaManifest`, …) | the attributes of the [layer-B table](#layer-b-keys-attribute-backed) (`tapUIVanish` → `tap-ui-vanish`) |
| `ui.translate(fragment)` | `ui.translateText(fragment)` (the class keeps `translate`) |
| `ui.t`, `setShowBorder`, `setHideMarker`, `getShareUrl`, `showToast` | same names |
| `ui.handleMarkerActionById(id)` | `ui.openMarker(id)` |
| `ui.xyToMapIDs(xy, threshold)` (map coordinates) | `ui.mapsAt({ longitude, latitude }, threshold)` |
| `ui.updateUrl()` | automatic with `state-url` (`getShareUrl("view")` also writes it) |
| `ui.remove()` | remove the element from the DOM |
| `ui.addEventListener(type, fn)` (`{ type, detail }`) | DOM `addEventListener` on `<maplat-ui>` (the layer-A events bubble through) |
| `ui.sliderNew`, `ui.contextMenu`, `ui.baseSwiper` / `overlaySwiper`, `ui.i18n`, `showContextMenu`, `modalSetting`, … | not on the element (internal) |
| Feature keys in the setting file: read, with a deprecation warning | not read |
