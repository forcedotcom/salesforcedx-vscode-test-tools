# Extension Configuration in Tests

This document describes how to configure extensions for automated VS Code testing.

## Overview

The extension configuration system allows you to control which VS Code extensions are installed and verified during test setup. This makes it possible to run tests with different combinations of extensions based on test requirements.

The framework is designed to be generic and reusable. Extension configurations are passed as parameters to testing functions rather than being hardcoded, allowing any project to use this framework with their own extension lists.

## Key Components

- **TestReqConfig**: The main configuration type used for test setup
- **ExtensionConfig**: Configuration for individual extensions
- **TestSetup**: Class that handles setting up the test environment
- **getExtensionsToVerifyActive**: Function to filter extensions that should be verified (accepts extensions parameter)
- **checkForUncaughtErrors**: Function to check for errors in extensions (accepts extensions parameter)

## Using Extension Configurations

### Basic Usage

By default, all Salesforce extensions will be configured with their default settings:

```typescript
const testConfig: TestReqConfig = {
  projectConfig: {
    projectShape: ProjectShapeOption.NEW
  },
  isOrgRequired: false,
  testSuiteSuffixName: 'DefaultExtensions'
};

const testSetup = await TestSetup.setUp(testConfig);
```

### Configuring Specific Extensions

To specify which extensions to use and how they should be configured:

```typescript
const extensionConfigs: ExtensionConfig[] = [
  {
    extensionId: 'salesforcedx-vscode-core',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  }
];

const testConfig: TestReqConfig = {
  projectConfig: {
    projectShape: ProjectShapeOption.NEW
  },
  isOrgRequired: false,
  extensionConfigs: extensionConfigs,
  testSuiteSuffixName: 'CustomExtensionConfig'
};
```

### Using Custom Extensions

You can specify any VS Code extension, not just the predefined Salesforce extensions:

```typescript
const extensionConfigs: ExtensionConfig[] = [
  {
    extensionId: 'my-custom-extension',
    shouldInstall: 'always',
    shouldVerifyActivation: true,
    vsixPath: '/path/to/my-extension.vsix'
  }
];
```

### Using Functions with Extension Parameters

The framework functions now accept extension lists as parameters, making them reusable:

```typescript
import { getExtensionsToVerifyActive, checkForUncaughtErrors } from '@salesforce/salesforcedx-vscode-test-tools';

// Get extensions to verify from your configured list
const extensionsToVerify = getExtensionsToVerifyActive(myExtensionList);

// Or use with a predicate filter
const filteredExtensions = getExtensionsToVerifyActive(myExtensionList, ext =>
  ext.extensionId.startsWith('salesforce')
);

// Check for uncaught errors in your configured extensions
await checkForUncaughtErrors(myExtensionList);
```

## Migration Guide

If you're upgrading from a previous version where extensions were hardcoded:

### Before

```typescript
// Functions used the global extensions list
const extensionsToVerify = getExtensionsToVerifyActive();
await checkForUncaughtErrors();
```

### After

```typescript
// Functions now require extensions parameter
const extensionsToVerify = getExtensionsToVerifyActive(myExtensionList);
await checkForUncaughtErrors(myExtensionList);
```

New code should always pass extensions explicitly as parameters.

## Best Practices

1. **Define extensions in your project**: Create a constants file in your test project to define the extensions you need
2. **Use ExtensionConfig type**: This type provides flexibility with optional fields like `name` and `vsixPath`
3. **Pass extensions explicitly**: Always pass your extension list to functions - the framework has no hardcoded extension lists
4. **Keep it simple**: Only include the fields you need - `name` and `vsixPath` are optional

## Example Project Structure

```
my-project/
├── test/
│   ├── testData/
│   │   └── constants.ts          # Define your extensions here
│   └── specs/
│       └── myTest.e2e.ts         # Use extensions in tests
└── package.json
```

Example `constants.ts`:

