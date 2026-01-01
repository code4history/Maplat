![Maplat Logo](https://code4history.github.io/Maplat/page_imgs/maplat.png)

[![CI](https://github.com/code4history/Maplat/actions/workflows/ci.yml/badge.svg)](https://github.com/code4history/Maplat/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@maplat/ui)](https://www.npmjs.com/package/@maplat/ui)
[![License](https://img.shields.io/npm/l/@maplat/ui)](LICENSE)

# Maplat
Maplat is the cool Historical Map/Illustrated Map Viewer.  
It can transform each map coordinates with nonlinear but homeomorphic projection and makes possible that the maps can collaborate with GPS/accurate maps, without distorting original maps.  
Data editor of this solution is provided as another project, [MaplatEditor](https://github.com/code4history/MaplatEditor/).  
This project won Grand Prize / Educational Effectiveness Prize / Visitors Selection Prize on Geo-Activity Contest 2018 held by Ministry of Land, Infrastructure, Transport and Tourism.

**[Read this document in Japanese / 日本語で読む](README.ja.md)**

## Table of Contents
- [Maplat](#maplat)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Using npm/pnpm](#using-npmpnpm)
      - [Peer Dependencies](#peer-dependencies)
    - [Using CDN in Browser](#using-cdn-in-browser)
  - [Usage](#usage)
    - [ESM (EcmaScript Modules)](#esm-ecmascript-modules)
  - [API Documentation](#api-documentation)
    - [MaplatUi](#maplatui)
      - [Static Methods](#static-methods)
      - [Constructor](#constructor)
      - [Methods](#methods)
    - [MaplatAppOption](#maplatappoption)
  - [Data Editor](#data-editor)
  - [Development](#development)
    - [Setup](#setup)
    - [Development Server](#development-server)
    - [Build](#build)
    - [Test](#test)
  - [Contributors](#contributors)
  - [Backers](#backers)
  - [Sponsors](#sponsors)

## Prerequisites
Based on the `engines` field in `package.json`:

- **Node.js**: v20 or v22 (Recommended)
- **pnpm**: v9.0.0 or higher

## Installation

### Using npm/pnpm
This project recommends **pnpm**.

```bash
pnpm add @maplat/ui
```
Or if you use npm:
```bash
npm install @maplat/ui
```

#### Peer Dependencies
Maplat UI depends on the following libraries as peer dependencies. You must install them manually.

- **ol** (OpenLayers): v9.0.0 or v10.0.0+

```bash
pnpm add ol
```

If you use Vector Tiles, you may also need Mapbox GL JS or MapLibre GL JS:

- mapbox-gl: ^1.0.0 || ^2.0.0 || ^3.0.0
- maplibre-gl: ^3.0.0 || ^4.0.0

### Using CDN in Browser

For usage directly in the browser without a bundler, you must load OpenLayers before loading Maplat UI. Maplat Core is bundled, so you do not need to load it separately.

```html
<!-- OpenLayers -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10/ol.min.css">
<script src="https://cdn.jsdelivr.net/npm/ol@10/dist/ol.min.js"></script>

<!-- Maplat UI -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@maplat/ui@0.11.5/dist/ui.css">
<script src="https://cdn.jsdelivr.net/npm/@maplat/ui@0.11.5/dist/maplat-ui.umd.js"></script>

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

## Usage

### ESM (EcmaScript Modules)
```javascript
import { MaplatUi } from '@maplat/ui';
import '@maplat/ui/dist/ui.css'; // Import styles

const option = {
  appid: 'myMark',
  // ...
};

MaplatUi.createObject(option).then(app => {
  // Application initialized
});
```

## API Documentation

### MaplatUi
The main class.

#### Static Methods
- **`createObject(option: MaplatAppOption): Promise<MaplatUi>`**
  Creates a MaplatUi instance and returns a Promise that resolves when initialization is complete. This is the recommended way to create an instance.

#### Constructor
- **`new MaplatUi(option: MaplatAppOption)`**
  Creates an instance but does not wait for initialization. You should wait for the `waitReady` property.

#### Methods
- **`remove()`**: Destroys the application and releases resources.
- **`updateUrl()`**: Updates the URL to reflect current state (if `stateUrl` is enabled).

### MaplatAppOption
Key properties of the option object passed during initialization.

| Property           | Type                | Description                         |
| ------------------ | ------------------- | ----------------------------------- |
| `appid`            | `string`            | Application ID (Required)           |
| `pwaManifest`      | `boolean \| string` | Enable PWA manifest or specify path |
| `pwaWorker`        | `string`            | Service Worker path                 |
| `overlay`          | `boolean`           | Enable overlay mode                 |
| `enableHideMarker` | `boolean`           | Enable marker hiding                |
| `enableMarkerList` | `boolean`           | Enable marker list                  |
| `enableBorder`     | `boolean`           | Enable border display               |
| `stateUrl`         | `boolean`           | Enable URL state management         |
| `enableShare`      | `boolean`           | Enable share feature                |
| `mapboxToken`      | `string`            | Access token for Mapbox             |

## Data Editor
Please use [MaplatEditor](https://github.com/code4history/MaplatEditor/) for data creation.

## Development

### Setup
Clone the repository and install dependencies.
```bash
git clone https://github.com/code4history/Maplat.git
cd Maplat
pnpm install
```

### Development Server
Start the development server with hot reload.
```bash
pnpm dev
```
Access `http://localhost:5173/` in your browser.

### Build
```bash
pnpm build        # Build npm package (dist/)
pnpm build:demo   # Build demo application (dist-demo/)
```

### Test
```bash
pnpm test         # Run tests (Vitest)
pnpm typecheck    # Run type checks (TypeScript)
pnpm lint         # Run linter and formatter (ESLint/Prettier)
```

## Contributors

This project exists thanks to all the people who contribute. <!--[[Contribute](CONTRIBUTING.md)].-->
<a href="https://github.com/code4history/Maplat/graphs/contributors"><img src="https://opencollective.com/maplat/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/maplat#backer)]

<a href="https://opencollective.com/maplat#backers" target="_blank"><img src="https://opencollective.com/maplat/backers.svg?width=890"></a>


## Sponsors
Maplat is supported by 
<a href="https://www.locazing.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/locazing.png" width="150"></a>
<a href="https://www.thedesignium.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/logo_TheDesignium.png" width="150"></a>
<a href="https://www.browserstack.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/browserstack-logo-600x315.png" width="150"></a>
<a href="https://zender.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/Zender_logo_y_color.png" width="150"></a>
<a href="https://www.webimpact.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/webimpact.jpg" width="150"></a>

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/maplat#sponsor)]

Copyright (c) 2024-2026 Code for History
