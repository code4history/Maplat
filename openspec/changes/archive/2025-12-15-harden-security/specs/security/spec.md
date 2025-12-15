# Spec: Security Configuration

## ADDED Requirements
### Requirement: Strict Package Management
The project **MUST** enforce strict security policies for dependency management to preventing supply chain attacks.

#### Scenario: Enforcing Package Manager
Given a developer tries to install dependencies using `npm install`
When the command runs
Then it should fail with a message instructing to use `pnpm`.

#### Scenario: Blocking Malicious Scripts
Given a dependency contains a malicious `postinstall` script
And the dependency is NOT in the allowed list
When `pnpm install` runs
Then the malicious script must NOT be executed.

#### Scenario: Allowing Essential Builds
Given `esbuild` is a required dependency with a build step
And `esbuild` is listed in `pnpm.onlyBuiltDependencies`
When `pnpm install` runs
Then `esbuild`'s postinstall script SHOULD execute successfully.
