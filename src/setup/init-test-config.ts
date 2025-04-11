/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'fs';
import * as path from 'path';
import { TEMPLATE_DIR } from '..';

/**
 * Options for initializing test configuration
 */
export interface InitTestConfigOptions {
  /**
   * Target directory where test files should be created
   * If not specified, uses current working directory
   */
  targetDir?: string;

  /**
   * Whether to overwrite existing files
   * @default false
   */
  overwrite?: boolean;

  /**
   * Which template files to include
   * @default all
   */
  include?: string[];

  /**
   * Which template files to exclude
   * @default none
   */
  exclude?: string[];
}

/**
 * Initializes test configuration by copying template files to the target directory
 *
 * @param options Options for initializing test configuration
 * @returns Object containing information about copied files
 *
 * @example
 * ```typescript
 * import { initTestConfig } from '@salesforce/salesforcedx-vscode-test-tools/lib/setup/init-test-config';
 *
 * // Initialize test config in the current directory
 * initTestConfig();
 *
 * // Initialize test config in a specific directory
 * initTestConfig({ targetDir: './my-project' });
 *
 * // Initialize only specific templates
 * initTestConfig({ include: ['mocha.config.js', 'test-setup.ts'] });
 * ```
 */
export function initTestConfig(options: InitTestConfigOptions = {}): {
  copied: string[];
  skipped: string[];
  targetDir: string;
} {
  const targetDir = options.targetDir || process.cwd();
  const overwrite = options.overwrite || false;

  // Make sure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create test directory structure
  const testDir = path.join(targetDir, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'ui'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'unit'), { recursive: true });
  }

  // Get all template files
  let templateFiles = fs.readdirSync(TEMPLATE_DIR);

  // Filter files based on include/exclude options
  if (options.include) {
    templateFiles = templateFiles.filter(file =>
      options.include!.some(pattern => file === pattern || file.startsWith(pattern))
    );
  }

  if (options.exclude) {
    templateFiles = templateFiles.filter(
      file => !options.exclude!.some(pattern => file === pattern || file.startsWith(pattern))
    );
  }

  const copied: string[] = [];
  const skipped: string[] = [];

  // Copy each template file to the target directory
  for (const file of templateFiles) {
    const sourcePath = path.join(TEMPLATE_DIR, file);
    let targetPath: string;

    // Handle special cases for certain files
    switch (file) {
      case 'mocha.config.js':
        targetPath = path.join(targetDir, '.mocharc.js');
        break;
      case 'test-setup.ts':
        targetPath = path.join(testDir, 'setup.ts');
        break;
      case 'example.test.ts':
        targetPath = path.join(testDir, 'ui', 'example.test.ts');
        break;
      case 'package.json.test':
        // Don't overwrite package.json, just show what to add
        console.log(`Skipping package.json.test - merge this manually with your package.json`);
        skipped.push(file);
        continue;
      case 'launch.json':
        const vscodeDir = path.join(targetDir, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
          fs.mkdirSync(vscodeDir, { recursive: true });
        }
        targetPath = path.join(vscodeDir, 'launch.json');
        break;
      default:
        targetPath = path.join(targetDir, file);
        break;
    }

    // Check if file already exists
    if (fs.existsSync(targetPath) && !overwrite) {
      console.log(`Skipping ${targetPath} (already exists)`);
      skipped.push(file);
      continue;
    }

    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Created ${targetPath}`);
    copied.push(file);
  }

  return { copied, skipped, targetDir };
}

// Add CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: InitTestConfigOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' || arg === '-t') {
      options.targetDir = args[++i];
    } else if (arg === '--overwrite' || arg === '-o') {
      options.overwrite = true;
    } else if (arg === '--include' || arg === '-i') {
      options.include = args[++i].split(',');
    } else if (arg === '--exclude' || arg === '-e') {
      options.exclude = args[++i].split(',');
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: init-test-config [options]

Options:
  --target, -t     Target directory where test files should be created
  --overwrite, -o  Overwrite existing files
  --include, -i    Comma-separated list of files to include
  --exclude, -e    Comma-separated list of files to exclude
  --help, -h       Show this help message
      `);
      process.exit(0);
    }
  }

  // Run the initialization
  const result = initTestConfig(options);
  console.log(`\nInitialization complete!`);
  console.log(`- Target directory: ${result.targetDir}`);
  console.log(`- Copied files: ${result.copied.length}`);
  console.log(`- Skipped files: ${result.skipped.length}`);
}
