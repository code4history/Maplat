# Verify Package Manager Consistency

## Why
The project mandates `pnpm` usage via the `engines` field in `package.json`, but current npm scripts (e.g., `dev`, `lint`) internally execute `npm run`. This inconsistency undermines the enforcement of the package manager, potentially leading to lockfile drift or environment mismatches. Aligning the scripts with the project's stated constraints will reduce developer friction and ensure reproducible builds.

## What Changes
1.  **Refactor Scripts**: Update all scripts in `package.json` to explicitly use `pnpm` instead of `npm`.
    -   Change `npm run watch:sw` to `pnpm watch:sw`.
    -   Change `npm run lint:eslint` to `pnpm lint:eslint`.
2.  **Enforce Engines**: Verify and maintain the `engines` field to strictly require `pnpm` and reject `npm`.
3.  **Verification**: Ensure all development workflows (start, build, lint) function correctly with the unified toolchain.

## Impact
- **Non-Breaking**: This is a tooling-only change.
- **Workflow**: Developers must use `pnpm` for all commands. `npm install` will fail.
- **Affected Files**: `package.json` only.
