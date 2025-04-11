/**
 * Mocha configuration for VS Code extension testing
 * This file can be copied to your project as .mocharc.js or used with --config
 */
module.exports = {
  // Require TypeScript transpilation
  require: [
    'ts-node/register',
    // Import the mocha setup tool from the framework
    '@salesforce/salesforcedx-vscode-test-tools/lib/setup/mocha-setup'
  ],

  // Use spec reporter for readable output
  reporter: 'spec',

  // Set generous timeout for UI tests (60 seconds)
  timeout: 60000,

  // Retry failed tests (optional)
  retries: 1,

  // Test file pattern
  spec: [
    'test/**/*.test.ts',
    // Exclude helper files
    '!test/helpers/**'
  ],

  // Allow tests to run in order they are defined (important for UI tests)
  sort: false,

  // VS Code extension tests can be slow; increase this if needed
  slow: 5000
};
