/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { By, Setting, SettingsEditor, WebElement } from 'vscode-extension-tester';
import { executeQuickPick } from '../ui-interaction/commandPrompt';
import { Duration, findElementByText, log, pause } from '../core/miscellaneous';
import { getBrowser } from '../ui-interaction/workbench';

/**
 * Finds a setting in VSCode settings UI and checks its value
 * @param id - The ID of the setting to find
 * @returns Object containing the setting and its current value
 * @throws Error if the setting cannot be found
 * @private
 */
async function findAndCheckSetting(id: string): Promise<{ checkButton: Setting; checkButtonValue: string | null }> {
  log(`enter findAndCheckSetting for id: ${id}`);
  await executeQuickPick('Preferences: Clear Settings Search Results', Duration.seconds(2));
  try {
  const input = await getBrowser().findElement(By.css('div.suggest-input-container'));
  await input.click();
  const textArea = await getBrowser().findElement(By.css('textarea.inputarea.monaco-mouse-cursor-text'));
  await textArea.sendKeys(id);
  await pause(Duration.seconds(2));
  let checkButton: Setting | null = null;
  let checkButtonValue: string | null = null;

  await getBrowser().wait(
    async () => {
      checkButton = (await findElementByText('div', 'aria-label', id)) as Setting;
      if (checkButton) {
        checkButtonValue = await checkButton.getAttribute('aria-checked');
        log(`found setting checkbox with value "${checkButtonValue}"`);
        return true;
      }
      return false;
    },
    5000,
    `Could not find setting with name: ${id}`
  );

  if (!checkButton) {
    throw new Error(`Could not find setting with name: ${id}`);
  }

    log(`findAndCheckSetting result for ${id} found ${!!checkButton} value: ${checkButtonValue}`);
    return { checkButton, checkButtonValue };
  } catch (error) {
    log(`error in findAndCheckSetting for ${id}: ${error}`);
    log(`trying to find setting by id: ${id}`);
    const settingsEditor = new SettingsEditor();
    const setting = await settingsEditor.findSettingByID(id);
    log(`found setting by id: ${id} ${setting}`);
    return { checkButton: setting, checkButtonValue: String(await setting.getValue()) };
  }
}

/**
 * Opens the workspace settings editor
 */
export async function inWorkspaceSettings(): Promise<void> {
  await executeQuickPick('Preferences: Open Workspace Settings', Duration.seconds(5));
}

/**
 * Opens the user settings editor
 */
export async function inUserSettings(): Promise<void> {
  await executeQuickPick('Preferences: Open User Settings', Duration.seconds(5));
}

/**
 * Toggles a boolean setting to the specified state
 * @param id - The ID of the setting to toggle
 * @param finalState - The desired final state (true for enabled, false for disabled)
 * @param settingsType - Whether to modify user or workspace settings
 * @returns The final state of the setting after toggling
 * @private
 */
async function toggleBooleanSetting(
  id: string,
  finalState: boolean | undefined,
  settingsType: 'user' | 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  await settingsFunction();
  let result = await findAndCheckSetting(id);

  if (finalState !== undefined) {
    if ((finalState && result.checkButtonValue === 'true') || (!finalState && result.checkButtonValue === 'false')) {
      return true;
    }
  }
  await result.checkButton.click();
  result = await findAndCheckSetting(id);
  return result.checkButtonValue === 'true';
}

/**
 * Enables a boolean setting
 * @param id - The ID of the setting to enable
 * @param settingsType - Whether to modify user or workspace settings, defaults to workspace
 * @returns True if the setting was successfully enabled
 */
export async function enableBooleanSetting(
  id: string,
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  log(`enableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, true, settingsType);
}

/**
 * Disables a boolean setting
 * @param id - The ID of the setting to disable
 * @param settingsType - Whether to modify user or workspace settings, defaults to workspace
 * @returns True if the setting was successfully disabled
 */
export async function disableBooleanSetting(
  id: string,
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  log(`disableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, false, settingsType);
}

/**
 * Checks if a boolean setting is enabled
 * @param id - The ID of the setting to check
 * @param settingsType - Whether to check user or workspace settings, defaults to workspace
 * @returns True if the setting is enabled, false otherwise
 */
export async function isBooleanSettingEnabled(
  id: string,
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  await settingsFunction();
  const { checkButtonValue } = await findAndCheckSetting(id);
  return checkButtonValue === 'true';
}

/**
 * Sets the value of a specified setting in VSCode.
 * @param id - The unique identifier of the setting to be updated.
 * @param value - The new value to set for the specified setting.
 * @param isWorkspace - True if the setting is a workspace setting; false if it's a user setting.
 * @returns A promise that resolves when the setting value has been updated.
 */
