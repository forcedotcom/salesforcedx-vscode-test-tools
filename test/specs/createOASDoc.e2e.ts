/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities/index';
import { expect } from 'chai';
import path from 'path';
import { InputBox, QuickOpenBox, SettingsEditor, ExtensionsViewSection, ActivityBar, after, ProblemsView, MarkerType } from 'vscode-extension-tester';

describe('Create OpenAPI v3 Specifications', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'CreateOASDoc'
  };

  step('Set up the testing environment', async () => {
    utilities.log(`CreateOASDoc - Set up the testing environment`);
    testSetup = await TestSetup.setUp(testReqConfig);

    // Set SF_LOG_LEVEL to 'debug' to get the logs in the 'llm_logs' folder when the OAS doc is generated
    await utilities.inWorkspaceSettings();
    const settingsEditor = new SettingsEditor();
    const logLevelSetting = await settingsEditor.findSettingByID('salesforcedx-vscode-core.SF_LOG_LEVEL');
    await logLevelSetting?.setValue('debug');
    await utilities.reloadWindow();

    // Install A4D extension
    const extensionsView = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
    await utilities.pause(utilities.Duration.seconds(5));
    const extensionsList = (await extensionsView?.getContent().getSection('Installed')) as ExtensionsViewSection;
    const a4dExtension = await extensionsList?.findItem('Agentforce for Developers');
    await a4dExtension?.install();

    // Create the Apex class which the decomposed OAS doc will be generated from
    const caseManagerText = [
      `@RestResource(urlMapping='/apex-rest-examples/v1/Cases/*')`,
      `global with sharing class CaseManager {`,
      `\t@HttpPost`,
      `\tglobal static ID createCase(String subject, String status,`,
      `\t\tString origin, String priority) {`,
      `\t\tCase thisCase = new Case(`,
      `\t\t\tSubject=subject,`,
      `\t\t\tStatus=status,`,
      `\t\t\tOrigin=origin,`,
      `\t\t\tPriority=priority);`,
      `\t\tinsert thisCase;`,
      `\t\treturn thisCase.Id;`,
      `\t}`,
      `}`
    ].join('\n');

    try {
      await utilities.createApexClass('CaseManager', caseManagerText);
    } catch (error) {
      await utilities.createApexClass('CaseManager', caseManagerText);
    }

    // Create the Apex class which the composed OAS doc will be generated from
    const simpleAccountResourceText = [
      `@RestResource(urlMapping='/apex-rest-examples/v1/*')`,
      `global with sharing class SimpleAccountResource {`,
      `\t@HttpGet`,
      `\tglobal static Account getAccount() {`,
      `\t\tRestRequest req = RestContext.request;`,
      `\t\tRestResponse res = RestContext.response;`,
      `\t\tString accountId = req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);`,
      `\t\tAccount result = [SELECT Id, Name, Phone, Website FROM Account WHERE Id = :accountId];`,
      `\t\treturn result;`,
      `\t}`,
      `}`
    ].join('\n');

    try {
      await utilities.createApexClass('SimpleAccountResource', simpleAccountResourceText);
    } catch (error) {
      await utilities.createApexClass('SimpleAccountResource', simpleAccountResourceText);
    }

    // Create an ineligible Apex class (the default Apex class from the template is a good example)
    try {
      await utilities.createCommand('Apex Class', 'IneligibleApexClass', 'classes', 'cls');
    } catch (error) {
      await utilities.createCommand('Apex Class', 'IneligibleApexClass', 'classes', 'cls');
    }

    // Push source to org
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      utilities.Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Push Source to Default Org and Ignore Conflicts successfully ran".
    let successPushNotificationWasFound;
    try {
      successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
        'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
        utilities.Duration.TEN_MINUTES
      );
      expect(successPushNotificationWasFound).to.equal(true);
    } catch (error) {
      await utilities.getWorkbench().openNotificationsCenter();
      successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
        'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
        utilities.Duration.TEN_MINUTES
      );
      expect(successPushNotificationWasFound).to.equal(true);
    }
  });

  xstep('Listing all the cases that need to be tested', async () => {
    // 1. Generate OAS doc from an invalid Apex class ✅
    // 2. Generate OAS doc from a valid Apex class using command palette ✅
    // 3. Generate OAS doc from a valid Apex class using context menu in Editor View (Windows and Ubuntu only) ✅
    // 4. Generate OAS doc from a valid Apex class using context menu in Explorer View (Windows and Ubuntu only) ✅
    // 5. Manual merge ✅
    // 6. Overwrite ✅
    // 7. Check for warnings and errors in the Problems Tab ✅
    // 8. Revalidate the OAS doc in decomposed mode ✅
    // 9. Revalidate the OAS doc in composed mode ✅
    // 10. Turn on decomposed ESR in sfdx-project.json ✅
    // 11. Turn off decomposed ESR in sfdx-project.json ✅
    // 12. Deploy the OAS doc to the org ✅
    // 13. Disable A4D extension and ensure the command to generate OAS docs is not present ✅
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    expect(await statusBar.getAttribute('aria-label')).to.contain('Indexing complete');
  });

  step('Try to generate OAS doc from an ineligible Apex class', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Try to generate OAS doc from an ineligible Apex class`);
    await utilities.openFile(path.join(testSetup.projectFolderPath!, 'force-app', 'main', 'default', 'classes', 'IneligibleApexClass.cls'));
    await utilities.pause(utilities.Duration.seconds(5));
    await utilities.executeQuickPick('SFDX: Create OpenAPI Document from This Class (Beta)');
    const failureNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'Failed to create OpenAPI Document: The Apex Class IneligibleApexClass is not valid for OpenAPI document generation.',
      utilities.Duration.TEN_MINUTES
    );
    expect(failureNotificationWasFound).to.equal(true);
  });

  describe('Composed mode', async () => {
    step('Generate OAS doc from a valid Apex class using command palette - Composed mode, initial generation', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Generate OAS doc from a valid Apex class`);
      await utilities.openFile(path.join(testSetup.projectFolderPath!, 'force-app', 'main', 'default', 'classes', 'CaseManager.cls'));
      await utilities.pause(utilities.Duration.seconds(5));
      prompt = await utilities.executeQuickPick('SFDX: Create OpenAPI Document from This Class (Beta)');
      await prompt.confirm();

      const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
        'OpenAPI Document created for class: CaseManager.',
        utilities.Duration.TEN_MINUTES
      );
      expect(successNotificationWasFound).to.equal(true);

      // Verify the generated OAS doc is open in the editor
      const workbench = utilities.getWorkbench();
      const editorView = workbench.getEditorView();
      const activeTab = await editorView.getActiveTab();
      const title = await activeTab?.getTitle();
      expect(title).to.equal('CaseManager.externalServiceRegistration-meta.xml');
    });

    step('Check for warnings and errors in the Problems Tab', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Check for warnings and errors in the Problems Tab`);
      await utilities.executeQuickPick('Problems: Focus on Problems View');
      const problemsView = new ProblemsView();
      const problems = await problemsView.getAllVisibleMarkers(MarkerType.File);
      expect(problems.length).to.equal(1);
      expect(await problems[0].getLabel()).to.equal('CaseManager.externalServiceRegistration-meta.xml');
    });

    step('Fix the OAS doc to get rid of the problems in the Problems Tab', async () => {
      // NOTE: The "fix" is actually replacing the OAS doc with the ideal solution from the EMU repo
      utilities.log(`${testSetup.testSuiteSuffixName} - Fix the OAS doc to get rid of the problems in the Problems Tab`);
    });

    step('Revalidate the OAS doc', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Revalidate the OAS doc`);
    });

    step('Deploy the composed ESR to the org', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Deploy the composed ESR to the org`);
    });

    step('Generate OAS doc from a valid Apex class using command palette - Composed mode, manual merge', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Generate OAS doc from a valid Apex class`);
    });
  });

  describe('Decomposed mode', async () => {
    xstep('Add "decomposeExternalServiceRegistrationBeta" setting to sfdx-project.json', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Add "decomposeExternalServiceRegistrationBeta" setting to sfdx-project.json`);
      const workbench = utilities.getWorkbench();
      await utilities.openFile(path.join(testSetup.projectFolderPath!, 'sfdx-project.json'));
      const textEditor = await utilities.getTextEditor(workbench, 'sfdx-project.json');
    });

    step('Generate OAS doc from a valid Apex class using command palette - Decomposed mode, initial generation', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Generate OAS doc from a valid Apex class`);
    });

    step('Check for warnings and errors in the Problems Tab', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Check for warnings and errors in the Problems Tab`);
    });

    step('Fix the OAS doc to get rid of the problems in the Problems Tab', async () => {
      // NOTE: The "fix" is actually replacing the OAS doc with the ideal solution from the EMU repo
      utilities.log(`${testSetup.testSuiteSuffixName} - Fix the OAS doc to get rid of the problems in the Problems Tab`);
    });

    step('Revalidate the OAS doc', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Revalidate the OAS doc`);
    });

    step('Deploy the decomposed ESR to the org', async () => {
      utilities.log(`${testSetup.testSuiteSuffixName} - Deploy the decomposed ESR to the org`);
    });

    step('Generate OAS doc from a valid Apex class using context menu in Editor View - Decomposed mode, overwrite', async () => {
      // NOTE: Windows and Ubuntu only
      utilities.log(`${testSetup.testSuiteSuffixName} - Generate OAS doc from a valid Apex class`);
    });

    step('Generate OAS doc from a valid Apex class using context menu in Explorer View - Decomposed mode, manual merge', async () => {
      // NOTE: Windows and Ubuntu only
      utilities.log(`${testSetup.testSuiteSuffixName} - Generate OAS doc from a valid Apex class`);
    });
  });

  step('Disable A4D extension and ensure the commands to generate and validate OAS docs is not present', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Disable A4D extension and ensure the commands to generate and validate OAS docs is not present`);
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(`CreateOASDoc - Tear down and clean up the testing environment`);
    await testSetup?.tearDown();
  });
});
