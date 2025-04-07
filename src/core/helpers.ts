import { join } from 'path';
import { TestConfig } from './types';
import { EnvironmentSettings } from '../environmentSettings';

/**
 * Creates a default test configuration based on environment settings
 *
 * @param overrides - Optional partial TestConfig to override default values
 * @returns A complete TestConfig object
 */
export function createDefaultTestConfig(overrides?: Partial<TestConfig>): TestConfig {
  const env = EnvironmentSettings.getInstance();

  // Create default config
  const defaultConfig: TestConfig = {
    workspacePath: env.workspacePath,
    extensionsPath: env.extensionPath,
    vscodeVersion: env.vscodeVersion
  };

  // Merge with overrides
  return { ...defaultConfig, ...overrides };
}

/**
 * Ensures that all required paths for testing exist
 *
 * @param config - The test configuration to validate
 */
export function validateTestConfig(config: TestConfig): void {
  if (!config.workspacePath) {
    throw new Error('TestConfig.workspacePath is required');
  }

  if (!config.extensionsPath) {
    // Default to 'extensions' subfolder of workspace path
    config.extensionsPath = join(config.workspacePath, 'extensions');
  }

  if (!config.vscodeVersion) {
    config.vscodeVersion = 'stable';
  }
}
