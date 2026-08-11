# Project Context

## Purpose
Maplat is a Historical Map/Illustrated Map Viewer that transforms map coordinates with nonlinear but homeomorphic projection, enabling collaboration with GPS/accurate maps without distorting original maps.
It consists of two repositories:
- `@maplat/core`: Handles logic (no UI).
- `@maplat/ui` (this repo): Handles UI and viewing features.

## Tech Stack
- **Language**: JavaScript (moving to TypeScript)
- **Bundler**: Webpack (moving to Vite/Rollup)
- **Framework**: Custom UI on top of OpenLayers/Mapbox GL JS
- **Core Dependencies**:
    - `@maplat/core` (currently local, moving to npm)
    - `@maplat/tin` (moving to `@maplat/transform`)
    - `ol` (OpenLayers)
    - `mapbox-gl` / `maplibre-gl`
- **Testing**: Jest (moving to Vitest/Playwright)
- **Linting**: ESLint, Prettier

## Project Conventions

### Code Style
- Prettier for formatting.
- ESLint for linting.
- Modernizing to ES Modules and TypeScript.

### Architecture Patterns
- **Core/UI Separation**: Logic in Core, Presentation in UI.
- **GPS Logic**: Moving towards Core-centric management (`alwaysGpsOn` support).

### Git Workflow
- `MergeGPS` is the current main branch.
- Feature branches merged via PR (or direct merge for this refactor).

## Domain Context
- **Nonlinear Projection**: Key feature allowing ancient maps to align with GPS.
- **GPS Handling**: "Mainstream" (battery save) vs "Side-stream" (always on) modes.

## Important Constraints
- **Performance**: Mobile-friendly.
- **Accuracy**: Coordinate transformation must be homeomorphic.

