# Spec: Asset Handling

## MODIFIED Requirements
The application **MUST** use embedded SVG icons instead of `Clarendon` or `FontAwesome` font files.

#### Scenario: Rendering icons
Given the application is loaded
When I view controls like Zoom or Compass
Then they should render using SVG elements, not `<i>` tags with font classes backed by loaded font files.

## REMOVED Requirements
The distribution **MUST NOT** include `woff` or `ttf` files for Clarendon or FontAwesome.

#### Scenario: Checking output assets
Given I have built the project
When I inspect `dist/assets/fonts`
Then the directory should be empty of the legacy font files.
