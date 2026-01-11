# UI/Core Lifecycle (Maplat UI)

## Overview
Maplat UI relies on MaplatCore lifecycle phases to perform initialization in a
predictable order. Custom UI integrations can also attach to these phases via
`appOption.uiHooks`.

## Phase order
1. `lifecycle:setting-loaded`
2. `lifecycle:appdata-ready`
3. `lifecycle:ui-configure`
4. `lifecycle:core-dom-ready`
5. `lifecycle:ui-dom-ready`
6. `lifecycle:core-ready`
7. `lifecycle:ui-ready`

## What Maplat UI does per phase
- `appdata-ready`: initialize UI state from app options (flags, restore, DOM base)
- `ui-configure`: initialize i18n
- `ui-dom-ready`: translate DOM, initialize modal handlers, show splash, set document title
- `core-ready`: attach controls, map event listeners, and GPS handlers

## Hooks (uiHooks)
You can provide hooks in `appOption.uiHooks`:
- `onSettingLoaded`
- `onAppdataReady`
- `onUiConfigure`
- `onCoreDomReady`
- `onUiDomReady`
- `onCoreReady`
- `onUiReady`

Each hook may return a value or a Promise. Errors emit `lifecycle:error` and stop
further phases.

## Migration note
Legacy events (`appdata`, `uiPrepare`) are no longer used by the default UI flow.
