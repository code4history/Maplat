## ADDED Requirements

### Requirement: Build Script Separation
The project SHALL provide separate npm scripts for building the package and demo to support different deployment targets.

#### Scenario: Building package only
- **GIVEN** a developer wants to build only the npm package
- **WHEN** they run `pnpm build:package`
- **THEN** only the package build SHALL execute
- **AND** output SHALL go to `dist/` directory
- **AND** the service worker build SHALL run first

#### Scenario: Building demo only
- **GIVEN** a developer wants to build only the demo application
- **WHEN** they run `pnpm build:demo`
- **THEN** only the demo build SHALL execute
- **AND** output SHALL go to `dist-demo/` directory
- **AND** the service worker build SHALL run first

#### Scenario: Building both package and demo
- **GIVEN** a developer wants to build both package and demo
- **WHEN** they run `pnpm build`
- **THEN** both `build:package` and `build:demo` SHALL execute
- **AND** both output directories SHALL be populated