export const setSettingValue = async (id: string, value: string | boolean, isWorkspace: boolean): Promise<void> => {
  await (isWorkspace ? inWorkspaceSettings() : inUserSettings());
  try {
    // Try the original implementation using RedHat page objects
    const settingsEditor = new SettingsEditor();
    const logLevelSetting = await settingsEditor.findSettingByID(id);
    await logLevelSetting?.setValue(value);
  } catch (error) {
    // Fallback for VS Code 1.90.0+ where .native-edit-context selector doesn't exist
    log(`Primary findSettingByID failed, using fallback implementation for VS Code 1.90.0+: ${error}`);

    try {
      const browser = getBrowser();

      // Alternative selectors for the search input in newer VS Code versions
      const searchSelectors = [
        '.inputarea.monaco-mouse-cursor-text',
        'input[placeholder*="Search settings"]',
      ];

      let searchInput: WebElement | undefined;
      for (const selector of searchSelectors) {
        try {
          searchInput = await browser.findElement(By.css(selector));
          break;
        } catch {
          // Try next selector
        }
      }

      if (!searchInput) {
        throw new Error('Could not find settings search input with any known selector');
      }

      // Clear and search for the setting
      await searchInput.clear();
      await searchInput.sendKeys(id);
      await pause(Duration.seconds(1));

      // Find the setting by its title (last part of the ID) using robust approach
      const title = id.split('.').pop();
      let settingElement: WebElement | undefined;

      // Wait for settings to load and stabilize
      await pause(Duration.seconds(1));

      // Try to find setting items using multiple selector approaches
      const itemSelectors = [
        '.setting-item',
        '.settings-row-inner-container',
        '.setting-list-item',
        '[data-key]'
      ];

      let items: WebElement[] = [];
      for (const selector of itemSelectors) {
        try {
          items = await browser.findElements(By.css(selector));
          if (items.length > 0) break;
        } catch {
          // Try next selector
        }
      }

      if (items.length === 0) {
        throw new Error('Could not find any setting items with known selectors');
      }

      // Search through items to find the matching setting
      for (const item of items) {
        try {
          // Try to find the setting label/title within the item
          const labelSelectors = [
            '.setting-item-label',
            '.setting-item-title',
            '.label-name',
            '.setting-key-label',
            '.monaco-label'
          ];

          let itemTitle = '';
          for (const labelSelector of labelSelectors) {
            try {
              const labelElement = await item.findElement(By.css(labelSelector));
              itemTitle = await labelElement.getText();
              if (itemTitle) break;
            } catch {
              // Try next selector
            }
          }

          // If no label found, try getting text content directly
          if (!itemTitle) {
            itemTitle = await item.getText();
          }

          // Normalize text comparison like SettingsEditor.js does
          const normalizedTitle = title?.toLowerCase().replace(/\s/g, '').trim() || '';
          const normalizedItemTitle = itemTitle.toLowerCase().replace(/\s/g, '').trim();

          if (normalizedItemTitle.includes(normalizedTitle) || normalizedTitle.includes(normalizedItemTitle)) {
            settingElement = item;
            break;
          }
        } catch (err) {
          // Continue to next item
        }
      }

      if (!settingElement) {
        throw new Error(`Could not find setting element for: ${title}`);
      }

      // Find the input/control within the setting element and set the value
      const parent = await settingElement.findElement(By.xpath('..'));
      const settingContainer = await parent.findElement(By.xpath('..'));

      if (typeof value === 'boolean') {
        const checkbox = await settingContainer.findElement(By.css('input[type="checkbox"]'));
        const isChecked = await checkbox.isSelected();
        if (isChecked !== value) {
          await checkbox.click();
        }
      } else {
        // Try to find and handle different input types
        let inputHandled = false;

        // First, try to find a select element (dropdown)
        try {
          const selectElement = await settingContainer.findElement(By.css('select'));
          // For select elements, we need to find the option with the desired value
          const options = await selectElement.findElements(By.css('option'));

          for (const option of options) {
            const optionValue = await option.getAttribute('value');
            const optionText = await option.getText();

            // Match by value or text content
            if (optionValue === value.toString() || optionText === value.toString()) {
              await option.click();
              inputHandled = true;
              break;
            }
          }

          if (!inputHandled) {
            // If no exact match found, try partial matching
            for (const option of options) {
              const optionValue = await option.getAttribute('value');
              const optionText = await option.getText();

              if (optionValue.toLowerCase().includes(value.toString().toLowerCase()) ||
                  optionText.toLowerCase().includes(value.toString().toLowerCase())) {
                await option.click();
                inputHandled = true;
                break;
              }
            }
          }
        } catch {
          // Select element not found, continue to text input
        }

        // If no select element found or handled, try text input
        if (!inputHandled) {
          try {
            const textInput = await settingContainer.findElement(By.css('input[type="text"], textarea'));
            await textInput.clear();
            await textInput.sendKeys(value.toString());
            inputHandled = true;
          } catch {
            // Text input not found
          }
        }

        // If still not handled, try more input types
        if (!inputHandled) {
          try {
            const input = await settingContainer.findElement(By.css('input, textarea, select'));
            const inputType = await input.getTagName();

            if (inputType === 'select') {
              // Handle select that wasn't caught above
              const options = await input.findElements(By.css('option'));
              for (const option of options) {
                const optionText = await option.getText();
                if (optionText === value.toString()) {
                  await option.click();
                  inputHandled = true;
                  break;
                }
              }
            } else {
              // Handle other input types
              await input.clear();
              await input.sendKeys(value.toString());
              inputHandled = true;
            }
          } catch {
            // No input found
          }
        }

        if (!inputHandled) {
          throw new Error(`Could not find or handle input control for setting: ${title}`);
        }
      }

      log(`Successfully set setting ${id} to ${value} using fallback implementation`);

    } catch (fallbackError) {
      log(`Both primary and fallback implementations failed: ${fallbackError}`);
      throw new Error(`Failed to set setting ${id}: ${fallbackError}`);
    }
  }
};
