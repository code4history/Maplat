# marker-list Specification

## Purpose
TBD - created by archiving change marker-list-function. Update Purpose after archive.
## Requirements
### Requirement: Marker List Display Logic
The system SHALL populate the Marker List modal with a list of Marker Layers associated with the current map.

#### Scenario: Opening Marker List
Given the user is viewing a map with defined POI layers
And the "Marker List" control is enabled
When the user clicks the "Marker List" button
Then the Marker List modal SHALL open
And the modal SHALL display a list of marker layers
And each layer item SHALL show the layer icon, layer name, and a visibility toggle switch
And clicking the layer item (not toggle) SHALL expand/collapse the list of markers in that layer (Accordion Level 1)

### Requirement: Marker Layer Interaction
The system SHALL provide a mechanism to toggle the visibility of each marker layer directly from the Marker List.

#### Scenario: Toggling Layer Visibility
Given the Marker List is open
When the user toggles the switch on a layer item
Then the corresponding marker layer visibility on the map SHALL toggle (Show/Hide)

### Requirement: Marker List Interaction
The system SHALL allow users to view detailed information for each marker within the Marker List interface using an accordion interaction.

#### Scenario: Viewing Marker Details
Given a marker layer is expanded in the list
When the user clicks on a marker item
Then the item SHALL expand/collapse to show the marker details (Accordion Level 2)
And the marker details SHALL be displayed inline below the marker item
And the displayed details SHALL match the content shown in the standard POI modal (Description, Address, Images)
And the corresponding marker on the map SHALL be selected (highlighted) when expanded

