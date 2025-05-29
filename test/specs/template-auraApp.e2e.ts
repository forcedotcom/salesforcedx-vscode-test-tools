/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities/index';
import { expect } from 'chai';
import { after, before } from 'vscode-extension-tester';
import path from 'path';

describe('Aura App Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'AuraAppTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
    await utilities.dismissAllNotifications();
  });

  // Aura App
  it('Create an Aura App', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Aura App`);
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Aura App".
    const outputPanelText = await utilities.createCommand('Aura App', 'AuraApp1', path.join('aura', 'AuraApp1'), 'app');
    const basePath = path.join('force-app', 'main', 'default', 'aura', 'AuraApp1');
    const docPath = path.join(basePath, 'AuraApp1.auradoc');
    expect(outputPanelText).to.contain(`create ${docPath}`);

    const cssPath = path.join(basePath, 'AuraApp1.css');
    expect(outputPanelText).to.contain(`create ${cssPath}`);

    const svgPath = path.join(basePath, 'AuraApp1.svg');
    expect(outputPanelText).to.contain(`create ${svgPath}`);

    const controllerPath = path.join(basePath, 'AuraApp1Controller.js');
    expect(outputPanelText).to.contain(`create ${controllerPath}`);

    const helperPath = path.join(basePath, 'AuraApp1Helper.js');
    expect(outputPanelText).to.contain(`create ${helperPath}`);

    const rendererPath = path.join(basePath, 'AuraApp1Renderer.js');
    expect(outputPanelText).to.contain(`create ${rendererPath}`);

    // Get the matching (visible) items within the tree which contains "AuraApp1".
    const workbench = utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraApp1'
    );
    expect(filteredTreeViewItems.includes('AuraApp1.app')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1.app-meta.xml')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1.auradoc')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1.css')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1.svg')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1Controller.js')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1Helper.js')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraApp1Renderer.js')).to.equal(true);
  });

  it('Verify the contents of the Aura App', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Aura App`);
    // Verify the default code for an Aura App.
    const expectedText = ['<aura:application>', '', '</aura:application>'].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'AuraApp1.app');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
