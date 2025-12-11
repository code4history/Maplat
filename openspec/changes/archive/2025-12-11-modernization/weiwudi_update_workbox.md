# Issue Report: Update Workbox Dependencies to v7

## Summary
`weiwudi` currently depends on Workbox v6.6.1 (`workbox-core`, `workbox-build`, etc.). Modern PWA setups (like `vite-plugin-pwa` v1.x) now require Workbox v7 (`^7.4.0`), leading to peer dependency conflicts and duplication when both are used in the same project.

## Observed Issue
When using `weiwudi` v0.1.4 alongside `vite-plugin-pwa` v1.2.0:
```
 WARN  Issues with peer dependencies found
.
├─┬ vite-plugin-pwa 1.2.0
│ ├── ✕ unmet peer workbox-build@^7.4.0: found 6.6.1
│ └── ✕ unmet peer workbox-window@^7.4.0: found 6.6.1
```
This forces consumers to install multiple versions of Workbox or manually manage devDependencies to resolve conflicts.

## Recommendation
Update internal dependencies of `weiwudi` to the latest stable Workbox version (v7+).

```diff
  "dependencies": {
-   "workbox-core": "^6.6.1",
+   "workbox-core": "^7.3.0",
    ...
  }
```

This ensures compatibility with modern build tools and lets consumers rely on a single, up-to-date Workbox version.
