/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../../testSetup';
import * as utilities from '../../utilities/index';
import { expect } from 'chai';
import { after, before } from 'vscode-extension-tester';

describe('Apex Trigger Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'ApexTriggerTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Apex Trigger
  it('Create an Apex Trigger', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Apex Trigger`);
    // Using the Command palette, run "SFDX: Create Apex Trigger".
    await utilities.createCommand('Apex Trigger', 'ApexTrigger1', 'triggers', 'trigger');

    // Check for expected items in the Explorer view.
    const workbench = utilities.getWorkbench();

    // Get the matching (visible) items within the tree which contains "ApexTrigger1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexTrigger1'
    );
    expect(filteredTreeViewItems.includes('ApexTrigger1.trigger')).to.equal(true);
    expect(filteredTreeViewItems.includes('ApexTrigger1.trigger-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Apex Trigger', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Apex Trigger`);
    // Verify the default trigger.
    const expectedText = ['trigger ApexTrigger1 on SOBJECT (before insert) {', '', '}'].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexTrigger1.trigger');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
