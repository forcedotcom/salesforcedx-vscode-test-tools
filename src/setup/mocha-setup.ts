/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { before, after } from 'mocha';
import { TestSetupAndRunner } from '../test-setup-and-runner';
import { TestConfig } from '../core/types';

/**
 * Global TestRunner instance for use in tests
 */
export let testRunner: TestSetupAndRunner;

/**
 * Sets up the test environment for Mocha-based tests
 *
 * @param options - TestConfig options to configure the test environment
 * @param setupTimeoutMs - Timeout for the setup phase in milliseconds
 * @param teardownTimeoutMs - Timeout for the teardown phase in milliseconds
 * @param skipTeardown - Whether to skip the teardown phase
 * @returns The initialized TestSetupAndRunner instance
 *
 */
export function setupTestEnvironment(
  options: Partial<TestConfig> = {},
  setupTimeoutMs = 500000,
  teardownTimeoutMs = 30000,
  skipTeardown = false
): TestSetupAndRunner {
  // Set up before all tests
  before(async function () {
    // Increase timeout for setup phase
    this.timeout(setupTimeoutMs);

    // Create and initialize the test runner
    testRunner = new TestSetupAndRunner(options);

    // Run the setup
    await testRunner.setup();

    return testRunner;
  });

  // Clean up after all tests
  if (!skipTeardown) {
    after(async function () {
      this.timeout(teardownTimeoutMs);

      try {
        const browser = await testRunner.getDriver();
        if (browser) {
          await browser.quit();
        }
      } catch (error) {
        console.error('Error during test teardown:', error);
      }
    });
  }

  return testRunner;
}

/**
 * Sets up the test environment for Mocha-based tests without automatic teardown
 * Use this when you need to control the teardown process manually
 *
 * @param options - TestConfig options to configure the test environment
 * @param setupTimeoutMs - Timeout for the setup phase in milliseconds
 * @returns The initialized TestSetupAndRunner instance
 */
export function setupTestEnvironmentWithoutTeardown(
  options: Partial<TestConfig> = {},
  setupTimeoutMs = 500000
): TestSetupAndRunner {
  return setupTestEnvironment(options, setupTimeoutMs, 0, true);
}
