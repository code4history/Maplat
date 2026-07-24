# MaplatUi

The main class of `@maplat/ui`.

## Static Methods

- **`createObject(option: MaplatAppOption): Promise<MaplatUi>`**
  Creates a MaplatUi instance and returns a Promise that resolves when initialization is complete. This is the recommended way to create an instance.

## Constructor

- **`new MaplatUi(option: MaplatAppOption)`**
  Creates an instance but does not wait for initialization. You should wait for the `waitReady` property.

## Methods

- **`remove()`**: Destroys the application and releases resources.
- **`updateUrl()`**: Updates the URL to reflect current state (if `stateUrl` is enabled).

## See also

- [MaplatAppOption](maplat-app-option.md) — option object properties
- [UI core lifecycle](../ui-core-lifecycle.md) — lifecycle phases and uiHooks
