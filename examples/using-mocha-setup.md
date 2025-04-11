# Using Mocha Setup for VS Code Extension Testing

This example demonstrates how to use the Mocha setup utilities provided by this framework to create VS Code extension tests.

## Basic Setup

1. First, create a test setup file in your project:

```typescript
// test/setup.ts
import { setupTestEnvironment } from '@salesforce/salesforcedx-vscode-test-tools/lib/setup/mocha-setup';

// Initialize the test environment with your configuration
setupTestEnvironment({
  // Specify path to test resources (where VS Code will be downloaded)
  testResources: './test-resources',

  // Specify path to extensions folder
  extensionsFolder: './extensions',

  // Optional: specify path to VSIX files
  vsixToInstallDir: './vsix-files'
});
```

2. Configure Mocha in your package.json:

```json
{
  "scripts": {
    "test": "mocha -r ts-node/register --timeout 60000 'test/**/*.test.ts' --require test/setup.ts"
  }
}
```

3. Write your tests:

```typescript
// test/my-extension.test.ts
import { testRunner } from '@salesforce/salesforcedx-vscode-test-tools/lib/setup/mocha-setup';
import { VSBrowser, Workbench, ActivityBar } from 'vscode-extension-tester';
import { expect } from 'chai';

describe('My Extension', function () {
  it('should activate and show the extension view', async function () {
    // Each test has a generous timeout since UI interactions can be slow
    this.timeout(30000);

    // Use VSBrowser instance to interact with VS Code
    const browser = VSBrowser.instance;

    // Open a project folder
    await browser.openResources('/path/to/test/project');

    // Find and click on the extension's icon in the activity bar
    const workbench = new Workbench();
    const activityBar = await workbench.getActivityBar();
    const extensionView = await activityBar.getViewControl('My Extension');

    expect(extensionView).to.not.be.undefined;
    await extensionView.click();

    // Verify that the extension's view is open
    const sideBar = await workbench.getSideBar();
    const title = await sideBar.getTitlePart().getTitle();

    expect(title).to.equal('My Extension');
  });
});
```

## Advanced Configuration

For more control over the setup and teardown process:

```typescript
// test/custom-setup.ts
import { setupTestEnvironmentWithoutTeardown } from '@salesforce/salesforcedx-vscode-test-tools/lib/setup/mocha-setup';
import { after } from 'mocha';

// Initialize with custom timeouts and without automatic teardown
const runner = setupTestEnvironmentWithoutTeardown(
  {
    testResources: './test-resources',
    extensionsFolder: './extensions'
  },
  300000
); // 5 minute timeout for setup

// Custom teardown logic
after(async function () {
  this.timeout(60000);

  // Custom cleanup logic
  await runner.getDriver().then(driver => driver.quit());

  // Additional cleanup steps
  console.log('Test environment cleaned up');
});
```

## Running Specific Tests

You can also run specific tests while reusing the same setup:

```bash
# Run only login tests
npx mocha -r ts-node/register --timeout 60000 'test/login/**/*.test.ts' --require test/setup.ts

# Run only project creation tests
npx mocha -r ts-node/register --timeout 60000 'test/project/**/*.test.ts' --require test/setup.ts
```
