# Design: Package Manager Consistency

## Problem
The project mandates `pnpm` via the `engines` field but uses `npm` in scripts.

## Solution

### 1. Script updates
Replace `npm run` with `pnpm` in `package.json`.

**Before:**
```json
"dev": "concurrently \"npm run watch:sw\" \"vite\"",
"lint": "npm run lint:eslint && npm run lint:prettier"
```

**After:**
```json
"dev": "concurrently \"pnpm watch:sw\" \"vite\"",
"lint": "pnpm lint:eslint && pnpm lint:prettier"
```

### 2. Weiwudi Alignment
(Note: Issue #233 mentions "Weiwudi Vite Pnpm". If Weiwudi is a sub-project or related repo, we should ensure patterns match, but for this repo, the action is internal consistency).
We observe `weiwudi` is a dependency. If we are touching `weiwudi` configuration *within* Maplat, it would only be standardizing how we use it. But likely the Title implies "Use the same vite/pnpm setup as Weiwudi" or "Update Weiwudi to be compatible".
Given the issue body "Verify Package Manager Consistency", the primary focus is the package manager script consistency.

## Open Questions
- Should we add `"packageManager": "pnpm@9.x.x"`? (Recommended for modern pnpm usage).
