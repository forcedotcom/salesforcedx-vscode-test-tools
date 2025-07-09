/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs';
import path from 'path';
import { TestSetup } from '../testSetup';
import { log } from '../core/miscellaneous';
import FastGlob from 'fast-glob';

/**
 * Creates custom Salesforce objects in the project's force-app directory
 * Copies object definitions from testSetup.testDataFolderPath to the project
 * @param testSetup - The test setup object containing project paths
 * @throws Error if copying fails or paths are undefined
 */
export const createCustomObjects = async (testSetup: TestSetup): Promise<void> => {
  const projectPath = testSetup.projectFolderPath;
  const testDataFolderPath = testSetup.testDataFolderPath;
  if (!testDataFolderPath) {
    throw new Error('testDataFolderPath is undefined');
  }
  if (!projectPath) {
    throw new Error('projectPath is undefined');
  }

  const source = testDataFolderPath;
  const destination = path.join(projectPath, 'force-app', 'main', 'default', 'objects');

  // Ensure the project path has been created
  fs.mkdirSync(path.dirname(destination), { recursive: true });

  try {
    await fs.promises.cp(source, destination, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      log(`Failed in copying custom objects ${error.message}`);
    }
    log(`source was: '${source}'`);
    log(`destination was: '${destination}'`);
    await testSetup?.tearDown();
    throw error;
  }
};

/**
 * Creates a global Apex code snippets file in the project's .vscode directory
 * @param testSetup - The test setup object containing project paths
 * @throws Error if file creation fails or paths are undefined
 */
export const createGlobalSnippetsFile = async (testSetup: TestSetup): Promise<void> => {
  const projectPath = testSetup.projectFolderPath;
  if (!projectPath) {
    throw new Error('projectPath is undefined');
  }
  const destination = path.join(projectPath, '.vscode', 'apex.json.code-snippets');
  const apexSnippet = [
    `{`,
    `"SOQL": {`,
    `"prefix": "soql",`,
    `"body": [`,
    `  "[SELECT \${1:field1, field2} FROM \${2:SobjectName} WHERE \${3:clause}];"`,
    `],`,
    `"description": "Apex SOQL query"`,
    `}`,
    `}`
  ].join('\n');

  try {
    fs.writeFileSync(destination, apexSnippet, 'utf8');
  } catch (error) {
    if (error instanceof Error) {
      log(`Failed in creating apex snippets file ${error.message}`);
    }
    log(`destination was: '${destination}'`);
    await testSetup?.tearDown();
    throw error;
  }
};

/**
 * Scans the directory for vsix files and returns the full path to each file
 * @param vsixDir
 * @returns
 */
export const getVsixFilesFromDir = (vsixDir: string): string[] =>
  FastGlob.sync('**/*.vsix', { cwd: vsixDir }).map(vsixFile => path.join(vsixDir, vsixFile));

/**
 * Return folder name if given path is a directory, otherwise return null
 * @param folderPath
 * @returns folder name
 */
export const getFolderName = (folderPath: string): string | null => {
  try {
    // Check if the given path exists and if it is a directory
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
      // Extract and return the folder name
      return path.basename(folderPath);
    } else {
      return null; // It's not a directory
    }
  } catch (err) {
    console.error('Error checking path:', err);
    return null; // The path doesn't exist or isn't accessible
  }
};
