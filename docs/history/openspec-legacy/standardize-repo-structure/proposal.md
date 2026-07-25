# Change: Standardize Repository Structure

## Why
The Maplat repository currently violates several project-wide standards that have been established across the Maplat Harmony ecosystem. These violations include:
1. Mixed build artifacts in `dist/` (package files mixed with demo/dev assets)
2. Missing CI/CD workflows for automated testing and deployment
3. Lack of proper dev server configuration

These issues make it difficult to maintain consistency across the ecosystem and can lead to confusion when publishing packages or deploying demos.

## What Changes
- **Separate build outputs**: Package builds (ES/UMD + types) to `dist/`, demo builds to `dist-demo/`
- **Add CI/CD workflows**: Implement GitHub Actions for automated testing, linting, type-checking, and deployment
- **Improve dev server**: Ensure dev server is accessible at `http://localhost:5173/` without requiring `/index.html`
- **Update build scripts**: Split `build` into `build:package` and `build:demo` commands
- **Configure GitHub Pages**: Deploy from `dist-demo/` only on `master` branch commits

## Impact
- **Affected specs**: `development`, `package-manager`
- **Affected code**:
  - `vite.config.js` - Add BUILD_MODE support and dual build configurations
  - `package.json` - Split build scripts, update files array
  - `.github/workflows/ci.yml` - NEW: CI/CD workflow
  - `.gitignore` - Add dist-demo/
  - `README.md` - Document new build commands

## Migration
Existing workflows should update their commands:
- `pnpm build` - Now builds the npm package (to `dist/`)
- `pnpm build:demo` - Build the demo app (to `dist-demo/`)
