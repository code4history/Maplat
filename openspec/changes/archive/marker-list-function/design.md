# Design: Marker List Function (Restoration)

## Architecture
Restoring functionality from `MergeGPS` branch.
1.  **Entry Point**: `ui.core.mapObject.on("click_control")` for `markerList`.
2.  **Logic Location**:
    *   `src/ui_init.ts`: Event listener and main list rendering logic (`showMarkerList`).
    *   `src/ui_marker.ts`: Export new `poiWebControl(ui, container, data)` function (refactored from `handleMarkerAction`) to render POI details into a given container.

## UI Structure (HTML)
```html
<ul class="list-group">
  <!-- Layer Item -->
  <li class="list-group-item layer">
    <div class="row layer_row">
      <div class="layer_label">
        <span class="dli-chevron"></span>
        <img src="..."> [Layer Name]
      </div>
      <div class="layer_onoff">
        <input type="checkbox" ...> [Toggle Layer]
      </div>
    </div>
  </li>
  
  <!-- Accordion Body for Layer (Markers) -->
  <ul class="list_poiitems_div">
    <!-- Marker Item -->
    <li class="list-group-item poi">
      <div class="row poi_row">
        <div class="poi_label">
          <span class="dli-chevron"></span>
          <img src="..."> [Marker Name]
        </div>
      </div>
    </li>
    
    <!-- Accordion Body for Marker (Detail) -->
    <ul class="list_poicontent_div">
       <!-- Content rendered by poiWebControl -->
    </ul>
  </ul>
</ul>
```

## Logic Flow
1.  **Open Modal**:
    *   Fetch layers via `ui.core.listPoiLayers(false, true)`.
    *   Clear and rebuild `.list-group`.
2.  **Render Layer**:
    *   Create `li` for layer.
    *   Hook up Toggle Checkbox to `ui.core.showPoiLayer(id)` / `hidePoiLayer(id)`.
    *   Hook up Click to expand/collapse `list_poiitems_div` (Accordion level 1).
3.  **Render Marker**:
    *   Create `li` for marker.
    *   Hook up Click to expand/collapse `list_poicontent_div` (Accordion level 2).
4.  **Expand Marker Detail**:
    *   On expand: Call `ui.poiWebControl(container, data)` to render details (Image Swiper, Desc, Address).
    *   Call `ui.core.selectMarker(id)`.
    *   On collapse: Clear content, `ui.core.unselectMarker()`.

## Refactoring `ui_marker.ts`
*   Current `handleMarkerAction` is tightly coupled to `.modalBase`.
*   **New**: `poiWebControl(ui, container, data)` -> Returns `[showFunc, hideFunc]` (for Swiper init/destroy).
*   `handleMarkerAction` will be updated to call `poiWebControl` targeting the modal's definition.
