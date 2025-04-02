/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { Duration, pause } from '../../src/core';
import { notificationIsPresentWithTimeout, dismissNotification, notificationIsAbsentWithTimeout, acceptNotification } from '../../src/ui-interaction';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showNotification(message: string) {
  // await getBrowser().executeWorkbench(async (vscode, message) => {
  //   vscode.window.showInformationMessage(`${message}`);
  // }, message);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showNotificationWithActions(message: string, ...actions: string[]) {
  // await browser
  //   .executeWorkbench(
  //     async (vscode, message, ...actions) => {
  //       vscode.window.showInformationMessage(`${message}`, ...actions);
  //     },
  //     message,
  //     ...actions
  //   )
  //   .then(() => {});
}

describe('Notifications', async () => {
  // Show a notification
  it('should show an info notification', async () => {
    await showNotification('Modify the file and retrieve again');
    const isPresent = await notificationIsPresentWithTimeout(
      /Modify the file and retrieve again/,
      Duration.seconds(2)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(isPresent).to.equal(true);
    await dismissNotification(/Modify the file and retrieve again/);
    await pause(Duration.seconds(1));
    const isNotPresent = await notificationIsAbsentWithTimeout(
      /Modify the file and retrieve again/,
      Duration.seconds(1)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(isNotPresent).to.equal(true);
    await pause(Duration.seconds(2));
  });
  it('should show a notification with two actions', async () => {
    await showNotificationWithActions('Choose an action:', 'A', 'B');
    const isPresent = await notificationIsPresentWithTimeout(
      /Choose an action:/,
      Duration.seconds(1)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(isPresent).to.equal(true);
    await pause(Duration.seconds(1));

    await acceptNotification('Choose an action:', 'A', Duration.seconds(1));

    const isNotPresent = await notificationIsAbsentWithTimeout(
      /Choose an action:/,
      Duration.seconds(5)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(isNotPresent).to.equal(true);
  });
});
