# Spec: Build Configuration

## ADDED Requirements
The build process **MUST** generate both ESM and UMD bundles.

#### Scenario: Building for production
Given the project is configured for Vite
When I run `npm run build`
Then `dist/maplat-ui.es.js` and `dist/maplat-ui.umd.js` should be created.

## REMOVED Requirements
The build process **MUST NOT** generate CommonJS bundles.

#### Scenario: Checking build artifacts
Given I have built the project
When I inspect the `dist` folder
Then I should not see any CommonJS specific output (or it should be empty/unused).

## MODIFIED Requirements
The build process **MUST** copy `assets/locales` to `dist/assets/locales` without bundling them into the JS.

#### Scenario: Verifying locale files
Given I have built the project
When I look into `dist/assets/locales`
Then I should see the language JSON files intact.
