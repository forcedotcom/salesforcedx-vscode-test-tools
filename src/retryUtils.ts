/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Duration, log } from './core';
import { executeQuickPick, notificationIsPresentWithTimeout } from './ui-interaction';

/**
 * Retry a notification check
 * @param notificationPattern - The notification pattern to check
 * @param wait - The wait time for the notification to appear
 * @param methodToRunForEachTry - The method to run for each try
 * @returns
 */
export const verifyNotificationWithRetry = async (
  notificationPattern: RegExp,
  wait = Duration.minutes(3),
  methodToRunForEachTry?: () => Promise<void>
) => {
  return await retryOperation(
    async () => {
      if (methodToRunForEachTry) {
        await methodToRunForEachTry();
      }
      const notificationWasFound = await notificationIsPresentWithTimeout(notificationPattern, wait);
      if (!notificationWasFound) {
        log(`Notification ${notificationPattern} was not found`);
        await executeQuickPick('Notifications: Show Notifications');
        throw new Error(`Notification ${notificationPattern} was not found`);
      }
      return notificationWasFound;
    },
    5,
    `Failed to find notification ${notificationPattern}`
  );
};

/**
 * Retry an operation
 * @param operation - The operation to retry
 * @param maxAttempts - The maximum number of attempts
 * @param errorMessage - The error message to log
 * @returns The result of the operation
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  errorMessage = 'Operation failed'
): Promise<T> => {
  const formatError = (error: unknown): string => {
    if (error instanceof Error) {
      return `${error.message}${error.stack ? '\nStack trace:\n' + error.stack : ''}`;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error);
  };

  const isStaleElementError = (error: unknown): boolean => {
    if (error instanceof Error) {
      return (
        error.message.includes('stale element') ||
        error.message.includes('element not interactable') ||
        error.message.includes('no such element')
      );
    }
    return false;
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const formattedError = formatError(error);

      // Add longer wait for stale element errors on Ubuntu
      if (isStaleElementError(error) && process.platform === 'linux') {
        log(`${errorMessage} - Stale element detected on Ubuntu, waiting longer before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second wait for Ubuntu
      }

      if (attempt === maxAttempts) {
        log(`${errorMessage} - Final attempt failed: ${formattedError} (after ${maxAttempts} attempts)`);
        throw error;
      }
      log(`${errorMessage} - Attempt ${attempt}/${maxAttempts} failed: ${formattedError}, trying again...`);

      // Standard wait between retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`${errorMessage} after ${maxAttempts} attempts`);
};
