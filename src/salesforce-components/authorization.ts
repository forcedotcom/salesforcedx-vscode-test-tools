/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import fs from 'fs';
import { EnvironmentSettings as Env } from '../../src/environmentSettings';
import { TestSetup } from '../../src/testSetup';
import { log, pause, Duration, transformedUserName } from '../core/miscellaneous';
import { getStatusBarItemWhichIncludes } from '../ui-interaction/statusBar';
import {
  orgDisplay,
  orgList,
  orgLoginSfdxUrl,
  runCliCommand,
  scratchOrgCreate
} from '../system-operations/cliCommands';
import { attemptToFindOutputPanelText, executeQuickPick } from '../ui-interaction';
import { verifyNotificationWithRetry, retryOperation } from '../retryUtils';

/**
 * Sets up a scratch org for testing
 * @param testSetup - The test setup configuration
 * @param scratchOrgEdition - The edition of the scratch org to create
 */
export async function setUpScratchOrg(testSetup: TestSetup) {
  await authorizeDevHub(testSetup);
  return await createDefaultScratchOrgViaCli(testSetup);
}

/**
 * Authorizes a DevHub for use in tests
 * @param testSetup - The test setup configuration
 * @throws Error if DevHub alias or username are not set
 */
export async function authorizeDevHub(testSetup: TestSetup): Promise<void> {
  log('');
  log(`${testSetup.testSuiteSuffixName} - Starting authorizeDevHub()...`);

  // Only need to check this once.
  if (!testSetup.aliasAndUserNameWereVerified) {
    await verifyAliasAndUserName();
    testSetup.aliasAndUserNameWereVerified = true;
  }

  // This is essentially the "SFDX: Authorize a Dev Hub" command, but using the CLI and an auth file instead of the UI.
  const authFilePath = path.join(testSetup.projectFolderPath!, 'authFile.json');
  log(`${testSetup.testSuiteSuffixName} - calling sf org:display...`);
  const sfOrgDisplayResult = await orgDisplay(Env.getInstance().devHubUserName);

  // Now write the file.
  fs.writeFileSync(authFilePath, sfOrgDisplayResult.stdout);
  log(`${testSetup.testSuiteSuffixName} - finished writing the file...`);

  // Call org:login:sfdx-url and read in the JSON that was just created.
  log(`${testSetup.testSuiteSuffixName} - calling sf org:login:sfdx-url...`);
  await orgLoginSfdxUrl(authFilePath);

  log(`${testSetup.testSuiteSuffixName} - ...finished authorizeDevHub()`);
  log('');
}

/**
 * Verifies that the alias and user name are set and match an org in the org list
 * @throws Error if DevHub alias or username are not set or can't be found in org list
 */
export async function verifyAliasAndUserName() {
  const environmentSettings = Env.getInstance();

  const devHubAliasName = environmentSettings.devHubAliasName;
  if (!devHubAliasName) {
    throw new Error('Error: devHubAliasName was not set.');
  }

  const devHubUserName = environmentSettings.devHubUserName;
  if (!devHubUserName) {
    throw new Error('Error: devHubUserName was not set.');
  }

  const execResult = await orgList();
  const sfOrgListResult = JSON.parse(execResult.stdout).result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonScratchOrgs = sfOrgListResult.nonScratchOrgs as any[];

  for (let i = 0; i < nonScratchOrgs.length; i++) {
    const nonScratchOrg = nonScratchOrgs[i];
    if (nonScratchOrg.alias === devHubAliasName && nonScratchOrg.username === devHubUserName) {
      return;
    }
  }

  throw new Error(
    `Error: matching devHub alias '${devHubAliasName}' and devHub user name '${devHubUserName}' was not found.\nPlease consult README.md and make sure DEV_HUB_ALIAS_NAME and DEV_HUB_USER_NAME are set correctly.`
  );
}

const buildAlias = () => {
  const currentDate = new Date();
  const ticks = currentDate.getTime();
  const day = ('0' + currentDate.getDate()).slice(-2);
  const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
  const year = currentDate.getFullYear();
  const currentOsUserName = transformedUserName();
  return `TempScratchOrg_${year}_${month}_${day}_${currentOsUserName}_${ticks}_OrgAuth`;
};

