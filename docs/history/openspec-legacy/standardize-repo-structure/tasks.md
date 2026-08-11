# Implementation Tasks

## 1. Build System Updates
- [x] 1.1 Update `vite.config.js` to support BUILD_MODE environment variable
- [x] 1.2 Add package build configuration (output to `dist/`, library format)
- [x] 1.3 Add demo build configuration (output to `dist-demo/`, app format)
- [x] 1.4 Configure conditional `copyPublicDir` (false for package, true for demo)
- [x] 1.5 Update package.json scripts (add `build:package`, `build:demo`)
- [x] 1.6 Update `package.json` files array to exclude demo artifacts

## 2. CI/CD Infrastructure
- [x] 2.1 Create `.github/workflows/ci.yml` workflow file
- [x] 2.2 Configure test matrix for Node 20 and 22
- [x] 2.3 Add pnpm setup (version 9) in workflow
- [x] 2.4 Add lint, typecheck, test, build steps for all branches
- [x] 2.5 Add GitHub Pages deployment job (master branch only, from dist-demo/)
- [x] 2.6 Configure artifact upload/download between jobs

## 3. Development Experience
- [x] 3.1 Verify dev server works at root URL (`http://localhost:5173/`)
- [x] 3.2 Add `dist-demo/` to `.gitignore`
- [x] 3.3 Update documentation in README.md

## 4. Validation
- [x] 4.1 Test package build locally (`BUILD_MODE=package pnpm build` or `pnpm build:package`)
- [x] 4.2 Test demo build locally (`pnpm build:demo`)
- [x] 4.3 Verify `dist/` contains only package files (*.js, *.d.ts, assets/locales/)
- [x] 4.4 Verify `dist-demo/` contains complete demo app
- [ ] 4.5 Test dev server at `http://localhost:5173/`
- [ ] 4.6 Push to test branch and verify CI runs
- [ ] 4.7 Merge to master and verify GitHub Pages deployment
