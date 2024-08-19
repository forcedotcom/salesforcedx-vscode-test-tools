/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { WebElement } from 'vscode-extension-tester';
import { executeQuickPick } from './commandPrompt.ts';
import { Duration, findElementByText } from './miscellaneous.ts';
import { expect } from 'chai';

export async function openOrgBrowser(wait: Duration = Duration.seconds(1)): Promise<void> {
  await executeQuickPick('View: Show Org Browser', wait);
}

export async function verifyOrgBrowserIsOpen(label: string): Promise<void> {
  const orgBrowserLabelEl = await findElementByText(
    'div',
    'aria-label',
    label
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  expect(orgBrowserLabelEl).to.be.ok;
}

export async function findTypeInOrgBrowser(type: string): Promise<WebElement> {
  return await findElementByText('div', 'aria-label', type);
}
