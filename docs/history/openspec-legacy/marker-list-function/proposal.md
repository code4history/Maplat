# Marker List Function

## Goal
Implement the logic to populate and display a list of available markers (POIs) in the `MarkerList` modal when the user clicks the "Marker List" control.

## Why
The UI infrastructure for the "Marker List" button and modal exists, but the list is empty. Users need a way to see all available POIs in a list format, not just on the map, to easily find and navigate to specific locations.

## Changes
## Changes
*   **Restore `MarkerList` UI**: Implement the logic to populate the `.modal_marker_list_content` matching the `MergeGPS` branch behavior.
    *   **Layer List**: Display a list of marker layers (not flat markers) with a toggle switch for visibility.
    *   **Accordion Interaction**: logical hierarchy of Layer -> Markers -> Marker Detail.
    *   **Logic Reuse**: Refactor and reuse POI display logic (`poiWebControl`) to support inline display within the list.

## User Review Required
*   **Refactoring**: Will extract POI rendering logic from `ui_marker.ts` into a reusable function to support both the main POI modal and the Marker List accordion.
