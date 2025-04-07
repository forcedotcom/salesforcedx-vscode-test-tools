/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ExtensionId } from '../testing/extensionUtils';

/**
 * Type representing the available Salesforce org editions
 */
export type OrgEdition = 'developer' | 'enterprise';

/**
 * Results from running a Salesforce CLI command
 */
export type SfCommandRunResults = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/**
 * Enumeration of project shape options for test configuration
 */
export enum ProjectShapeOption {
  /** No project needed */
  NONE,
  /** Any project is acceptable */
  ANY,
  /** A new project should be created */
  NEW,
  /** Tests will run on a well-known test project once wdio is initialized */
  NAMED
}

/**
 * Configuration for a project used in tests
 */
export type ProjectConfig = {
  /** The shape of the test project that the test runs on */
  projectShape: ProjectShapeOption;
  /** The local path to the project if the project shape is any or named */
  folderPath?: string;
  /** The url of the github repo, only exists when project shape is named */
  githubRepoUrl?: string;
};

/**
 * Configuration for test requirements
 */
export type TestReqConfig = {
  /** The project shape and the local path to the project */
  projectConfig: ProjectConfig;
  /** If org is required for the test. If not, do not need to create and log into the scratch org */
  isOrgRequired: boolean;
  /** The edition of the scratch org to be created, only specified when isOrgRequired is true */
  scratchOrgEdition?: OrgEdition;
  /** The extensions that do not need to be installed */
  excludedExtensions?: ExtensionId[];
  /** The test suite suffix name */
  testSuiteSuffixName: string;
};

/**
 * Configuration options for the test environment
 */
export interface TestConfig {
  /** Path to the workspace directory where VS Code and test artifacts are stored */
  workspacePath: string;
  /** Path to extensions directory */
  extensionsPath: string;
  /** VS Code version to use for testing */
  vscodeVersion: string;
}
