# Spec: Border Fill Logic

## MODIFIED Requirements
The `Border` function **MUST** distinctively highlight the active overlay map's footprint.

#### Scenario: Enabling Border Mode
Given the user is on the map screen
When the user clicks the "Border" button (toggles ON)
Then all available overlay footprints should be drawn with dotted lines
And the *currently active* overlay's footprint should be filled with a semi-transparent color matching its border.

#### Scenario: Changing Overlay
Given Border Mode is ON
When the user swipes the overlay slider to a new map
Then the previous map's fill should be removed (reverting to just dotted border)
And the new active map's footprint should be filled.

#### Scenario: Initialization
Given the URL contains `sb:1` (Show Border is ON)
When the app loads
Then the borders and the active overlay's fill should be rendered immediately.
