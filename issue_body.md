# Optimize Build and Asset Handling

## Background
The current Maplat build system relies on a mix of asset handling strategies. To modernize the build and reduce complexity, we need to support ESM/UMD output without CommonJS, and streamline how fonts and locales are handled.

## Goal
*   Remove CommonJS support.
*   Support ESM (for `script async` import) and UMD (for `script` tag).
*   Embed `parts` (images) during transpilation.
*   Load `locales` dynamically (not embedded) from `assets/locales`.
*   Replace `fonts` (Clarendon, FontAwesome) with vector outlines/embedded SVGs.

## Design: Build and Asset Optimization

### Architecture
The core change shifts from a "bundled everything" approach (for fonts/locales partialy) to a mixed approach:
*   **Code + Critical Assets (Icons/Images)**: Bundled into the JS file (ESM/UMD).
*   **Locales**: External JSON files, fetched at runtime.
*   **Fonts**: Eliminated. Text uses system fonts? (Implicit in "remove Clarendon"). Icons use SVGs strings embedded in code.

### Implementation Details

#### Icon System
Instead of `<i class="fa fa-home"></i>`, we will use a helper or direct SVG injection.
A new file `src/icons.ts` will valid export SVG strings for all used icons.
Components in `maplat_control.ts` will consume these strings.

#### Locale Loading
Using `vite-plugin-static-copy`, `assets/locales` will be copied to `dist/assets/locales`.
`MaplatCore` (or the UI initialization) needs to know where to find these.
*Assumption*: The core library supports loading locales from a path. If `MaplatUi` controls the init, it passes `appOption`.
User requirement says: "Load dynamically from external files".
We need to ensure `i18next` (or used library) backend is configured to fetch from the correct path relative to the script or a configured root.

#### Build Output
Vite `lib` mode will be used with `formats: ['es', 'umd']`.
CommonJS (`cjs`) will be excluded.

## Tasks
- [ ] Update `package.json` with `vite-plugin-static-copy` <!-- id: 0 -->
- [ ] Update `vite.config.js` for ESM/UMD and static copy <!-- id: 1 -->
- [ ] Create `src/icons.ts` with SVG definitions <!-- id: 2 -->
- [ ] Refactor `src/maplat_control.ts` to use SVGs <!-- id: 3 -->
- [ ] Remove font files and LESS font-face references <!-- id: 4 -->
- [ ] Verify locale loading and build outputs <!-- id: 5 -->
