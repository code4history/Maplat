# Issue Report: Rotation Value Preserved but Not Applied to View in `MaplatApp` (v0.11.1)

## Summary
In `@maplat/core` v0.11.1, the issue of `restore` object mutation has been resolved. However, a new (or persisting) issue is that the `rotation` value specified in the `restore` object is **not applied** to the Map View. The Map View initializes with a rotation of `0` regardless of the input value.

## Steps to Reproduce
1. Use `@maplat/core` v0.11.1.
2. Initialize `MaplatApp` or call `changeMap` with a `restore` object containing a rotation.
   ```javascript
   const restore = {
     mapID: 'tatebayashi_ojozu',
     position: {
       rotation: -1.15, // Non-zero rotation
       // ... other coords
     }
   };
   // call initializer(appOption) where appOption.restore = restore
   ```
3. Await `waitReady`.
4. Check the Map View's rotation.

## Observed Behavior
- **Logs confirm** `restore.position.rotation` retains the correct value (e.g., `-1.15`).
- **Map View** reports `rotation` as `0`.
- The map on screen is not rotated.

**Logs:**
```
[Debug] After waitReady (Init): rotation=-1.1552939045434911
[Debug] View rotation: 0
```

## Expected Behavior
The Map View should be set to the rotation specified in `restore.position.rotation` upon initialization or map change completion.

## Impact
- URL restoration of rotation state fails (visual verification).
- Manual intervention (calling `getView().setRotation()`) is required in the UI layer to correct the state.

## Recommendation
Ensure that the `restore` logic in `MaplatApp`/`MaplatMap` explicitly sets the View's rotation property using the value from the (now correct) `restore` object during the setup phase.