```typescript
import { ExtensionConfig } from '@salesforce/salesforcedx-vscode-test-tools';

// Example: Salesforce Extensions
export const salesforceExtensions: ExtensionConfig[] = [
  {
    extensionId: 'salesforcedx-vscode-core',
    name: 'Salesforce CLI Integration',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex',
    name: 'Apex',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-lwc',
    name: 'Lightning Web Components',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  }
];

// Example: Custom third-party extension
export const customExtension: ExtensionConfig = {
  extensionId: 'redhat.vscode-yaml',
  name: 'YAML',
  shouldInstall: 'always',
  shouldVerifyActivation: true
};

// Example: Extension from VSIX file
export const vsixExtension: ExtensionConfig = {
  extensionId: 'my-custom-extension',
  name: 'My Custom Extension',
  shouldInstall: 'always',
  shouldVerifyActivation: true,
  vsixPath: '/path/to/my-extension.vsix'
};
```

### Excluding Extensions (Backward Compatibility)

For backward compatibility, you can still exclude extensions:

```typescript
const testConfig: TestReqConfig = {
  projectConfig: {
    projectShape: ProjectShapeOption.NEW
  },
  isOrgRequired: false,
  excludedExtensions: ['salesforcedx-vscode-apex-debugger', 'salesforcedx-vscode-apex-replay-debugger'],
  testSuiteSuffixName: 'ExcludedExtensions'
};
```

## Extension Configuration Options

Each extension can be configured with the following options:

- **extensionId**: The ID of the extension (can be any valid VS Code extension ID)
- **name**: Optional display name for the extension (defaults to extensionId if not provided)
- **shouldInstall**: Whether the extension should be installed
  - `'always'`: Always install the extension
  - `'never'`: Never install the extension
  - `'optional'`: Install the extension if available
- **shouldVerifyActivation**: Whether to verify the extension is activated during test setup
- **vsixPath**: Optional path to a VSIX file for custom extension installation

## Accessing Extension Configuration During Tests

Once the test is set up, you can access the configured extensions:

```typescript
// Get extensions that should be verified
const extensionsToVerify = testSetup.getExtensionsToVerify();

// Get extensions with specific installation option
const requiredExtensions = testSetup.getExtensionsToInstall('always');
const optionalExtensions = testSetup.getExtensionsToInstall('optional');
```

## Complete Example

Here's a complete example showing how to set up tests with custom extensions:

```typescript
// test/testData/constants.ts
import { ExtensionConfig } from '@salesforce/salesforcedx-vscode-test-tools';

export const myExtensions: ExtensionConfig[] = [
  {
    extensionId: 'salesforcedx-vscode-core',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  }
];

// test/specs/myTest.e2e.ts
import { TestSetup, TestReqConfig, ProjectShapeOption } from '@salesforce/salesforcedx-vscode-test-tools';
import { myExtensions } from '../testData/constants';

describe('My Test Suite', () => {
  let testSetup: TestSetup;

  const testReqConfig: TestReqConfig = {
    projectConfig: {
      projectShape: ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    extensionConfigs: myExtensions,
    testSuiteSuffixName: 'MyTest'
  };

  before('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
  });

  after('Tear down', async () => {
    await testSetup?.tearDown();
  });

  it('should run my test', async () => {
    // Your test code here
  });
});
```

## VSIX Installation Directory

In addition to configuring individual extensions, you can specify a dedicated directory containing VSIX files to be installed during test setup using the `vsixToInstallDir` property in the `TestConfig` interface. This separates the source of VSIX files from the extensions folder where they get installed.

You can configure this in two ways:

1. Environment variable: `VSIX_TO_INSTALL`
2. Programmatically through the `TestConfig` interface

Example setting a custom VSIX directory in your test:

```typescript
import { TestSetupAndRunner, TestConfig } from '@salesforce/salesforcedx-vscode-test-tools';

const testConfig: Partial<TestConfig> = {
  vsixToInstallDir: '/path/to/vsix-directory'
};

const testRunner = new TestSetupAndRunner(testConfig);
await testRunner.setup();
```

If a VSIX installation directory is specified, the framework will:

1. Look for VSIX files in this directory first
2. Install all VSIX files found in this directory
3. Skip looking in the extensions folder if VSIXs are found in the specified directory

If both the `TestConfig` and environment variable are set, the `TestConfig` value takes precedence.
