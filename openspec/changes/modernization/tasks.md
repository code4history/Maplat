# Tasks: Maplat Modernization

## 1. Merge Phase
- [ ] 1.1 Checkout `MergeGPS` and merge `origin/for_yamatokoriyama_merge`.
- [ ] 1.2 Resolve conflicts if any.
- [ ] 1.3 Verify existing tests pass (sanity check).

## 2. Infrastructure Setup
- [ ] 2.1 Initialize TypeScript configuration (`tsconfig.json`).
- [ ] 2.2 Install Vite and Vitest, remove Webpack and Jest.
- [ ] 2.3 Update `package.json` scripts (`build`, `test`, `dev`).
- [ ] 2.4 Add `@maplat/transform` and remove `@maplat/tin`.
- [ ] 2.5 Update `@maplat/core` to `^0.11.0` (npm).
- [ ] 2.6 Move `ol`, `mapbox-gl`, `maplibre-gl` to `peerDependencies`.

## 3. Code Migration (Iterative)
- [ ] 3.1 Rename `.js` to `.ts` in `src/`.
- [ ] 3.2 Fix type errors and ESM import syntax.
- [ ] 3.3 Replace `@maplat/tin` usage with `@maplat/transform` (partial import).
- [ ] 3.4 Update MaplatCore usage to match 0.11.0 API.
- [ ] 3.5 Refactor GPS logic:
    - [ ] Delegate state management to Core.
    - [ ] Implement `alwaysGpsOn` handling in UI.
- [ ] 3.6 Remove `freeze` scripts and `bin/freezer.js`.

## 4. Test Migration
- [ ] 4.1 Set up Playwright for E2E tests.
- [ ] 4.2 Port existing Jest/Puppeteer tests to Vitest/Playwright.
- [ ] 4.3 Verify all tests pass.

## 5. Documentation & Cleanup
- [ ] 5.1 Update README.md to match MaplatCore style.
- [ ] 5.2 Review and remove legacy files (`legacy/`, `webpack_config/`).
- [ ] 5.3 Verify CI/CD pipeline (if applicable).
