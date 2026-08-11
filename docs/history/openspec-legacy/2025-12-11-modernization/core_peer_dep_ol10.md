# Issue Report: Update `peerDependencies` to Support OpenLayers v10

## Summary
`@maplat/ui` (and other consumers) are now upgrading to OpenLayers v10 (`v10.7.0`). However, `@maplat/core` currently specifies `ol` peer dependency as `^9.0.0`, causing package manager warnings during installation.

## Observed Warning
```
└─┬ @maplat/core 0.11.2
  └── ✕ unmet peer ol@^9.0.0: found 10.7.0
```

## Expected Behavior
`@maplat/core` should officially support OpenLayers v10 in its `peerDependencies` range, assuming there are no breaking changes in v10 that affect `@maplat/core`.

## Recommendation
Update `package.json` in `@maplat/core`:

```diff
  "peerDependencies": {
-   "ol": "^9.0.0"
+   "ol": "^9.0.0 || ^10.0.0"
  }
```

This will allow consumers to install `@maplat/core` alongside OpenLayers v10 without warnings.
