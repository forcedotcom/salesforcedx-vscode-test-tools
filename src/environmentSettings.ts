/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'fs';
import { join } from 'path';
import { LOG_LEVELS, LogLevel } from './core/constants';

/**
 * Singleton class to manage environment settings for Salesforce DX VSCode automation tests
 *
 * @remarks
 * This class loads configuration from environment variables at initialization time
 */
export class EnvironmentSettings {
  private static _instance: EnvironmentSettings;

  /**
   * VSCode version to use in tests
   * @env CODE_VERSION - VSCode version identifier
   * @default 'latest'
   */
  private _vscodeVersion = 'latest';

  /**
   * Specific test spec files to run
   * @env SPEC_FILES - Test spec filename(s) to run, will be prefixed with 'lib/specs/'
   * @default []
   */
  private _specFiles: string[] = [];

  /**
   * DevHub org alias name
   * @env DEV_HUB_ALIAS_NAME - Alias for the DevHub org
   * @default 'vscodeOrg'
   */
  private _devHubAliasName = 'vscodeOrg';

  /**
   * DevHub username
   * @env DEV_HUB_USER_NAME - Username for the DevHub org
   * @default 'svcideebot@salesforce.com'
   */
  private _devHubUserName = 'svcideebot@salesforce.com';

  /**
   * SFDX auth URL for authentication
   * @env SFDX_AUTH_URL - URL for authenticating with Salesforce DX
   * @default undefined
   */
  private _sfdxAuthUrl = process.env.SFDX_AUTH_URL;

  /**
   * Salesforce org ID
   * @env ORG_ID - ID of the Salesforce org
   * @default undefined
   */
  private _orgId = process.env.ORG_ID;

  /**
   * Path to Salesforce DX VSCode extensions
   * @env EXTENSION_PATH - Path to extensions directory
   * @env SALESFORCEDX_VSCODE_EXTENSIONS_PATH - Alternative path (takes precedence)
   * @default '[project_root]/salesforcedx-vscode/extensions'
   */
  private _extensionPath = join(__dirname, '..', '..', 'salesforcedx-vscode', 'extensions');

  /**
   * Test execution start time
   * @default current time formatted as short time string
   */
  private _startTime = new Date(Date.now()).toLocaleTimeString([], { timeStyle: 'short' });

  /**
   * Factor to slow down test execution
   * @env THROTTLE_FACTOR - Number to multiply timeouts by
   * @default 1
   */
  private _throttleFactor = 1;

  /**
   * Java home directory path
   * @env JAVA_HOME - Path to Java installation
   * @default undefined
   */
  private _javaHome = process.env.JAVA_HOME;

  /**
   * Path to an existing project to use instead of creating a new one
   * @env USE_EXISTING_PROJECT_PATH - Path to existing project directory
   * @default undefined
   */
  private _useExistingProject: string | undefined;

  /**
   * Log level for test execution
   * @env E2E_LOG_LEVEL - One of the valid log levels defined in LOG_LEVELS
   * @default 'info'
   */
  private _logLevel: LogLevel = 'info';

  /**
   * Private constructor that loads all settings from environment variables
   * Follows the Singleton pattern - use getInstance() to access
   */
  private constructor() {
    this._vscodeVersion = process.env.CODE_VERSION || this._vscodeVersion;

    if (process.env.SPEC_FILES) {
      this._specFiles = ['lib/specs/' + process.env.SPEC_FILES];
    }

    this._devHubAliasName = process.env.DEV_HUB_ALIAS_NAME || this._devHubAliasName;
    this._devHubUserName = process.env.DEV_HUB_USER_NAME || this._devHubUserName;
    this._extensionPath = process.env.EXTENSION_PATH || this._extensionPath;
    this._throttleFactor = parseInt(process.env.THROTTLE_FACTOR ?? '0') || this._throttleFactor;
    this._sfdxAuthUrl = process.env.SFDX_AUTH_URL || this._sfdxAuthUrl;
    this._orgId = process.env.ORG_ID || this._orgId;
    this._extensionPath = process.env.SALESFORCEDX_VSCODE_EXTENSIONS_PATH || this._extensionPath;
    this._logLevel = LOG_LEVELS.some(l => l === process.env.E2E_LOG_LEVEL)
      ? (process.env.E2E_LOG_LEVEL as LogLevel)
      : this._logLevel;
    this._javaHome = process.env.JAVA_HOME || this._javaHome;
    this.useExistingProject = process.env.USE_EXISTING_PROJECT_PATH;
  }

  /**
   * Returns the singleton instance of EnvironmentSettings
   * Creates the instance if it doesn't exist
   */
  public static getInstance(): EnvironmentSettings {
    if (!EnvironmentSettings._instance) {
      EnvironmentSettings._instance = new EnvironmentSettings();
    }
    return EnvironmentSettings._instance;
  }

  /** Gets the VSCode version to use in tests */
  public get vscodeVersion(): string {
    return this._vscodeVersion;
  }

  /** Gets the spec files to run */
  public get specFiles(): string[] {
    return this._specFiles;
  }

  /** Gets the DevHub org alias name */
  public get devHubAliasName(): string {
    return this._devHubAliasName;
  }

  /** Gets the DevHub username */
  public get devHubUserName(): string {
    return this._devHubUserName;
  }

  /** Gets the path to Salesforce DX VSCode extensions */
  public get extensionPath(): string {
    return this._extensionPath;
  }

  /** Gets the throttle factor for slowing down test execution */
  public get throttleFactor(): number {
    return this._throttleFactor;
  }

  /** Gets the test execution start time */
  public get startTime(): string {
    return this._startTime;
  }

  /** Gets the SFDX auth URL for authentication */
  public get sfdxAuthUrl(): string | undefined {
    return this._sfdxAuthUrl;
  }

  /** Gets the Salesforce org ID */
  public get orgId(): string | undefined {
    return this._orgId;
  }

  /** Gets the Java home directory path */
  public get javaHome(): string | undefined {
    return this._javaHome;
  }

  /** Gets the path to an existing project */
  public get useExistingProject(): string | undefined {
    return this._useExistingProject;
  }

  /**
   * Sets the path to an existing project
   * @param existingProject Path to the project directory
   * @throws Error if the specified path does not exist
   */
  public set useExistingProject(existingProject: string | undefined) {
    const projectPath = existingProject ?? process.env.USE_EXISTING_PROJECT_PATH;
    if (!projectPath) {
      this._useExistingProject = undefined;
      return;
    }
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path for "${projectPath}" does not exist`);
    }

    this._useExistingProject = projectPath;
  }

  /** Gets the log level for test execution */
  public get logLevel(): LogLevel {
    return this._logLevel;
  }
}
