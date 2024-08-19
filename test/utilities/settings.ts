/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { debug, Duration } from './miscellaneous.ts';
import { Setting, SettingsEditor } from 'vscode-extension-tester';
import { getWorkbench } from './workbench.ts';


type Perspective = 'Workspace' | 'User';

async function findAndCheckSetting(
  title: string,
  categories: string[] = [],
  perspective: Perspective = 'Workspace'
): Promise<{ checkButton: Setting; checkButtonValue: string | boolean | null }> {
  debug(`enter findAndCheckSetting for id: ${title}`);
  const settings  = await openSettings(perspective);
  debug(`openSettings - after open`);
  const setting = await settings.findSetting(title, ...categories);

  if (!setting) {
    throw new Error(`Could not find setting with name: ${title} in catagories: ${categories.join(', ')}`);
  }

  const value = await setting.getValue();

  debug(`findAndCheckSetting result for ${title} found ${!!setting} value: ${value}`);
  return { checkButton: setting, checkButtonValue: value };
}

async function openSettings(perspective: Perspective): Promise<SettingsEditor> {
  debug('openSettings - enter');
  const settings = await getWorkbench().openSettings();
  await settings.switchToPerspective(perspective);
  debug('openSettings - after open');
  return settings;
}

async function openSettingsAndMaybeDo<T>(
  perspective: Perspective,
  doThis?: (settings: SettingsEditor) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  debug('openSettings - enter');
  const settings = await openSettings(perspective);
  if (!doThis) {
    return settings as T;
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `openSettings doThis function timed out after ${timeout.milliseconds} milliseconds`
        )
      );
    }, timeout.milliseconds);
  });

  const doThisPromise = doThis(settings).then((result) => result ?? settings);

  return (await Promise.race([doThisPromise, timeoutPromise])) as T;
}

// should not be needed
export async function inWorkspaceSettings<T>(
  doThis?: (settings: SettingsEditor) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  return openSettingsAndMaybeDo('Workspace', doThis, timeout);
}

export async function inUserSettings<T>(
  doThis?: (settings: SettingsEditor) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  return openSettingsAndMaybeDo('User', doThis, timeout);
}

async function toggleBooleanSetting(
  id: string,
  timeout: Duration,
  finalState: boolean | undefined,
  settingsType: 'user' | 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  return await settingsFunction<boolean>(async () => {
    let result = await findAndCheckSetting(id);

    if (finalState !== undefined) {
      if (
        (finalState && result.checkButtonValue === 'true') ||
        (!finalState && result.checkButtonValue === 'false')
      ) {
        return true;
      }
    }
    await result.checkButton.click();
    result = await findAndCheckSetting(id);
    return result.checkButtonValue === 'true';
  }, timeout);
}

export async function enableBooleanSetting(
  id: string,
  timeout: Duration = Duration.seconds(10),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  debug(`enableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, timeout, true, settingsType);
}

export async function disableBooleanSetting(
  id: string,
  timeout: Duration = Duration.seconds(10),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  debug(`disableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, timeout, false, settingsType);
}

export async function isBooleanSettingEnabled(
  id: string,
  timeout: Duration = Duration.seconds(5),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  return await settingsFunction<boolean>(async () => {
    const { checkButtonValue } = await findAndCheckSetting(id);
    return checkButtonValue === 'true';
  }, timeout);
}
