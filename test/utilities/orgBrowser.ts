/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SideBarView, WebElement } from 'vscode-extension-tester';
import { executeQuickPick } from './commandPrompt';
import { Duration, findElementByText } from './miscellaneous';
import { expect } from 'chai';

export async function openOrgBrowser(wait: Duration = Duration.seconds(1)): Promise<void> {
  await executeQuickPick('View: Show Org Browser', wait);
}

export async function verifyOrgBrowserIsOpen(): Promise<void> {
  const orgBrowser = new SideBarView();
  const titlePart = orgBrowser.getTitlePart();
  const title = await titlePart.getTitle();
  expect(title).to.equal('ORG BROWSER: METADATA');
}

export async function findTypeInOrgBrowser(type: string): Promise<WebElement> {
  return await findElementByText('div', 'aria-label', type);
}
