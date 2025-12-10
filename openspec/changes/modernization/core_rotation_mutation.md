# Issue Report: `restore.position.rotation` Mutation in `MaplatApp`

## Summary
When initializing `MaplatApp` or calling `changeMap` with a `restore` object containing a `position.rotation` value, the `rotation` value within the passed object is mutated (overwritten) by the internal logic of `@maplat/core`. This causes the rotation state to be lost or incorrect when the application attempts to synchronize the URL or apply the view state.

## Steps to Reproduce
1. Create a `restore` object with a specific rotation value (e.g., `-1.15`).
   ```javascript
   const restore = {
     mapID: 'tatebayashi_ojozu',
     backgroundID: 'gsi',
     position: {
       rotation: -1.15,
       x: ...,
       y: ...,
       z: ...
     }
   };
   ```
2. Pass this object to `initializer` or `changeMap` (via `appOption`).
3. Observe the `restore.position.rotation` value after the operation completes (promise resolves).

## Observed Behavior
The `restore.position.rotation` value is modified to a different value (often close to 0 or a completely different angle, e.g., `-0.02`) by the time the operation completes.

**Logs from `@maplat/ui` debugging:**
```
[Debug] Before initializer: rotation=-1.1552939045434911
[Debug] After initializer: rotation=-1.1552939045434911
...
[Debug] Applying rotation from restore: -0.020163682462505 
// The object referenced by the log has been mutated in place between these steps
```

It appears the mutation happens specifically during the asynchronous setup phase (`waitReady` resolution) where the map view is being constructed or adjusted.

## Expected Behavior
The `restore` object passed to `MaplatApp` should be treated as **read-only** regarding its input parameters. The Core should not mutate the input configuration object. If the Core needs to normalize or calculate a new rotation, it should do so in its own internal state, not by overwriting the input property.

## Impact
- URL state restoration fails because the original rotation value from the URL is lost before it can be applied to the map.
- URL generation logic (`updateUrl`) picks up the mutated (incorrect) value, causing the parameter to disappear or change in the URL.

## Proposed Fix
1. **Immutable Handling**: Ensure `MaplatApp` (or the underlying `MaplatMap` classes) clones the options/restore object or strictly avoids mutating properties of the passed object.
2. **Respect Input**: Ensure the explicit `rotation` provided in `restore` takes precedence over internal auto-calculation logic during the restore phase.

## Test Requirement
Please add a regression test in `@maplat/core` that:
1. Instantiates `MaplatApp` with a `restore` object containing a known `rotation`.
2. Awaits readiness.
3. Asserts that the `restore.position.rotation` property of the input object remains unchanged.
4. Asserts that the resulting MapView rotation matches the input `rotation`.
