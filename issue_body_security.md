# Security Hardening and pnpm Enforcement

## Background
The project has migrated to `pnpm` but lacks strict enforcement and advanced security configurations. Recent usage of npm introduces risks of supply chain attacks (e.g., malicious install scripts).
Two articles were referenced for best practices:
1.  [Zenn: Shai-Hulud infection check & Defense in Depth](https://zenn.dev/hand_dot/articles/04542a91bc432e) - Recommends `ignore-scripts`.
2.  [DevelopersIO: pnpm migration pitfalls](https://dev.classmethod.jp/articles/npm-to-pnpm-migration-pitfalls-and-solutions/) - Recommends `only-allow pnpm`.

## Goal
Establish a "Defense in Depth" strategy:
*   **Enforce pnpm**: Prevent accidental use of `npm` or `yarn` which might ignore lockfiles.
*   **Disable Scripts**: Enable `ignore-scripts` by default to block malicious `preinstall`/`postinstall` vectors.
*   **Whitelist Trusted Builds**: Explicitly allow necessary build scripts (e.g., `esbuild`) using `pnpm.onlyBuiltDependencies`.

*Note: `minimum-release-age` was considered but rejected due to friction with internal library updates.*

## Changes
*   **package.json**:
    *   Add `"preinstall": "npx only-allow pnpm"`.
    *   Add `pnpm.onlyBuiltDependencies` configuration.
*   **.npmrc**:
    *   Create file with `ignore-scripts=true`.

## Impact
*   **Safety**: Zero-day install-script attacks are neutralized by default.
*   **Consistency**: Developers cannot use wrong package managers.
*   **Maintenance**: New dependencies requiring build scripts must be explicitly allowlisted.

## Tasks
- [ ] Create `.npmrc` with `ignore-scripts=true` <!-- id: 0 -->
- [ ] Add `only-allow pnpm` to `package.json` scripts <!-- id: 1 -->
- [ ] Configure `pnpm.onlyBuiltDependencies` in `package.json` for `esbuild` and other valid tools <!-- id: 2 -->
- [ ] Verify `pnpm install` works with the new restrictions <!-- id: 3 -->
