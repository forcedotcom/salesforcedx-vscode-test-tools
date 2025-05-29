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

describe('Aura Component Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'AuraComponentTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
    await utilities.dismissAllNotifications();
  });

  // Aura Component
  it('Create an Aura Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Aura Component`);
    // Using the Command palette, run SFDX: Create Aura Component.
    await utilities.createCommand('Aura Component', 'auraComponent1', path.join('aura', 'auraComponent1'), 'cmp');
    // Zoom out so all tree items are visible
    const workbench = utilities.getWorkbench();
    await utilities.zoom('Out', 1, utilities.Duration.seconds(2));
    // Check for the presence of the directory, "auraComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'auraComponent1'
    );
    expect(filteredTreeViewItems.includes('auraComponent1')).to.equal(true);

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    expect(filteredTreeViewItems.includes('auraComponent1.cmp')).to.equal(true);
    expect(filteredTreeViewItems.includes('auraComponent1.cmp-meta.xml')).to.equal(true);
    expect(filteredTreeViewItems.includes('auraComponent1Controller.js')).to.equal(true);
    expect(filteredTreeViewItems.includes('auraComponent1Helper.js')).to.equal(true);
    expect(filteredTreeViewItems.includes('auraComponent1Renderer.js')).to.equal(true);

    // Could also check for .auradoc, .css, .design, and .svg, but not as critical
    // and since this could change w/o our knowing, only check for what we need to here.
  });

  it('Verify the contents of the Aura Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Aura Component`);
    const expectedText = ['<aura:component>', '', '</aura:component>'].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'auraComponent1.cmp');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
