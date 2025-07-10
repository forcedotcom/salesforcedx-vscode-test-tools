/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ModalDialog } from 'vscode-extension-tester';
import { retryOperation } from '../retryUtils';
import { log, pause, Duration } from '../core';

/**
 * Clicks a button on a modal dialog with the specified button text.
 *
 * @param buttonText - The text of the button to be clicked on the modal dialog.
 * @returns A promise that resolves when the button click action is completed.
 * @throws Will throw an error if the modal dialog is undefined.
 */
export const clickButtonOnModalDialog = async (buttonText: string, failOnError = true): Promise<void> => {
  await pause(Duration.seconds(2));

  const pushButton = async () => {
    log(`clickButtonOnModalDialog() - Pushing button with text: "${buttonText}"`);
    const modalDialog = new ModalDialog();
    await pause(Duration.seconds(2)); // wait for the modal dialog to be visible
    await modalDialog.pushButton(buttonText);
  };

  if (failOnError) {
    await retryOperation(pushButton, 3, 'clickButtonOnModalDialog() - Error pushing button');
  } else {
    try {
      await pushButton();
    } catch (error) {
      log(`clickButtonOnModalDialog() - Error pushing button ${buttonText}: ${error}`);
    }
  }
};
