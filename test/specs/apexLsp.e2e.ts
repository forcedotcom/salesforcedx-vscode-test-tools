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
import fs from 'fs';
import { step } from 'mocha-steps';
import { expect } from 'chai';

// Constants
const projectPath = path.join(__dirname, '..', '..', 'e2e-temp', 'TempProject-ApexLsp');
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

describe('Apex LSP', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'ApexLsp'
  };

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
    expect(await statusBar.getAttribute('aria-label')).to.include('Indexing complete');

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Apex Language Server');
    utilities.log('Output view text');
    utilities.log(outputViewText);
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');
    // Move cursor to the middle of "ExampleClass.SayHello() call"
    await textEditor.moveCursor(6, 20);
    await utilities.pause(utilities.Duration.seconds(1));

    // Go to definition through F12
    await utilities.executeQuickPick('Go to Definition', utilities.Duration.seconds(2));

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).to.equal('ExampleClass.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await utilities.getWorkbench().wait();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');

    // Move cursor to line 7 and type ExampleClass.say
    await textEditor.typeTextAt(7, 1, '\tExampleClass.say');
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify autocompletion options are present
    const autocompletionOptions = await workbench.findElements(By.css('div.monaco-list-row.show-file-icons'));
    const ariaLabel = await autocompletionOptions[0].getAttribute('aria-label');
    expect(ariaLabel).to.contain('SayHello(name)');
    await autocompletionOptions[0].click();
    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await textEditor.typeText(`'Jack`);
    await textEditor.typeTextAt(7, 38, ';');
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(1));
    const line7Text = await textEditor.getTextAtLine(7);
    expect(line7Text).to.include(`ExampleClass.SayHello('Jack');`);
  });

  // Command Palette Restart Tests
  step('Restart LSP alone via Command Palette', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Cmd Palette: LSP Restart Only`);
    await utilities.executeQuickPick('Restart Apex Language Server');
    await verifyLspRestart(false);
  });

  step('Restart LSP with cleaned db via Command Palette', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Cmd Palette: LSP Restart with cleaned db`);
    const releaseDir = findReleaseDir();
    await utilities.removeFolder(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'));
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal(null);
    await utilities.executeQuickPick('Restart Apex Language Server');
    await verifyLspRestart(true);
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal('StandardApexLibrary');
  });

  // Status Bar Restart Tests
  step('Verify LSP can restart alone via Status Bar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Apex Status Bar: LSP Restart Only`);
    await utilities.dismissAllNotifications();
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    await utilities.pause(utilities.Duration.seconds(1));
    const restartButton = utilities.getWorkbench().findElement(By.linkText('Restart Apex Language Server'));
    await restartButton.click();
    await utilities.pause(utilities.Duration.seconds(2));
    await verifyLspRestart(false);
  });

  step('Verify LSP can restart with cleaned db via Status Bar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Apex Status Bar: LSP Restart with cleaned db`);
    await utilities.dismissAllNotifications();
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    await utilities.pause(utilities.Duration.seconds(1));
    const restartButton = utilities.getWorkbench().findElement(By.linkText('Restart Apex Language Server'));
    await restartButton.click();
    await utilities.pause(utilities.Duration.seconds(2));
    await verifyLspRestart(true);
    const releaseDir = findReleaseDir();
    expect(await utilities.getFolderName(path.join(projectPath, '.sfdx/tools', releaseDir, 'StandardApexLibrary'))).to.equal('StandardApexLibrary');
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`);
    await utilities.removeFolder(apexClassPath);
    await testSetup?.tearDown();
  });
});
