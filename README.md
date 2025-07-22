# @salesforce/salesforcedx-vscode-test-tools

Test automation framework for Salesforce Extensions for VS Code.

## Introduction

This package provides a comprehensive test automation framework for working with Salesforce Extensions for VS Code. It is extracted from the Salesforce Extensions for VS Code automation tests.

## Installation

```bash
npm install --save-dev @salesforce/salesforcedx-vscode-test-tools
```

## Usage

```typescript
import { log, setUpScratchOrg, openFolder } from '@salesforce/salesforcedx-vscode-test-tools';

// Use the imported functions directly
log('Hello, world!');
```

### Framework Structure

The framework is organized into the following modules:

- **Core**: Basic types, constants, and common utility functions
- **System Operations**: File system, CLI commands, git operations, and settings
- **Salesforce Components**: Authorization, deployment, Apex, LWC, and Visualforce utilities
- **Testing**: Extension management, test utilities, and predicates
- **UI Interaction**: Command prompts, notifications, editor, terminal, and workbench interactions

## Documentation

The full API documentation is available at [https://forcedotcom.github.io/salesforcedx-vscode-test-tools](https://forcedotcom.github.io/salesforcedx-vscode-test-tools).

### Generating Documentation Locally

To generate the documentation locally:

```bash
# Install dependencies
npm install

# Generate documentation
npm run docs

# Open documentation in your browser
open docs/index.html
```

For real-time updates while editing documentation:

```bash
npm run docs:watch
```

## Development

### Commitizen

This project uses [Commitizen](https://github.com/commitizen/cz-cli) for standardized commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) format.

To create a new commit:

```bash
npm run commit
```

This will guide you through an interactive process to create a properly formatted commit message. The commit message format is enforced using husky hooks.

### Scripts

- `npm run compile` - Compile TypeScript code
- `npm run lint` - Run ESLint
- `npm run clean` - Remove build artifacts
- `npm run test` - Run tests
- `npm run docs` - Generate API documentation
- `npm run docs:watch` - Generate API documentation with watch mode

## License

BSD-3-Clause

### RedHat VS Code Extension Tester

This project is based on ExTester, available at https://github.com/redhat-developer/vscode-extension-tester

### Getting Started

If you are interested in contributing, please take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

This repository is published and used as an npm module, currently imported by `salesforcedx-vscode`. You can follow the same repository to see how this is utilized.

### Environment Variables

The following environment variables can be used to configure the automation tests. These are managed by the `EnvironmentSettings` class.

| Environment Variable                  | Description                                                                                           | Default Value                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `VSCODE_VERSION`                      | VSCode version to use in tests                                                                        | `'latest'`                                   |
| `SPEC_FILES`                          | Test spec filename(s) to run, will be prefixed with 'lib/specs/'                                      | `[]`                                         |
| `VSIX_TO_INSTALL`                     | Path to directory containing VSIX files to install                                                    | `undefined`                                  |
| `DEV_HUB_ALIAS_NAME`                  | Alias for the DevHub org                                                                              | `'vscodeOrg'`                                |
| `DEV_HUB_USER_NAME`                   | Username for the DevHub org                                                                           | -                                            |
| `SFDX_AUTH_URL`                       | URL for authenticating with Salesforce DX                                                             | `undefined`                                  |
| `EXTENSION_PATH`                      | Path to extensions directory                                                                          | `{cwd}/../../salesforcedx-vscode/extensions` |
| `SALESFORCEDX_VSCODE_EXTENSIONS_PATH` | Alternative path to extensions (takes precedence over EXTENSION_PATH)                                 | -                                            |
| `THROTTLE_FACTOR`                     | Number to multiply timeouts by (used to slow down test execution)                                     | `1`                                          |
| `JAVA_HOME`                           | Path to Java installation                                                                             | `undefined`                                  |
| `USE_EXISTING_PROJECT_PATH`           | Path to an existing project to use instead of creating a new one                                      | `undefined`                                  |
| `E2E_LOG_LEVEL`                       | Log level for test execution (one of the valid log levels: 'error', 'warn', 'info', 'debug', 'trace') | `'info'`                                     |

#### Usage Notes

- **SPEC_FILES**: If specified, only the named test spec files will be run instead of all tests

- **EXTENSION_PATH**: If your folder structure does not match the standard folder structure shown in the Getting Started section, `EXTENSION_PATH` will need to be set to the correct relative path to 'salesforcedx-vscode/extensions'

- **SFDX_AUTH_URL**: To obtain this URL, run `sf org display -o <myDevHub> --verbose --json` in your terminal and extract the value from the `sfdxAuthUrl` property

- **USE_EXISTING_PROJECT_PATH**: If specified, must point to a valid existing project directory. The test framework will use this project instead of creating a new one

- **THROTTLE_FACTOR**: Useful for debugging tests by slowing down UI interactions. For example, setting to `2` will make tests run at half speed

#### Example Usage

```bash
# Run a specific test file
SPEC_FILES=soql.e2e.js npm test

# Run tests with custom DevHub alias
DEV_HUB_ALIAS_NAME=myDevHub DEV_HUB_USER_NAME=myuser@example.com npm test

# Run tests with slower execution speed (for debugging)
THROTTLE_FACTOR=2 npm test

# Run tests with increased logging
E2E_LOG_LEVEL=debug npm test
```

## Test Configuration

This framework allows customizing the test environment through the `TestConfig` interface. You can specify the following options:

### Workspace Path

By default, the framework creates a `salesforcedx-vscode` folder in your project directory to store VS Code and test artifacts. You can customize this location through:

1. Environment variable: `WORKSPACE_PATH`
2. Command line argument: `--workspace-path` or `-w`
3. Programmatically through the `TestConfig` interface

Example configuration through environment variables:

```bash
WORKSPACE_PATH=/tmp/my-test-workspace npm test
```

Example using command line arguments:

```bash
npm test -- --workspace-path /tmp/my-test-workspace
```

Example programmatic usage:

```typescript
import { TestSetupAndRunner, TestConfig } from '@salesforce/salesforcedx-vscode-test-tools';

const testConfig: Partial<TestConfig> = {
  workspacePath: '/tmp/my-test-workspace'
};

const testRunner = new TestSetupAndRunner(testConfig);
await testRunner.setup();
const result = await testRunner.runTests();
```

### Extensions Path

By default, extensions are installed in the `extensions` subfolder of the workspace path. You can override this with:

1. Environment variable: `EXTENSION_PATH` or `SALESFORCEDX_VSCODE_EXTENSIONS_PATH`
2. Programmatically through the `TestConfig` interface

If only `workspacePath` is specified, the `extensionsPath` will automatically be set to `${workspacePath}/extensions`.

### VSIX Installation Directory

You can specify a dedicated directory containing VSIX files to be installed during test setup. This separates the source of VSIX files from the extensions folder where they get installed.

This can be configured through:

1. Environment variable: `VSIX_TO_INSTALL`
2. Programmatically through the `TestConfig` interface

```bash
# Set a custom VSIX installation directory
VSIX_TO_INSTALL=/path/to/vsix-directory npm test
```

Example programmatic usage:

```typescript
import { TestSetupAndRunner, TestConfig } from '@salesforce/salesforcedx-vscode-test-tools';

const testConfig: Partial<TestConfig> = {
  vsixToInstallDir: '/path/to/vsix-directory'
};

const testRunner = new TestSetupAndRunner(testConfig);
await testRunner.setup();
const result = await testRunner.runTests();
```

If both the `TestConfig` and environment variable are set, the `TestConfig` value takes precedence.
