/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import { EnvironmentSettings } from '../environmentSettings.ts';
import { Key } from 'vscode-extension-tester';
import { expect } from 'chai';

const CMD_KEY = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;

describe('Apex LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('ApexLsp - Set up the testing environment');
    utilities.log(`ApexLsp - JAVA_HOME: ${EnvironmentSettings.getInstance().javaHome}`);
    testSetup = new TestSetup('ApexLsp');
    await testSetup.setUp();

    // Create Apex Class
    await utilities.createApexClassWithTest('ExampleClass');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const re = await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));
    // Verify Apex extension is present and running
    const foundExtensions = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-apex')
    );
    await utilities.zoomReset();

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(foundExtensions).to.be.true;
    // Close running extensions view
    await re?.sendKeys(CMD_KEY, 'w');
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const statusBar = await utilities.getStatusBarItemWhichIncludes(
      'Editor Language Status'
    );
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
    await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');

    // Move cursor to the middle of "ExampleClass.SayHello() call"
    await workbench.sendKeys(CMD_KEY, 'f');
    await utilities.pause(utilities.Duration.seconds(1));
    await workbench.sendKeys('.SayHello');
    await workbench.sendKeys('Escape');
    await workbench.sendKeys('ArrowRight');
    await workbench.sendKeys('ArrowLeft');
    await workbench.sendKeys('ArrowLeft');
    await utilities.pause(utilities.Duration.seconds(1));

    // Go to definition through F12
    await workbench.sendKeys('F12');
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).to.be.equal('ExampleClass.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await utilities.getWorkbench().wait();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');

    // Move cursor to line 7 and type ExampleClass.s
    await workbench.sendKeys(CMD_KEY, 'f');
    await utilities.pause(utilities.Duration.seconds(1));
    await workbench.sendKeys('System.debug');
    await workbench.sendKeys('Escape');
    await workbench.sendKeys('ArrowLeft');
    await workbench.sendKeys('ArrowDown');
    await workbench.sendKeys('ArrowDown');
    await workbench.sendKeys('ExampleClass.say');
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify autocompletion options are present
    // const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    // await expect(await autocompletionOptions0.getAttribute('aria-haspopup')).toBe('true');
    // await expect(await autocompletionOptions0.getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await workbench.sendKeys('Enter');
    await textEditor.typeText(`'Jack`);
    await workbench.sendKeys('ArrowRight');
    await workbench.sendKeys('ArrowRight');
    await textEditor.typeText(';');
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(1));
    const line7Text = await textEditor.getTextAtLine(7);
    expect(line7Text).to.include(`ExampleClass.SayHello('Jack');`);
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});


