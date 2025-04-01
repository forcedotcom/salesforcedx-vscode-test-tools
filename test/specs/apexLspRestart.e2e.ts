/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities/index';
import { EnvironmentSettings } from '../environmentSettings';
import { By, WebElement, after } from 'vscode-extension-tester';
import path from 'path';
import { step } from 'mocha-steps';
import { expect, util } from 'chai';
import fs from 'fs';

// Constants
const projectPath = path.join(__dirname, '..', '..', 'e2e-temp','TempProject-ApexLspRestart');
const apexClassPath = path.join(projectPath, 'force-app', 'main', 'default', 'classes');
const INDEXING_COMPLETE = 'Indexing complete';
const LSP_RESTARTING = 'Apex Language Server is restarting';
const PRELUDE_STARTING = 'Apex Prelude Service STARTING';

// Helper Functions
const findReleaseDir = (): string => {
  const toolsPath = path.join(projectPath, '.sfdx', 'tools');
  const entries = fs.readdirSync(toolsPath);
  const match = entries.find(entry => /^\d{3}$/.test(entry));
  return match || '254';
};

const verifyLspStatus = async (expectedStatus: string): Promise<WebElement> => {
  const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
  await statusBar.click();
  expect(await statusBar.getAttribute('aria-label')).to.include(expectedStatus);
  return statusBar;
};

const verifyLspRestart = async (cleanDb: boolean): Promise<void> => {
  const option = cleanDb ? 'Clean Apex DB and Restart' : 'Restart Only';
  await utilities.acceptNotification('Clean Apex DB and Restart? Or Restart Only?', option, utilities.Duration.seconds(5));
  await verifyLspStatus(LSP_RESTARTING);
  await utilities.pause(utilities.Duration.seconds(5));
  await verifyLspStatus(INDEXING_COMPLETE);
  const outputViewText = await utilities.getOutputViewText('Apex Language Server');
  expect(outputViewText).to.contain(PRELUDE_STARTING);
};

const releaseDir = findReleaseDir();

describe('Apex LSP Restarting Functionality', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'ApexLspRestart'
  };

  // Environment Setup Tests
  step('Set up the testing environment', async () => {
    utilities.log('ApexLsp - Set up the testing environment');
    utilities.log(`ApexLsp - JAVA_HOME: ${EnvironmentSettings.getInstance().javaHome}`);
    testSetup = await TestSetup.setUp(testReqConfig);
    await utilities.pause(utilities.Duration.seconds(10));
    // Create Apex Class
    await utilities.createApexClassWithTest('ExampleClass');
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);
    // Go to apex class file
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'ExampleClass.cls');
    // Get Apex LSP Status Bar
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    expect(await statusBar.getAttribute('aria-label')).to.include(INDEXING_COMPLETE);

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Apex Language Server');
    utilities.log('Output view text');
    utilities.log(outputViewText);
  });

  // Command Palette Restart Tests
  step('Restart LSP alone via Command Palette', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Cmd Palette: LSP Restart Only`);
    await utilities.executeQuickPick('Restart Apex Language Server');
    await verifyLspRestart(false);
  });

  step('Restart LSP with cleaned db via Command Palette', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Cmd Palette: LSP Restart with cleaned db`);
    await utilities.removeFolder(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'));
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal(null);
    await utilities.executeQuickPick('Restart Apex Language Server');
    await verifyLspRestart(true);
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal('StandardApexLibrary');
  });

  // Status Bar Restart Tests
  step('Verify LSP can restart alone via Status Bar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Apex Status Bar: LSP Restart Only`);
    await utilities.dismissAllNotifications(); // clearing the screen for funsies
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    await utilities.pause(utilities.Duration.seconds(1)); // wait for the menu to open
    const restartButton = utilities.getWorkbench().findElement(By.linkText('Restart Apex Language Server'));
    await restartButton.click();
    await utilities.pause(utilities.Duration.seconds(2));
    await verifyLspRestart(false);
  });

  step('Verify LSP can restart with cleaned db via Status Bar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Apex Status Bar: LSP Restart with cleaned db`);
    await utilities.dismissAllNotifications(); // clearing the screen for funsies
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    await utilities.pause(utilities.Duration.seconds(1)); // wait for the menu to open
    const restartButton = utilities.getWorkbench().findElement(By.linkText('Restart Apex Language Server'));
    await restartButton.click();
    await utilities.pause(utilities.Duration.seconds(2));
    await verifyLspRestart(true);
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal('StandardApexLibrary');
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`);
    await utilities.removeFolder(apexClassPath);
    await testSetup?.tearDown();
  });
});
