/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import * as utilities from './index';

export const runAndValidateCommand = async (
  operation: string,
  fromTo: string,
  operationType: string,
  metadataType: string,
  fullName: string,
  prefix?: string,
  decomposed?: boolean
): Promise<void> => {
  utilities.log(`runAndValidateCommand()`);
  await utilities.executeQuickPick(`SFDX: ${operation} This Source ${fromTo} Org`, utilities.Duration.seconds(5));

  await validateCommand(operation, fromTo, operationType, metadataType, fullName, prefix, decomposed);
};

export const validateCommand = async (
  operation: string,
  fromTo: string,
  operationType: string, // Text to identify operation operationType (if it has source tracking enabled, disabled or if it was a deploy on save),
  metadataType: string,
  fullName: string,
  prefix: string = '',
  decomposed: boolean = false
): Promise<void> => {
  utilities.log(`validateCommand()`);
  const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
    `SFDX: ${operation} This Source ${fromTo} Org successfully ran`,
    utilities.Duration.TEN_MINUTES
  );
  expect(successNotificationWasFound).to.equal(true);

  // Verify Output tab
  const outputPanelText = await utilities.attemptToFindOutputPanelText(
    'Salesforce CLI',
    `Starting SFDX: ${operation} This Source ${fromTo}`,
    10
  );
  utilities.log(`${operation} time ${operationType}: ` + (await utilities.getOperationTime(outputPanelText!)));
  let expectedTexts: string[];
  if (metadataType === 'ApexClass') {
    expectedTexts = [
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved'),
      `${prefix}${fullName}    ${metadataType}  force-app/main/default/classes/${fullName}.cls`,
      `${prefix}${fullName}    ${metadataType}  force-app/main/default/classes/${fullName}.cls-meta.xml`,
      `ended SFDX: ${operation} This Source ${fromTo} Org`
    ];
  } else if (metadataType === 'ExternalServiceRegistration') {
    expectedTexts = [
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved'),
      `${prefix}${fullName}  ${metadataType}  force-app/main/default/externalServiceRegistrations/${fullName}.externalServiceRegistration-meta.xml`,
      `ended SFDX: ${operation} This Source ${fromTo} Org`
    ];
    if (decomposed) {
      expectedTexts.push(`${prefix}${fullName}  ${metadataType}  force-app/main/default/externalServiceRegistrations/${fullName}.yaml`);
    }
  } else {
    expectedTexts = [];
  }

  expect(outputPanelText).to.not.be.undefined;
  await utilities.verifyOutputPanelText(outputPanelText!, expectedTexts);
};
