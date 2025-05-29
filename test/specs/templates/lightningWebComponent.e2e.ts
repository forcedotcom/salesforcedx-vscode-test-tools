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

describe('Lightning Web Component Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'LightningWebComponentTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Lightning Web Component
  it('Create Lightning Web Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create Lightning Web Component`);
    // Using the Command palette, run SFDX: Create Lightning Web Component.
    await utilities.createCommand(
      'Lightning Web Component',
      'lightningWebComponent1',
      path.join('lwc', 'lightningWebComponent1'),
      'js'
    );

    // Check for expected items in the Explorer view.
    const workbench = utilities.getWorkbench();

    // Check for the presence of the directory, "lightningWebComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'lightningWebComponent1'
    );
    expect(filteredTreeViewItems.includes('lightningWebComponent1')).to.equal(true);
    expect(filteredTreeViewItems.includes('lightningWebComponent1.html')).to.equal(true);
    expect(filteredTreeViewItems.includes('lightningWebComponent1.js')).to.equal(true);
    expect(filteredTreeViewItems.includes('lightningWebComponent1.js-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Lightning Web Component', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Lightning Web Component`);
    const expectedText = [
      `import { LightningElement } from 'lwc';`,
      '',
      'export default class LightningWebComponent1 extends LightningElement {}'
    ].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lightningWebComponent1.js');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
