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
  prefix?: string
): Promise<void> => {
  utilities.log(`runAndValidateCommand()`);
  await utilities.executeQuickPick(`SFDX: ${operation} This Source ${fromTo} Org`, utilities.Duration.seconds(5));

  await validateCommand(operation, fromTo, operationType, metadataType, [fullName], prefix);
};

export const validateCommand = async (
  operation: string,
  fromTo: string,
  operationType: string, // Text to identify operation operationType (if it has source tracking enabled, disabled or if it was a deploy on save),
  metadataType: string,
  fullNames: string[],
  prefix: string = ''
): Promise<void> => {
  utilities.log(`validateCommand()`);
  const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
    new RegExp(`SFDX: ${operation} This Source ${fromTo} Org successfully ran`),
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
  const pathSeparator = process.platform === 'win32' ? '\\' : '/';
  const longestFullName = fullNames.reduce((a, b) => (a.length > b.length ? a : b), '');

  if (metadataType === 'ApexClass') {
    expectedTexts = [
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved'),
      `ended SFDX: ${operation} This Source ${fromTo} Org`
    ];
    for (let x = 0; x < fullNames.length; x++) {
      const spacer = calculateSpacer(longestFullName, fullNames[x]);
      expectedTexts.push(
        `${prefix}${fullNames[x]}${spacer}${metadataType}  force-app${pathSeparator}main${pathSeparator}default${pathSeparator}classes${pathSeparator}${fullNames[x]}.cls`,
        `${prefix}${fullNames[x]}${spacer}${metadataType}  force-app${pathSeparator}main${pathSeparator}default${pathSeparator}classes${pathSeparator}${fullNames[x]}.cls-meta.xml`
      );
    }
  } else if (metadataType === 'ExternalServiceRegistration') {
    expectedTexts = [
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved'),
      `ended SFDX: ${operation} This Source ${fromTo} Org`
    ];
    for (let x = 0; x < fullNames.length; x++) {
      const spacer = calculateSpacer(longestFullName, fullNames[x]);
      expectedTexts.push(
        `${prefix}${fullNames[x]}${spacer}${metadataType}  force-app${pathSeparator}main${pathSeparator}default${pathSeparator}externalServiceRegistrations${pathSeparator}${fullNames[x]}.externalServiceRegistration-meta.xml`
      );
    }
  } else {
    expectedTexts = [];
  }

  expect(outputPanelText).to.not.be.undefined;
  await utilities.verifyOutputPanelText(outputPanelText!, expectedTexts);
};

/**
 * Determines the number of spaces needed to align the output text
 * @param longestFullName - The longest full name in the list of full names
 * @param currentFileName - The full name of the current file that is used to calculate the size of the spacer
 * @returns - A string of spaces to align the output text
 */
export const calculateSpacer = (longestFullName: string, currentFileName: string): string => {
  let numberOfSpaces = 2;
  if (longestFullName.length < 'FULL_NAME'.length) {
    numberOfSpaces += ('FULL_NAME'.length - currentFileName.length);
  } else {
    numberOfSpaces += (longestFullName.length - currentFileName.length);
  }
  return ' '.repeat(numberOfSpaces);
};
