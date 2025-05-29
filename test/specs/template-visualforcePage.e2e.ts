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

describe('Visualforce Page Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'VisualforcePageTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Visualforce Page
  it('Create a Visualforce Page', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create a Visualforce Page`);
    // Using the Command palette, run "SFDX: Create Visualforce Page".
    await utilities.createCommand('Visualforce Page', 'VisualforcePage1', 'pages', 'page');

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforcePage1'
    );
    expect(filteredTreeViewItems.includes('VisualforcePage1.page')).to.equal(true);
    expect(filteredTreeViewItems.includes('VisualforcePage1.page-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Visualforce Page', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Visualforce Page`);
    // Verify the default code for a Visualforce Page.
    const expectedText = [
      '<apex:page >',
      '<!-- Begin Default Content REMOVE THIS -->',
      '<h1>Congratulations</h1>',
      'This is your new Page',
      '<!-- End Default Content REMOVE THIS -->',
      '</apex:page>'
    ].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'VisualforcePage1.page');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
