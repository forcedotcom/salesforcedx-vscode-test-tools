# VS Code Extension Test Templates

This directory contains template files for setting up VS Code extension tests with the Salesforce DX VSCode Test Tools framework.

## Quick Start

The easiest way to set up these templates is to use the initialization command:

```bash
# If you have the package installed globally
npx @salesforce/salesforcedx-vscode-test-tools init-test-config

# Or from your project directory
npx init-vscode-tests
```

This will copy the template files to your project and create the necessary directory structure.

## Manual Setup

If you prefer to set up the templates manually, follow these steps:

1. Copy `.mocharc.js` to your project root
2. Copy `tsconfig.test.json` to your project root
3. Create a `test` directory with `ui` and `unit` subdirectories
4. Copy `test-setup.ts` to `test/setup.ts`
5. Copy `example.test.ts` to `test/ui/example.test.ts`
6. Copy `launch.json` to `.vscode/launch.json`
7. Merge the contents of `package.json.test` with your project's `package.json`

## Template Files

| File                 | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `mocha.config.js`    | Mocha configuration file (copy to `.mocharc.js`)                |
| `tsconfig.test.json` | TypeScript configuration for tests                              |
| `test-setup.ts`      | Test setup file that configures the VS Code testing environment |
| `example.test.ts`    | Example test file showing how to test a VS Code extension       |
| `package.json.test`  | Example package.json scripts for running tests                  |
| `launch.json`        | VS Code launch configuration for debugging tests                |

## Usage

After setting up the templates, you can run your tests with:

```bash
# Run all tests
npm test

# Run UI tests only
npm run test:ui

# Run unit tests only
npm run test:unit
```

You can debug tests by:

1. Opening the test file in VS Code
2. Setting breakpoints as needed
3. Pressing F5 or using the "Debug Single Test File" configuration

## Configuration

The test setup is configured in `test/setup.ts`. You can modify this file to customize the test environment:

```typescript
// test/setup.ts
import { setupTestEnvironment } from '@salesforce/salesforcedx-vscode-test-tools/lib/setup/mocha-setup';

setupTestEnvironment({
  // Test resources directory
  testResources: './path/to/test-resources',

  // Extensions directory
  extensionsFolder: './path/to/extensions',

  // VSIX directory
  vsixToInstallDir: './path/to/vsix',

  // VS Code version
  codeVersion: 'stable'
});
```

## Writing Tests

Follow the example in `example.test.ts` to write your own tests. The basic structure is:

```typescript
import { testRunner } from './setup';
import { VSBrowser, Workbench } from 'vscode-extension-tester';
import { expect } from 'chai';

describe('My Extension Test', function () {
  it('should do something', async function () {
    // Get VSBrowser instance
    const browser = VSBrowser.instance;

    // Interact with VS Code
    // ...

    // Test assertions
    expect(result).to.equal(expectedValue);
  });
});
```

For more information, see the [vscode-extension-tester documentation](https://github.com/redhat-developer/vscode-extension-tester/wiki).
