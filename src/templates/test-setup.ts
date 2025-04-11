/**
 * Global test setup file for VS Code extension tests
 *
 * Copy this file to your project's test directory to configure the VS Code testing environment
 */
// @ts-expect-error - This will be resolved when used in the actual project
import { setupTestEnvironment } from '@salesforce/salesforcedx-vscode-test-tools';
import path from 'path';

// Configure test options
setupTestEnvironment(
  {
    // Test resources directory (where VS Code will be downloaded)
    testResources: path.join(__dirname, '..', '.vscode-test'),

    // Extensions directory (where extensions will be installed)
    extensionsFolder: path.join(__dirname, '..', '.vscode-test', 'extensions'),

    // VSIX directory (where your extension VSIX is located)
    // This could be dynamically located in your build pipeline
    vsixToInstallDir: path.join(__dirname, '..', 'dist'),

    // VS Code version to use
    codeVersion: 'stable' // or 'insiders', or specific version like '1.60.0'
  },
  // Setup timeout (300 seconds)
  300000
);

// @ts-expect-error - This will be resolved when used in the actual project
export * from '@salesforce/salesforcedx-vscode-test-tools';
