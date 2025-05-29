/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities/index';
import * as analyticsTemplate from '../testData/sampleAnalyticsTemplateData';
import { expect } from 'chai';
import { after, before } from 'vscode-extension-tester';

describe('Sample Analytics Template', () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'SampleAnalyticsTemplate'
  };

  before('Set up the testing environment', async () => {
    utilities.log(`${testReqConfig.testSuiteSuffixName} - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName;
    await utilities.dismissAllNotifications();
  });

  // Sample Analytics Template
  it('Create a Sample Analytics Template', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create a Sample Analytics Template`);
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Sample Analytics Template".
    const workbench = utilities.getWorkbench();
    await utilities.clearOutputView();
    const inputBox = await utilities.executeQuickPick(
      'SFDX: Create Sample Analytics Template',
      utilities.Duration.seconds(1)
    );

    // Set the name of the new page to sat1
    await inputBox.setText('sat1');
    await inputBox.confirm();
    await utilities.pause(utilities.Duration.seconds(1));

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      /SFDX: Create Sample Analytics Template successfully ran/,
      utilities.Duration.TEN_MINUTES
    );
    expect(successNotificationWasFound).to.equal(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Sample Analytics Template',
      10
    );
    expect(outputPanelText).to.not.be.undefined;

    // Check for expected items in the Explorer view.

    // Check for the presence of the corresponding files
    const treeViewItems = await utilities.getVisibleItemsFromSidebar(workbench, projectName);
    expect(treeViewItems.includes('dashboards')).to.equal(true);
    expect(treeViewItems.includes('app-to-template-rules.json')).to.equal(true);
    expect(treeViewItems.includes('folder.json')).to.equal(true);
    expect(treeViewItems.includes('releaseNotes.html')).to.equal(true);
    expect(treeViewItems.includes('template-info.json')).to.equal(true);
    expect(treeViewItems.includes('template-to-app-rules.json')).to.equal(true);
    expect(treeViewItems.includes('ui.json')).to.equal(true);
    expect(treeViewItems.includes('variables.json')).to.equal(true);
  });

  it('Verify the contents of the Sample Analytics Template', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify the contents of the Sample Analytics Template`);
    // Verify the default code for a Sample Analytics Template.
    const workbench = utilities.getWorkbench();
    let textEditor = await utilities.getTextEditor(workbench, 'app-to-template-rules.json');
    let textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.appToTemplateRules);

    textEditor = await utilities.getTextEditor(workbench, 'folder.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.folder);

    textEditor = await utilities.getTextEditor(workbench, 'releaseNotes.html');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.releaseNotes);

    textEditor = await utilities.getTextEditor(workbench, 'template-info.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.templateInfo);

    textEditor = await utilities.getTextEditor(workbench, 'template-to-app-rules.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.templateToAppRules);

    textEditor = await utilities.getTextEditor(workbench, 'ui.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.ui);

    textEditor = await utilities.getTextEditor(workbench, 'variables.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).to.equal(analyticsTemplate.variables);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
