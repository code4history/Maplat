# Change: Maplat Modernization & Refactor

## Why
The current codebase relies on outdated dependencies (`@maplat/tin`, local `@maplat/core`), legacy formats (UMD, frozen files), and split implementations (GPS logic). The goal is to modernize the stack (ESM, TS, Vite/Vitest), align with `@maplat/core`, and consolidate GPS logic while merging pending feature branches.

## What Changes
1.  **Branch Merge**: Merge `for_yamatokoriyama_merge` into `MergeGPS`.
2.  **Dependency Update**:
    -   Use `@maplat/core@0.11.0+` (npm).
    -   Replace `@maplat/tin` with `@maplat/transform`.
    -   Update `ol`, `mapbox-gl` as peer dependencies.
3.  **Modernization**:
    -   Switch to ES Modules (ESM) and TypeScript.
    -   Remove UMD and `freeze` build steps.
    -   Migrate build system to Vite/Rollup (aligning with Core).
4.  **Testing**: Migrate from Jest/Puppeteer to Vitest/Playwright.
5.  **Refactoring**: Consolidate GPS logic into Core (`alwaysGpsOn` support).

## Impact
-   **Breaking Changes**:
    -   Build output will be ESM only.
    -   Internal API usage of separate `tin` replaces with `transform`.
    -   GPS UI logic simplified (delegated to Core).
-   **Affected Files**: `package.json`, `webpack_config/` (removed/replaced), `src/**/*.js` (to `.ts`), `test/` (migrated).

## Phases
1.  **Merge Phase**: Secure content updates first.
2.  **Tooling & Dependencies**: Set up the new build/test environment.
3.  **Migration**: Port code to TS/ESM and fix dependency breakages.
4.  **Cleanup**: Remove legacy scripts and configurations.