export const createDefaultScratchOrgViaCli = async (testSetup: TestSetup): Promise<TestSetup> => {
  const scratchOrgAliasName = buildAlias();
  testSetup.scratchOrgAliasName = scratchOrgAliasName;
  const orgCreateResult = await scratchOrgCreate('developer', 'NONE', testSetup.scratchOrgAliasName, 1);
  if (orgCreateResult.exitCode > 0) {
    throw new Error(
      `Error: creating scratch org failed with exit code ${orgCreateResult.exitCode}\n stderr ${orgCreateResult.stderr}`
    );
  }
  testSetup.scratchOrgId = JSON.parse(orgCreateResult.stdout).result.id;
  return testSetup;
};

/**
 * Creates a default scratch org for testing
 * @param testSetup - The test setup configuration
 * @param edition - The edition of the scratch org to create (defaults to 'developer')
 * @throws Error if scratch org creation fails
 * @private
 */
export async function createDefaultScratchOrg(): Promise<string> {
  log('Creating a default scratch org...');

  return await retryOperation(async () => {
    const prompt = await executeQuickPick(
      'SFDX: Create a Default Scratch Org...',
      Duration.seconds(1)
    );

    // Select a project scratch definition file (config/project-scratch-def.json)
    await prompt.confirm();

    // Enter an org alias - yyyy-mm-dd-username-ticks
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    const day = ('0' + currentDate.getDate()).slice(-2);
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const year = currentDate.getFullYear();
    const currentOsUserName = transformedUserName();
    const scratchOrgAliasName = `TempScratchOrg_${year}_${month}_${day}_${currentOsUserName}_${ticks}_OrgAuth`;

    await prompt.setText(scratchOrgAliasName);
    await pause(Duration.seconds(1));

    // Press Enter/Return.
    await prompt.confirm();

    // Enter the number of days.
    await prompt.setText('1');
    await pause(Duration.seconds(1));

    // Press Enter/Return.
    await prompt.confirm();

    const successNotificationWasFound = await verifyNotificationWithRetry(
      /SFDX: Create a Default Scratch Org\.\.\. successfully ran/,
    );

    if (successNotificationWasFound !== true) {
      const failureNotificationWasFound = await verifyNotificationWithRetry(
        /SFDX: Create a Default Scratch Org\.\.\. failed to run/,
      );

      if (failureNotificationWasFound === true) {
        if (
          await attemptToFindOutputPanelText(
            'Salesforce CLI',
            'organization has reached its daily scratch org signup limit',
            5
          )
        ) {
          // This is a known issue...
          log('Warning - creating the scratch org failed, but the failure was due to the daily signup limit');
        } else if (await attemptToFindOutputPanelText('Salesforce CLI', 'is enabled as a Dev Hub', 5)) {
          // This is a known issue...
          log('Warning - Make sure that the org is enabled as a Dev Hub.');
          log(
            'Warning - To enable it, open the org in your browser, navigate to the Dev Hub page in Setup, and click Enable.'
          );
          log(
            'Warning - If you still see this error after enabling the Dev Hub feature, then re-authenticate to the org.'
          );
        } else {
          // The failure notification is showing, but it's not due to maxing out the daily limit.  What to do...?
          log('Warning - creating the scratch org failed... not sure why...');
        }
      } else {
        log(
          'Warning - creating the scratch org failed... neither the success notification or the failure notification was found.'
        );
      }

      // Throw error to trigger retry if success notification was not found
      throw new Error('Scratch org creation failed - success notification not found');
    }

    // Look for the org's alias name in the list of status bar items.
    const scratchOrgStatusBarItem = await getStatusBarItemWhichIncludes(scratchOrgAliasName);
    if (!scratchOrgStatusBarItem) {
      throw new Error('Scratch org status bar item not found');
    }

    return scratchOrgAliasName;
  }, 3, 'Failed to create default scratch org');
}

/**
 * Deletes scratch org information from the DevHub
 * @param testSetup - The test setup configuration
 * @throws Error if deletion fails
 */
export async function deleteScratchOrgInfo(testSetup: TestSetup): Promise<void> {
  if (testSetup.scratchOrgId) {
    const sfDataDeleteRecord = await runCliCommand(
      'data:delete:record',
      '--sobject',
      'ScratchOrgInfo',
      '--where',
      `ScratchOrg=${testSetup.scratchOrgId.slice(0, -3)}`,
      '--target-org',
      Env.getInstance().devHubAliasName
    );
    if (sfDataDeleteRecord.exitCode > 0) {
      const message = `data delete record failed with exit code ${sfDataDeleteRecord.exitCode}\n stderr ${sfDataDeleteRecord.stderr}`;
      log(message);
      throw new Error(message);
    }
  }
}
