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

describe('Apex Unit Test Class Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'ApexUnitTestClassTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
  });

  // Apex Unit Test Class
  it('Create an Apex Unit Test Class', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create an Apex Unit Test Class`);
    // Using the Command palette, run SFDX: Create Apex Unit Test Class.
    await utilities.createCommand('Apex Unit Test Class', 'ApexUnitTestClass1', 'classes', 'cls');

    // Check for expected items in the Explorer view.
    const workbench = utilities.getWorkbench();

    // Get the matching (visible) items within the tree which contains "ApexUnitTestClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexUnitTestClass1'
    );

    expect(filteredTreeViewItems.includes('ApexUnitTestClass1.cls')).to.equal(true);
    expect(filteredTreeViewItems.includes('ApexUnitTestClass1.cls-meta.xml')).to.equal(true);
  });

  it('Verify the contents of the Apex Unit Test Class', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Apex Unit Test Class`);
    const expectedText = [
      '@isTest',
      'private class ApexUnitTestClass1 {',
      '',
      '    @isTest',
      '    static void myUnitTest() {',
      '        // TO DO: implement unit test',
      '    }',
      '}'
    ].join('\n');
    const workbench = utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexUnitTestClass1.cls');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.contain(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
