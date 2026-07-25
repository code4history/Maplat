# Upgrade Turf.js and ESLint Flat Config migration

## Why
As requested in Issue #234, the project needs to upgrade `@turf/turf` to the latest version (v7) to access new features and fixes. Additionally, ESLint v9 has made "Flat Config" (`eslint.config.js`) the default, and the current `.eslintrc.json` generic configuration is deprecated. Migrating to Flat Config ensures future compatibility and better integration with modern tooling.

## What Changes
1.  **Upgrade Turf.js**: Update `@turf/turf` from v6 to v7.
2.  **Migrate ESLint**:
    -   Remove `.eslintrc.json`.
    -   Create `eslint.config.js` using generic Flat Config compatible rules.
    -   Update `package.json` devDependencies (remove `eslint-config-prettier` if handled differently, ensuring `vite-plugin-dts` etc. are compatible).
    -   Update `lint` scripts if necessary (though `pnpm lint:eslint` remains valid).

## Impact
-   **Breaking Changes**: Turf v7 drops `isPolygonal` etc. (check usage). ESLint v9 configuration format is completely different; custom rules in `.eslintrc.json` must be manually ported.
-   **Affected Files**: `package.json`, `eslint.config.js`, `src/**/*.ts` (if Turf API changes require refactoring).
