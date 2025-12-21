# development Specification

## ADDED Requirements

### Requirement: Modern Linting Configuration
The project SHALL use ESLint "Flat Config" (`eslint.config.js`) for linting configuration. Legacy formats like `.eslintrc.json`, `.eslintrc.js` (CommonJS), or `.eslintrc` are prohibited.

#### Scenario: Configuring Rules
- **Given** a developer wants to modify linting rules
- **When** they edit the configuration
- **Then** they MUST edit `eslint.config.js` in the project root.

### Requirement: Modern Geospatial Library
The project SHALL use `@turf/turf` version 7 or higher for geospatial operations to ensure performance and maintenance support.

#### Scenario: Performing Geospatial Analysis
- **Given** a feature requiring spatial analysis (e.g. intersection, area)
- **When** the code executes
- **Then** it MUST utilize `@turf/turf` v7+ APIs.
