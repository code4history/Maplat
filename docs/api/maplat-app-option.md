# MaplatAppOption

Key properties of the option object passed during initialization.

| Property           | Type                      | Description                                                                        |
| ------------------ | ------------------------- | ---------------------------------------------------------------------------------- |
| `appid`            | `string`                  | Application ID (Required)                                                          |
| `pwaManifest`      | `boolean \| string`       | Enable PWA manifest or specify path                                                |
| `pwaWorker`        | `string \| false \| null` | Service Worker path. `false` / `null`: do not register a Service Worker (see note) |
| `overlay`          | `boolean`                 | Enable overlay mode                                                                |
| `enableHideMarker` | `boolean`                 | Enable marker hiding                                                               |
| `enableMarkerList` | `boolean`                 | Marker List UI                                                                     |
| `enableBorder`     | `boolean`                 | Enable border display                                                              |
| `stateUrl`         | `boolean`                 | Enable URL state management                                                        |
| `enableShare`      | `boolean`                 | Enable share feature                                                               |
| `mapboxToken`      | `string`                  | Access token for Mapbox                                                            |

### Note on `pwaWorker`

- Omitted or `""`: registers `./service-worker.js` (unchanged). A non-empty string: registers that URL.
- `false` or `null`: does not register a Service Worker. The manifest `<link>` and the apple-touch-icon are still added when `pwaManifest` is set.
- A Service Worker that a browser has already registered is **not** unregistered. If a site switches to `false`, browsers that visited it before keep the old worker until it is removed.
- `enableCache` relies on the Service Worker. With `pwaWorker: false`, tile caching does not work (the map is still shown — the same as `pwaManifest: false` with `enableCache: true`).

## See also

- [MaplatUi class](maplat-ui.md) — static methods, constructor, instance methods
