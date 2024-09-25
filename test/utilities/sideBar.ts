/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { By, DefaultTreeItem, Key, Locator, TreeItem, ViewItem, ViewSection, WebElement, Workbench } from 'vscode-extension-tester';
import { Duration, pause } from './miscellaneous';
import { fail } from 'assert';
import { expect } from 'chai';
import { executeQuickPick } from './commandPrompt';
import { getWorkbench } from './workbench';

export async function expandProjectInSideBar(
  workbench: Workbench,
  projectName: string
): Promise<ViewSection> {
  await executeQuickPick('View: Show Explorer');

  const sidebar = workbench.getSideBar();

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  expect(await sidebar.isDisplayed()).to.be.true;

  const treeViewSection = await sidebar.getContent().getSection(projectName);
  await treeViewSection.expand();
  return treeViewSection;
}

export async function getVisibleItemsFromSidebar(workbench: Workbench, projectName: string): Promise<string[]> {
  const treeViewSection = await expandProjectInSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const visibleItemsLabels = await Promise.all(
    visibleItems.map((item) => item.getLabel().then((label) => label))
  );

  return visibleItemsLabels;
}

export async function getFilteredVisibleTreeViewItems(
  workbench: Workbench,
  projectName: string,
  searchString: string
): Promise<DefaultTreeItem[]> {
  const treeViewSection = await expandProjectInSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const filteredItems = await visibleItems.reduce(
    async (previousPromise: Promise<DefaultTreeItem[]>, currentItem: DefaultTreeItem) => {
      const results = await previousPromise;
      const label = await currentItem.getLabel();
      if (label.startsWith(searchString)) {
        results.push(currentItem);
      }

      return results;
    },
    Promise.resolve([])
  );

  return filteredItems;
}

// It's a tree, but it's also a list.  Everything in the view is actually flat
// and returned from the call to visibleItems.reduce().
export async function getFilteredVisibleTreeViewItemLabels(
  workbench: Workbench,
  projectName: string,
  searchString: string
): Promise<string[]> {
  const treeViewSection = await expandProjectInSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const filteredItems = (await visibleItems.reduce(
    async (previousPromise: Promise<string[]>, currentItem: ViewItem) => {
      const results = await previousPromise;
      const label = await (currentItem as TreeItem).getLabel();
      if (label.startsWith(searchString)) {
        results.push(label);
      }

      return results;
    },
    Promise.resolve([])
  )) as string[];

  return filteredItems;
}

export async function getVisibleChild(
  defaultTreeItem: DefaultTreeItem,
  name: string
): Promise<TreeItem | undefined> {
  const children = await getVisibleChildren(defaultTreeItem);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const label = await child.getLabel();
    if (label === name) {
      return child;
    }
  }

  return undefined;
}

// Replicate DefaultTreeItem.getChildren()
// getVisibleChildren() is very much like DefaultTreeItem.getChildren(), except it calls
// getVisibleItems().
export async function getVisibleChildren(defaultTreeItem: DefaultTreeItem): Promise<TreeItem[]> {
  console.log(`${defaultTreeItem}`)
  // const rows = await getVisibleItems(
  //   defaultTreeItem,
  //   defaultTreeItem.locatorMap.DefaultTreeSection.itemRow as string
  // );

  // const items = await Promise.all(
  //   rows.map(async (row) =>
  //     new DefaultTreeItem(
  //       defaultTreeItem.locatorMap,
  //       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  //       row as any,
  //       defaultTreeItem.viewPart
  //     ).wait()
  //   )
  // );

  return [];
}

// Replicate TreeItem.getChildItems()
// This function returns a list of all visible items within the tree, and not just the children of a node.
export async function getVisibleItems(
  treeItem: TreeItem,
  locator: Locator
): Promise<WebElement[]> {
  await treeItem.expand();
  const rows = await treeItem.findElement(By.xpath('..')).findElements(locator);

  return [...rows.values()];
}

export async function retrieveExpectedNumTestsFromSidebar(
  expectedNumTests: number,
  testsSection: ViewSection,
  actionLabel: string
): Promise<TreeItem[]> {
  let testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
  await getWorkbench().sendKeys(Key.ESCAPE);

  // If the tests did not show up, click the refresh button on the top right corner of the Test sidebar
  for (let x = 0; x < 3; x++) {
    if (testsItems.length === 1) {
      await testsSection.click();
      const refreshAction = await testsSection.getAction(actionLabel);
      if (!refreshAction) {
        fail('Could not find debug tests action button');
      }
      await refreshAction.click();
      await pause(Duration.seconds(10));
      testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
    } else if (testsItems.length === expectedNumTests) {
      break;
    }
  }

  return testsItems;
}

export async function getTestsSection(workbench: Workbench, type: string) {
  const sidebar = workbench.getSideBar();
  const sidebarView = sidebar.getContent();
  const testsSection = await sidebarView.getSection(type);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  expect(testsSection).to.be.ok;
  return testsSection;
}
