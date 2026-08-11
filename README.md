<!-- SECTION 1: Header (logo, badges, title) -->
<p align="center">
  <img src="https://code4history.github.io/Maplat/page_imgs/maplat.png" alt="Maplat logo" width="200" />
</p>

<h1 align="center">Maplat</h1>

<p align="center">
  <a href="https://github.com/code4history/Maplat/actions/workflows/ci.yml"><img src="https://github.com/code4history/Maplat/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/@maplat/ui" alt="License" /></a>
</p>

<!-- SECTION 2: Elevator Pitch -->
## About Maplat

Maplat is the cool Historical Map / Illustrated Map Viewer.
It can transform each map's coordinates with a nonlinear but homeomorphic
projection, which lets the maps collaborate with GPS and accurate maps without
distorting the original map image.
The companion data editor is provided as another project,
[MaplatEditor](https://github.com/code4history/MaplatEditor/).
This project won the Grand Prize / Educational Effectiveness Prize / Visitors
Selection Prize on the Geo-Activity Contest 2018 held by the Ministry of Land,
Infrastructure, Transport and Tourism.

Maplat is open-source under the Apache License 2.0 (from version 0.12.2).

<!-- SECTION 3: Language switch link -->
**[Read this document in Japanese / 日本語で読む](README.ja.md)**

<!-- SECTION 4: Key Features -->
## Key Features

- Historical map / illustrated map viewer with nonlinear but homeomorphic coordinate transformation
- GPS / accurate map collaboration without distorting the original map image
- Pluggable base maps (OpenLayers-based; optional Mapbox GL JS / MapLibre GL JS for vector tiles)
- PWA-ready application shell (manifest, Service Worker, share, URL state)
- Viewer UI available in 11 languages: English, Japanese, German, Spanish,
  French, Indonesian, Korean, Thai, Vietnamese, Chinese (Simplified), and
  Chinese (Traditional)
- Open-source (Apache 2.0 from version 0.12.2) with a companion desktop editor (MaplatEditor)

<!-- SECTION 5: Quick Start -->
## Quick Start

<!-- release-pinned:start -->
> **Current release: `1.0.0-rc1`** — a release candidate. This block is the only place in
> this repository that carries a release version (ADR-0012); everything outside it is
> written against the 1.0 release.
> npm: [`@maplat/ui`](https://www.npmjs.com/package/@maplat/ui)
> [![npm rc](https://img.shields.io/npm/v/@maplat/ui/rc)](https://www.npmjs.com/package/@maplat/ui)

### Install

```bash
# pnpm (recommended)
pnpm add @maplat/ui@rc

# npm
npm install @maplat/ui@rc
```

### Minimal usage

```typescript
import { MaplatUi } from '@maplat/ui';
import '@maplat/ui/dist/maplat_ui.css'; // Import styles

const option = {
  appid: 'myMark',
  // ...
};

MaplatUi.createObject(option).then(app => {
  // Application initialized
});
```

### CDN (jsDelivr)

For usage directly in the browser without a bundler, you must load OpenLayers
before loading Maplat UI. Maplat Core is bundled, so you do not need to load it
separately.

```html
<!-- OpenLayers -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10/ol.min.css">
<script src="https://cdn.jsdelivr.net/npm/ol@10/dist/ol.min.js"></script>

<!-- Maplat UI -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@maplat/ui@1.0.0-rc1/dist/maplat_ui.css">
<script src="https://cdn.jsdelivr.net/npm/@maplat/ui@1.0.0-rc1/dist/maplat_ui.umd.js"></script>

<div id="map_div"></div>
<script>
  var appOption = {
    appid: "tm",
    // ... options
  };
  MaplatUi.createObject(appOption).then(function(app) {
    console.log("Maplat initialized");
  });
</script>
```

*Note: Make sure to use the latest compatible versions.*

### POI specification (`setting.pois`)

Maplat UI passes the `pois` field of an app/map setting straight through to
`MaplatApp.createObject`, so every form accepted by MaplatCore is accepted here
unchanged. The common ways to point at POI data are:

- **URL string** — `"pois/landmarks.geojson"`, fetched at initialization
- **Map-embedded POI** — an inline `FeatureCollection` written directly in the
  setting
- **Layer ref (wrapper)** — `{ layer: <URL|FeatureCollection>, hide?, title?,
  icon?, selectedIcon? }`, which references a layer and overrides only its
  presentation for this app without editing the referenced file

The full list of accepted forms, the override precedence, and the rule for
unknown keys are documented once in MaplatCore; see
[POI specification (`setting.pois`)](https://github.com/code4history/MaplatCore#poi-specification-settingpois)
in the MaplatCore README.

### Lifecycle

- See [docs/ui-core-lifecycle.md](docs/ui-core-lifecycle.md) for lifecycle phases and uiHooks.

### API reference

- **API signatures** (release-dependent): see [`docs/api/`](docs/api/)
- **Conceptual guide** (release-independent): see the
  [Wiki API-Reference](https://github.com/code4history/Maplat/wiki/API-Reference)

### Development

#### Setup
Clone the repository and install dependencies.

```bash
git clone https://github.com/code4history/Maplat.git
cd Maplat
pnpm install
```

#### Development Server
Start the development server with hot reload.

```bash
pnpm dev
```

Access `http://localhost:5173/` in your browser.

#### Build

```bash
pnpm build        # Build npm package (dist/)
pnpm build:demo   # Build demo application (dist-demo/)
```

#### Test

```bash
pnpm test         # Run tests (Vitest)
pnpm typecheck    # Run type checks (TypeScript)
pnpm lint         # Run linter and formatter (ESLint/Prettier)
```
<!-- release-pinned:end -->

<!-- SECTION 6: Prerequisites -->
## Prerequisites

> Derived from the `engines` field in `package.json` (ADR-0012: release-dependent).

- Node.js: v20 or v22 (LTS tested via GitHub Actions)
- pnpm: `>=9.0.0` (required; `package.json` enforces pnpm)

<!-- SECTION 7: Peer Dependencies -->
## Peer Dependencies

Maplat UI depends on the following libraries as peer dependencies. You must
install them manually.

- **OpenLayers (`ol`)** — `^9.0.0 || ^10.0.0` (peer dependency of Maplat
  `@maplat/ui` and MaplatCore `@maplat/core`)

```bash
pnpm add ol
```

If you use Vector Tiles, you may also need Mapbox GL JS or MapLibre GL JS:

- `mapbox-gl`: `^2.0.0 || ^3.0.0`
- `maplibre-gl`: `^5.0.0 || ^6.0.0`

<!-- SECTION 8: Ecosystem / Related Repositories -->
## Ecosystem

Maplat is part of the Maplat ecosystem by [Code for History](https://github.com/code4history).
See the full ecosystem map (8 repositories + product/corporate sites):

📖 **Ecosystem Map** — *(the diagram is currently kept in a private planning
repository; the Sister repositories table below is the public substitute)*

### Sister repositories

| Repository | License | npm | Role |
|---|---|---|---|
| [Maplat](https://github.com/code4history/Maplat) | Apache 2.0 | `@maplat/ui` | Main viewer |
| [MaplatCore](https://github.com/code4history/MaplatCore) | Apache 2.0 | `@maplat/core` | Core library |
| [MaplatTin](https://github.com/code4history/MaplatTin) | Apache 2.0 | `@maplat/tin` | TIN conversion |
| [MaplatTransform](https://github.com/code4history/MaplatTransform) | Apache 2.0 | `@maplat/transform` | Coordinate transform |
| [MaplatEditor](https://github.com/code4history/MaplatEditor) | Apache 2.0 | — | Data authoring tool (desktop) |
| [Chuci](https://github.com/code4history/Chuci) | MIT | `@c4h/chuci` | Multimedia swiper & viewer Web Components |
| [Quyuan](https://github.com/code4history/Quyuan) | MIT | `@c4h/quyuan` | GeoJSON template engine + multimedia viewer Web Components |
| [Weiwudi](https://github.com/code4history/Weiwudi) | MIT | `@c4h/weiwudi` | Service Worker for tile cache |

> MaplatEditor is the data authoring tool used to create the maps and POIs
> that the viewers above render. The Maplat ecosystem is end-to-end:
> author with MaplatEditor, serve with any of the viewer libraries.

<!-- SECTION 9: Nayuta links -->
## Links

| Audience | Link | Purpose |
|---|---|---|
| Project info / features / cases | <https://www.maplat.jp/en/> | Product site |
| Sponsor / business inquiry | <https://www.nayuta-inc.co.jp/en/> | Corporate site (Nayuta, Inc.) |

> ADR-0013: Apache-licensed repositories (this one) link to both sites.
> MIT-licensed sister repos (Weiwudi / Quyuan / Chuci) carry no Nayuta link.

<!-- SECTION 10: License -->
## License

Apache License 2.0 — see [LICENSE](LICENSE).

```
Copyright 2019-2026 Kohei Otsuka, Code for History / Nayuta, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

> **Patent notice**: The Maplat coordinate-transform technology is patented
> in Japan (Patent No. 6684776).

> **Past versions**: Versions before 0.12.2 were distributed under the
> Maplat Limited License 1.1. The license restoration to Apache 2.0 takes
> effect from version 1.0.0-rc1 onward. Earlier versions available on npmjs.com
> remain under their original limited-license terms.

<!-- SECTION 11: Contributors / Sponsors -->
## Contributors

This project exists thanks to all the people who contribute. <!--[[Contribute](CONTRIBUTING.md)].-->
<a href="https://github.com/code4history/Maplat/graphs/contributors"><img src="https://opencollective.com/maplat/contributors.svg?width=890&button=false" /></a>

## Sponsors

Maplat is supported by
<a href="https://www.locazing.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/locazing.png" width="150"></a>
<a href="https://www.thedesignium.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/logo_TheDesignium.png" width="150"></a>
<a href="https://www.browserstack.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/browserstack-logo-600x315.png" width="150"></a>
<a href="https://zender.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/Zender_logo_y_color.png" width="150"></a>
<a href="https://www.webimpact.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/webimpact.jpg" width="150"></a>

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/maplat#backer)]
<a href="https://opencollective.com/maplat#backers" target="_blank"><img src="https://opencollective.com/maplat/backers.svg?width=890"></a>

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/maplat#sponsor)]
