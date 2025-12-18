# package-manager Specification

## ADDED Requirements

### Requirement: Strict Package Manager Usage
The project SHALL use `pnpm` exclusively for all script execution and dependency management.

#### Scenario: Running development server
- **Given** the developer wants to start the development environment
- **When** they run `pnpm dev`
- **Then** the internal scripts invoked (e.g., `watch:sw`) SHALL be executed using `pnpm`, NOT `npm run`.

#### Scenario: Running linting commands
- **Given** the developer wants to lint the codebase
- **When** they run `pnpm lint`
- **Then** the internal scripts (e.g., `lint:eslint`) SHALL be executed using `pnpm`, NOT `npm run`.

### Requirement: Engine Constraints
The project SHALL explicitly prohibit `npm` usage via `engines` configuration.

#### Scenario: Installing with npm
- **Given** a clean environment
- **When** a user attempts `npm install`
- **Then** the installation SHALL fail with a warning about `pnpm` requirement.
