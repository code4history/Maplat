# Design Document: Repository Standardization

## Context
The Maplat Harmony ecosystem has established project-wide standards to ensure consistency across all repositories. The Maplat UI repository currently violates several of these standards, particularly around build output separation and CI/CD automation.

**Background:**
- Maplat serves dual purposes: npm package (`@maplat/ui`) and demo application (GitHub Pages)
- Current build outputs both package and demo artifacts to the same `dist/` directory
- No automated CI/CD workflows exist for testing or deployment
- Standards require clear separation between package distribution and demo deployment

**Constraints:**
- Must maintain backward compatibility for package consumers
- Cannot break existing GitHub Pages deployment
- Must work with existing Vite + TypeScript setup
- Must enforce pnpm-only usage (already established)

## Goals / Non-Goals

**Goals:**
- Separate package build output (`dist/`) from demo build output (`dist-demo/`)
- Implement comprehensive CI/CD with testing on Node 20 and 22
- Automate GitHub Pages deployment from `dist-demo/` on master commits
- Ensure dev server is accessible without specifying file paths
- Align with ecosystem-wide standards

**Non-Goals:**
- Changing the actual build tools (Vite remains)
- Modifying package API or public interfaces
- Restructuring source code organization
- Changing the package name or versioning scheme

## Decisions

### Decision 1: BUILD_MODE Environment Variable
**What:** Use `BUILD_MODE=package` to distinguish between npm package builds and demo builds in `vite.config.js`.

**Why:** 
- Simple, explicit control without complex configurations
- Allows single config file to handle both scenarios
- Easy to understand and maintain
- Follows patterns used in other repos (MaplatTransform, Weiwudi)

**Alternatives considered:**
- Separate config files (`vite.config.package.js`, `vite.config.demo.js`) - More files to maintain
- Command-line arguments via npm scripts - Less explicit, harder to understand

### Decision 2: dist/ for Package, dist-demo/ for Demo
**What:** Package builds output to `dist/`, demo builds to `dist-demo/`.

**Why:**
- `dist/` is already configured in package.json main/module/types fields
- Minimizes changes to package.json
- Clear semantic separation
- `dist/` gets committed (for npm package), `dist-demo/` is gitignored (ephemeral)

**Alternatives considered:**
- Both in same directory with different prefixes - Risk of file mixing
- `build/` and `dist/` - Confusing semantics, doesn't match existing setup

### Decision 3: Unified CI Workflow
**What:** Single GitHub Actions workflow (`ci.yml`) with conditional jobs for test vs deploy.

**Why:**
- Simpler configuration and maintenance
- Easy to see full CI/CD process in one file
- Conditional deployment based on branch check
- Standard practice across ecosystem

**Alternatives considered:**
- Separate workflows (ci.yml, deploy.yml) - More complex, harder to coordinate
- Multiple workflow files per job - Overly granular

### Decision 4: Demo Build Uses App Mode
**What:** Demo builds use standard Vite app mode (not library mode).

**Why:**
- Produces optimized SPA with HTML, CSS, chunked JS
- Matches local dev server behavior
- Better performance for end users
- Proper asset handling (images, fonts, etc.)

## Technical Implementation

### Vite Configuration Changes
```javascript
// Detect build mode
const BUILD_MODE = process.env.BUILD_MODE;
const isPackageBuild = BUILD_MODE === 'package';

export default defineConfig({
  base: isPackageBuild ? '/' : '/Maplat/',  // GitHub Pages base path
  build: {
    outDir: isPackageBuild ? 'dist' : 'dist-demo',
    copyPublicDir: !isPackageBuild,  // Prevent public/ mixing in package
    ...(isPackageBuild ? {
      lib: { /* library config */ }
    } : {
      /* app config */
    })
  }
});
```

### Package.json Script Changes
```json
{
  "scripts": {
    "build": "pnpm build:package && pnpm build:demo",
    "build:package": "pnpm build:sw && BUILD_MODE=package tsc && BUILD_MODE=package vite build",
    "build:demo": "pnpm build:sw && vite build"
  }
}
```

### GitHub Actions Workflow
```yaml
# Test job: runs on all commits, all branches, Node 20 + 22
jobs:
  test:
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build:package
      - run: pnpm build:demo

# Deploy job: runs only on master, uses dist-demo/
  deploy:
    needs: test
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/upload-pages-artifact
        with:
          path: dist-demo/
```

## Risks / Trade-offs

### Risk: Build command changes
**Impact:** Developers need to update their local workflows
**Mitigation:** 
- Main `build` command still works (runs both)
- Document changes clearly in README
- Update in PR description

### Risk: GitHub Pages path changes
**Impact:** Deployment source changes from `dist/` to `dist-demo/`
**Mitigation:**
- Workflow handles deployment automatically
- Content remains identical to current demo
- No URL changes for end users

### Risk: CI/CD failures block merges
**Impact:** Broken tests prevent deployment
**Mitigation:**
- Good! This is desired behavior
- Fix-forward approach for urgent issues
- Comprehensive local testing before push

## Migration Plan

### Phase 1: Local Development (Pre-CI)
1. Update `vite.config.js` with BUILD_MODE support
2. Update `package.json` scripts
3. Test both build modes locally
4. Update `.gitignore`
5. Update README

### Phase 2: CI/CD Setup
1. Create `.github/workflows/ci.yml`
2. Test on feature branch first
3. Verify all jobs pass
4. Merge to master

### Phase 3: Verification
1. Confirm GitHub Pages deploys from `dist-demo/`
2. Verify npm package still builds correctly to `dist/`
3. Test dev server at root URL
4. Monitor first few deployments

### Rollback Plan
If critical issues arise:
1. Revert vite.config.js changes
2. Restore old build script
3. Disable GitHub Actions workflow
4. Investigate and fix issues
5. Re-apply changes

## Open Questions
None - requirements are clear from project-wide standards document.
