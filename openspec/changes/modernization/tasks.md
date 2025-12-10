# Tasks: Maplat Modernization

## 3. Code Migration (Iterative)
- [x] 3.1 Rename `.js` to `.ts` in `src/`
- [x] 3.2 Fix type errors and ESM import syntax.
- [x] 3.3 Replace `@maplat/tin` usage with `@maplat/transform` (partial import).
- [x] 3.4 Update MaplatCore usage to match 0.11.0 API.
- [x] 3.5 Refactor GPS logic:
    - [x] Delegate state management to Core.
    - [x] Implement `alwaysGpsOn` handling in UI.
- [x] 3.6 Remove `freeze` scripts and `bin/freezer.js`.

## 4. Test Migration
- [ ] 4.1 Set up Playwright for E2E tests.
- [ ] 4.2 Port existing Jest/Puppeteer tests to Vitest/Playwright.
- [ ] 4.3 Verify all tests pass.
- [ ] Fix Runtime Bugs:
    - [x] Fix Service Worker unsupported MIME type in dev
    - [x] Automate Service Worker rebuild in dev
    - [x] Fix splash screen not closing
    - [x] Fix i18n placeholders (html.app_loading_body)
    - [x] Fix broken modal buttons (Help, Share, etc.)
    - [x] Refactor modal logic to use CSS classes
    - [ ] Address Modal Internal Functionality (buttons not working correctly)
    - [x] Debug URL Restoration (Blocked on Core Fix: View Rotation)
        - [x] Confirmed rotation mutation fixed in 0.11.1
        - [x] Confirmed View rotation NOT applied in 0.11.1
        - [x] Created issue report for View Rotation failure
        - [ ] Verify fix with @maplat/core (Next Version)
- [ ] 5. Documentation & Cleanup
    - [ ] 5.1 Update README.md to match MaplatCore style.
    - [ ] 5.2 Review and remove legacy files (`legacy/`, `webpack_config/`).
    - [ ] 5.3 Verify CI/CD pipeline (if applicable).
