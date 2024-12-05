/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities/index';
import { EnvironmentSettings } from '../environmentSettings';
import { DefaultTreeItem, after } from 'vscode-extension-tester';
import { step } from 'mocha-steps';
import { expect } from 'chai';

describe('Apex Actions', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NAMED,
      githubRepoUrl: 'https://github.com/trailheadapps/dreamhouse-lwc.git'
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'ApexActions'
  };

  step('Set up the testing environment', async () => {
    utilities.log('ApexActions - Set up the testing environment');
    utilities.log(`ApexActions - JAVA_HOME: ${EnvironmentSettings.getInstance().javaHome}`);
    testSetup = await TestSetup.setUp(testReqConfig);
    await utilities.pause(utilities.Duration.seconds(10));
  });

  if (process.platform !== 'darwin') {
    step('SFDX: Create Apex Action from Selected Method', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Apex Action from Selected Method`);
      // Go to apex class file
      const workbench = utilities.getWorkbench();
      const editor = await utilities.getTextEditor(workbench, 'FileUtilities.cls');
      await editor.moveCursor(3, 30);
      const contextMenu = await editor.openContextMenu();
      await contextMenu.select('SFDX: Create Apex Action from Selected Method');

      // Verify 'SFDX: Create Apex Action from Selected Method' generated the open api file
      const editorView = workbench.getEditorView();
      const activeTab = await editorView.getActiveTab();
      const title = await activeTab?.getTitle();
      expect(title).to.equal('createFile_openapi.yml');

      // Verify file content
      const textEditor = await utilities.getTextEditor(workbench, title!);
      const expectedTexts = [
        'openapi: 3.0.0',
        'info:\n\ttitle:',
        '\tversion',
        'paths:\n\t',
        '/createFile:\n\t\tpost:',
        '\t\t\tsummary:',
        '\t\t\tparameters:',
        '\t\t\t\t- name: base64data',
        '\t\t\t\t\tin: query',
        '\t\t\t\t\trequired: true',
        '\t\t\t\t\tdescription:',
        '\t\t\t\t\tschema:\n\t\t\t\t\t\ttype: string',
        '\t\t\t\t- name: filename',
        '\t\t\t\t- name: recordId',
        '\t\t\tresponses'
      ];
      verifyFileContent(await textEditor.getText(), expectedTexts);
    });
  }

  step('SFDX: Create Apex Action from This Class - Command Palette', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Apex Action from This Class - Command Palette`);
    // Get open text editor
    const workbench = utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'SampleDataController.cls');

    // Run 'SFDX: Create Apex Action from This Class'
    await utilities.executeQuickPick('SFDX: Create Apex Action from This Class', utilities.Duration.seconds(2));

    // Verify 'SFDX: Create Apex Action from This Class' generated the open api file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).to.equal('SampleDataController_openapi.yml');

    // Verify file content
    const textEditor = await utilities.getTextEditor(workbench, title!);
    const expectedTexts = [
      'openapi: 3.0.0',
      'info:\n\ttitle:',
      '\tversion',
      'paths:\n\t',
      '/importSampleData:\n\t\tpost:',
      '\t\t\tsummary:',
      '\t\t\tparameters: []',
      '\t\t\tresponses'
    ];
    verifyFileContent(await textEditor.getText(), expectedTexts);
  });

  if (process.platform !== 'darwin') {
    step('SFDX: Create Apex Action from This Class - Editor', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Apex Action from This Class - Editor`);
      // Go to apex class file
      const workbench = utilities.getWorkbench();
      const editor = await utilities.getTextEditor(workbench, 'PropertyController.cls');
      await editor.moveCursor(10, 30);
      const contextMenu = await editor.openContextMenu();
      await contextMenu.select('SFDX: Create Apex Action from This Class');

      // Verify 'SFDX: Create Apex Action from This Class' generated the open api file
      const editorView = workbench.getEditorView();
      const activeTab = await editorView.getActiveTab();
      const title = await activeTab?.getTitle();
      expect(title).to.equal('PropertyController_openapi.yml');

      // Verify file content
      const textEditor = await utilities.getTextEditor(workbench, title!);
      const expectedTexts = [
        'openapi: 3.0.0',
        'info:\n\ttitle:',
        '\tversion',
        'paths:\n\t',
        '/getPagedPropertyList:\n\t\tpost:',
        '\t\t\tsummary:',
        '\t\t\tparameters:',
        '\t\t\t\t- name: searchKey',
        '\t\t\t\t\tin: query',
        '\t\t\t\t\trequired: true',
        '\t\t\t\t\tdescription:',
        '\t\t\t\t\tschema:\n\t\t\t\t\t\ttype: string',
        '\t\t\t\t- name: maxPrice',
        '\t\t\t\t- name: minBedrooms',
        '\t\t\t\t- name: minBathrooms',
        '\t\t\t\t- name: pageSize',
        '\t\t\t\t- name: pageNumber',
        '/getPictures:\n\t\tpost:',
        '\t\t\t\t- name: propertyId',
        '\t\t\tresponses'
      ];
      verifyFileContent(await textEditor.getText(), expectedTexts);
    });
  }

  if (process.platform !== 'darwin') {
    step('SFDX: Create Apex Action from This Class - Explorer', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Apex Action from This Class - Explorer`);
      // Close current editor
      await utilities.closeCurrentEditor();

      // Go to apex class file
      const workbench = await utilities.getWorkbench();
      const sidebar = await workbench.getSideBar().wait();
      const content = await sidebar.getContent().wait();
      const treeViewSection = await content.getSection(testSetup.tempProjectName);
      if (!treeViewSection) {
        throw new Error(
          'In verifyProjectLoaded(), getSection() returned a treeViewSection with a value of null (or undefined)'
        );
      }

      const objectTreeItem = (await treeViewSection.findItem('PropertyController.cls')) as DefaultTreeItem;
      if (!objectTreeItem) {
        throw new Error(
          'In verifyProjectLoaded(), findItem() returned a forceAppTreeItem with a value of null (or undefined)'
        );
      }

      expect(objectTreeItem).to.not.be.undefined;
      await (await objectTreeItem.wait()).expand();

      const contextMenu = await objectTreeItem.openContextMenu();
      await contextMenu.select('SFDX: Create Apex Action from This Class');

      // Verify 'SFDX: Create Apex Action from This Class' generated the open api file
      const editorView = workbench.getEditorView();
      const activeTab = await editorView.getActiveTab();
      const title = await activeTab?.getTitle();
      expect(title).to.equal('PropertyController_openapi.yml');
    });
  }

  step('SFDX: Create Apex Action from This Class - Not eligible', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Apex Action from This Class - Not eligible`);
    // Get open text editor
    const workbench = utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'GeocodingService.cls');

    // Run 'SFDX: Create Apex Action from This Class'
    await utilities.executeQuickPick('SFDX: Create Apex Action from This Class', utilities.Duration.seconds(2));

    const failureNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'Failed to create Apex Action: No eligible methods found in the open editor. Eligible methods are annotated with @AuraEnabled.',
      utilities.Duration.FIVE_MINUTES
    );
    expect(failureNotificationWasFound).to.equal(true);
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`);
    await testSetup?.tearDown();
  });

  const verifyFileContent = async (fileContent: string, expectedTexts: string[]): Promise<void> => {
    utilities.log(`verifyFileContent() - ${fileContent}`);
    for (const expectedText of expectedTexts) {
      utilities.log(`Expected text:\n ${expectedText}`);
      expect(fileContent).to.include(expectedText);
    }
  };
});
