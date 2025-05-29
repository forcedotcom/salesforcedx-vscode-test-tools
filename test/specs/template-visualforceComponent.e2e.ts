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

describe('Visualforce Component Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'VisualforceComponentTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
    await utilities.dismissAllNotifications();
  });

  // Visualforce Component
  it('Create a Visualforce Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create a Visualforce Component`);
    // Using the Command palette, run "SFDX: Create Visualforce Component".
    await utilities.createCommand('Visualforce Component', 'VisualforceCmp1', 'components', 'component');
    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforceCmp1'
    );
    expect(filteredTreeViewItems.includes('VisualforceCmp1.component')).to.equal(true);
    expect(filteredTreeViewItems.includes('VisualforceCmp1.component-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Visualforce Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Visualforce Component`);
    // Verify the default code for a Visualforce Component.
    const expectedText = [
      '<apex:component >',
      '<!-- Begin Default Content REMOVE THIS -->',
      '<h1>Congratulations</h1>',
      'This is your new Component',
      '<!-- End Default Content REMOVE THIS -->',
      '</apex:component>'
    ].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'VisualforceCmp1.component');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
