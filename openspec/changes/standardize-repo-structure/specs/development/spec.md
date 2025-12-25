## ADDED Requirements

### Requirement: Build Output Separation
The project SHALL maintain separate output directories for package builds and demo builds to prevent artifact contamination.

#### Scenario: Package build outputs
- **GIVEN** a developer runs the package build command
- **WHEN** the build completes
- **THEN** the output SHALL be written to `dist/` directory
- **AND** SHALL contain only library files (ES/UMD JavaScript, TypeScript definitions, essential assets)
- **AND** SHALL NOT contain demo application files (HTML, demo CSS, dev-server artifacts)

#### Scenario: Demo build outputs
- **GIVEN** a developer runs the demo build command
- **WHEN** the build completes
- **THEN** the output SHALL be written to `dist-demo/` directory
- **AND** SHALL contain the complete demo application (HTML, CSS, JavaScript, assets)
- **AND** SHALL be suitable for deployment to GitHub Pages

### Requirement: Build Mode Configuration
The project SHALL support a `BUILD_MODE` environment variable to control build behavior in the Vite configuration.

#### Scenario: Package build mode
- **GIVEN** the environment variable `BUILD_MODE=package` is set
- **WHEN** the Vite build runs
- **THEN** it SHALL build in library mode
- **AND** output to `dist/` directory
- **AND** set `copyPublicDir` to false to prevent public asset contamination

#### Scenario: Demo build mode
- **GIVEN** the environment variable `BUILD_MODE` is not set or is not "package"
- **WHEN** the Vite build runs
- **THEN** it SHALL build in application mode
- **AND** output to `dist-demo/` directory
- **AND** set `copyPublicDir` to true to include demo assets

### Requirement: CI/CD Automation
The project SHALL implement automated continuous integration and deployment using GitHub Actions.

#### Scenario: Running tests on all commits
- **GIVEN** a commit is pushed to any branch
- **WHEN** the CI workflow executes
- **THEN** it MUST run lint, typecheck, test, and build steps
- **AND** MUST test on Node.js versions 20 and 22
- **AND** MUST use pnpm version 9 for all package management

#### Scenario: Deploying to GitHub Pages
- **GIVEN** a commit is pushed to the `master` branch
- **WHEN** the CI workflow completes successfully
- **THEN** it MUST deploy the contents of `dist-demo/` to GitHub Pages
- **AND** MUST NOT deploy on commits to other branches

### Requirement: Development Server Accessibility
The development server SHALL be accessible at the root URL without requiring specific file paths.

#### Scenario: Accessing dev server
- **GIVEN** the development server is running
- **WHEN** a developer navigates to `http://localhost:5173/`
- **THEN** the application MUST load successfully
- **AND** MUST NOT require explicit `/index.html` in the URL
