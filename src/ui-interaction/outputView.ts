/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Duration, log, pause } from '../core/miscellaneous';
import { dismissAllNotifications } from './notifications';
import { executeQuickPick } from './commandPrompt';
import { BottomBarPanel, By, Key, OutputView } from 'vscode-extension-tester';
import { expect } from 'chai';
import { retryOperation } from '../retryUtils';

export async function selectOutputChannel(name: string): Promise<OutputView> {
  // Wait for all notifications to go away.  If there is a notification that is overlapping and hiding the Output channel's
  // dropdown menu, calling select.click() doesn't work, so dismiss all notifications first before clicking the dropdown
  // menu and opening it.
  await dismissAllNotifications();

  // Find the given channel in the Output view
  const outputView = await new BottomBarPanel().openOutputView();
  await pause(Duration.seconds(1));
  if (!!name) {
    await outputView.selectChannel(name);
  }
  return outputView;
}

export async function getOutputViewText(outputChannelName = ''): Promise<string> {
  // Set the output channel, but only if the value is passed in.
  const outputView = await selectOutputChannel(outputChannelName);

  // Set focus to the contents in the Output panel.
  await executeQuickPick('Output: Focus on Output View', Duration.seconds(2));

  try {
    return await outputView.getText();
  } catch (error) {
    // Fallback when outputView.getText() fails
    log(`outputView.getText() failed, trying fallback selector: ${(error as Error).message}`);

    const clipboard = (await import('clipboardy')).default;

    let originalClipboard = '';
    try {
      originalClipboard = clipboard.readSync();
    } catch (clipboardError) {
      // workaround issue when clipboard is empty
    }

    try {
      // Try to find the textarea using the fallback selector
      const textarea = await outputView.findElement(
        By.css('.inputarea.monaco-mouse-cursor-text, .inputarea textarea, .monaco-editor textarea')
      );

      // Select all text and copy to clipboard
      await textarea.sendKeys(Key.chord(process.platform === 'darwin' ? Key.META : Key.CONTROL, 'a'));
      await textarea.sendKeys(Key.chord(process.platform === 'darwin' ? Key.META : Key.CONTROL, 'c'));

      const text = clipboard.readSync();

      // Restore original clipboard content
      if (originalClipboard.length > 0) {
        clipboard.writeSync(originalClipboard);
      }

      return text;
    } catch (fallbackError) {
      log(`Fallback getText also failed: ${(fallbackError as Error).message}`);
      // If fallback also fails, rethrow the original error
      throw error;
    }
  }
}

/**
 * Verifies that the output panel contains all expected text snippets.
 *
 * @param {string} outputPanelText - The output panel text as a string that needs to be verified.
 * @param {string[]} expectedTexts - An array of strings representing the expected text snippets that should be present in the output panel.
 *
 * @example
 * await verifyOutputPanelText(
 *   testResult,
 *   [
 *     '=== Test Summary',
 *     'Outcome              Passed',
 *     'Tests Ran            1',
 *     'Pass Rate            100%',
 *     'TEST NAME',
 *     'ExampleTest1  Pass',
 *     'Ended SFDX: Run Apex Tests'
 *   ]
 * );
 */
export async function verifyOutputPanelText(outputPanelText: string, expectedTexts: string[]): Promise<void> {
  log(`verifyOutputPanelText() - ${outputPanelText}`);
  for (const expectedText of expectedTexts) {
    log(`Expected text:\n ${expectedText}`);
    expect(outputPanelText).to.include(expectedText);
  }
}

// If found, this function returns the entire text that's in the Output panel.
export async function attemptToFindOutputPanelText(
  outputChannelName: string,
  searchString: string,
  attempts = 10
): Promise<string> {
  log(`attemptToFindOutputPanelText in channel "${outputChannelName}: with string "${searchString}"`);
  return await retryOperation(
    async () => {
      const outputViewText = await getOutputViewText(outputChannelName);
      log(`outputViewText:\n ${outputViewText}`);
      if (outputViewText.includes(searchString)) {
        return outputViewText;
      }

      await pause(Duration.seconds(2));
      throw new Error(
        `Failed to find output panel text: ${searchString} in ${outputChannelName} on attempt ${attempts}`
      );
    },
    attempts,
    'Failed to find output panel text'
  );
}

export async function getOperationTime(outputText: string): Promise<string> {
  const tRegex = /((?<hours>\d+):(?<minutes>\d+):(?<seconds>\d+)(?<secondFraction>\.\d+))/g;
  let matches;
  const times: Date[] = [];
  while ((matches = tRegex.exec(outputText)) !== null) {
    if (matches.groups) {
      const { hours, minutes, seconds, secondFraction } = matches.groups;
      const time = new Date(1970, 0, 1, Number(hours), Number(minutes), Number(seconds), Number(secondFraction) * 1000);
      times.push(time);
    }
  }
  if (times.length < 2) {
    return 'Insufficient timestamps found.';
  }
  const [startTime, endTime] = times;
  let diff = endTime.getTime() - startTime.getTime();

  const hours = Math.floor(diff / 3600000); // 1000 * 60 * 60
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000); // 1000 * 60
  diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  const milliseconds = diff % 1000;

  return `${formatTimeComponent(hours)}:${formatTimeComponent(minutes)}:${formatTimeComponent(seconds)}.${formatTimeComponent(milliseconds, 3)}`;
}

export async function clearOutputView(wait = Duration.seconds(1)) {
  if (process.platform === 'linux') {
    // In Linux, clear the output by clicking the "Clear Output" button in the Output Tab
    // Use retry logic with longer wait for Linux due to timing issues
    log('clearOutputView() - Linux: Attempting to find and click clear button with retries');
    await retryOperation(
      async () => {
        log('clearOutputView() - Linux: Looking for clear button...');
        const outputView = await new BottomBarPanel().openOutputView();

        // Wait a bit longer for UI to be ready on Linux
        await pause(Duration.seconds(2));

        const clearButton = await outputView.findElement(By.className('codicon-clear-all'));
        log('clearOutputView() - Linux: Clear button found, attempting to click');

        // Try multiple click methods for better Linux compatibility
        try {
          await outputView.getDriver().executeScript('arguments[0].click();', clearButton);
          log('clearOutputView() - Linux: Click via executeScript successful');
        } catch (scriptError) {
          log(`clearOutputView() - Linux: executeScript failed, trying direct click: ${scriptError}`);
          await clearButton.click();
          log('clearOutputView() - Linux: Direct click successful');
        }

        // Wait a moment to ensure the action completes
        await pause(Duration.seconds(1));

        // Verify the output was actually cleared by checking if there's minimal content
        const outputText = await outputView.getText();
        if (outputText.trim().length > 100) {
          log(`clearOutputView() - Linux: Output not cleared (${outputText.length} chars), retrying...`);
          throw new Error('Output view was not cleared successfully');
        }

        log('clearOutputView() - Linux: Output cleared successfully');
      },
      3,
      'Failed to clear output view on Linux after retries'
    );
  } else {
    // In Mac and Windows, clear the output by calling the "View: Clear Output" command in the command palette
    log('clearOutputView() - Mac/Windows: Using command palette to clear output');
    await executeQuickPick('View: Clear Output', wait);
  }
}

function formatTimeComponent(component: number, padLength = 2): string {
  return component.toString().padStart(padLength, '0');
}
