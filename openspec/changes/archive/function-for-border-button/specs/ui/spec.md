# Spec: SVG Controls

## MODIFIED Requirements
All UI controls **MUST** use the internal SVG system (`getIcon`) instead of `<img>` tags for icons.

#### Scenario: Border Button Icon
Given the application is loaded
When I inspect the Border Control button
Then it should contain an `<svg>` element (via `getIcon`)
And it should not contain an `<img src="border.png">`.

#### Scenario: Other Controls
The same applies to `HideMarker`, `MarkerList`, `Maplat` (Help), `Copyright` (Attr), and `Zoom` buttons.
