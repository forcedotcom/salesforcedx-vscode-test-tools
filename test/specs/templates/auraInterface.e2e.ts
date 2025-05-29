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
import path from 'path';

describe('Aura Interface Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'AuraInterfaceTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Aura Interface
  it('Create an Aura Interface', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Aura Interface`);
    // Using the Command palette, run "SFDX: Create Aura Interface".
    await utilities.createCommand('Aura Interface', 'AuraInterface1', path.join('aura', 'AuraInterface1'), 'intf');

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraInterface1'
    );

    expect(filteredTreeViewItems.includes('AuraInterface1.intf')).to.equal(true);
    expect(filteredTreeViewItems.includes('AuraInterface1.intf-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Aura Interface', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Aura Interface`);
    // Verify the default code for an Aura Interface.
    const expectedText = [
      '<aura:interface description="Interface template">',
      '  <aura:attribute name="example" type="String" default="" description="An example attribute."/>',
      '</aura:interface>'
    ].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'AuraInterface1.intf');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
