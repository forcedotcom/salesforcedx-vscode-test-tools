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

describe('Apex Class Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'ApexClassTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Apex Class
  it('Create an Apex Class', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Apex Class`);
    // Using the Command palette, run SFDX: Create Apex Class.
    await utilities.createCommand('Apex Class', 'ApexClass1', 'classes', 'cls');
  });

  it('shows up in the Explorer view', async () => {
    // Check for expected items in the Explorer view.
    const workbench = utilities.getWorkbench();

    // Get the matching (visible) items within the tree which contains "ApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexClass1'
    );

    expect(filteredTreeViewItems.includes('ApexClass1.cls')).to.equal(true);
    expect(filteredTreeViewItems.includes('ApexClass1.cls-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Apex Class', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Apex Class`);
    const expectedText = ['public with sharing class ApexClass1 {', '    public ApexClass1() {', '', '    }', '}'].join(
      '\n'
    );
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexClass1.cls');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
