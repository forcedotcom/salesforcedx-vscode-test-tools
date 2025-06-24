/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Duration, log } from './core';
import {
  getWorkbench,
  notificationIsPresentWithTimeout
} from './ui-interaction';

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
  return await retryOperation(async () => {
    if (methodToRunForEachTry) {
      await methodToRunForEachTry();
    }
    const notificationWasFound = await notificationIsPresentWithTimeout(notificationPattern, wait);
    if (!notificationWasFound) {
      log(`Notification ${notificationPattern} was not found, will retry...`);
      await getWorkbench().openNotificationsCenter();
      throw new Error(`Notification ${notificationPattern} was not found`);
    }
    return notificationWasFound;
  }, 3, `Failed to find notification ${notificationPattern}`);
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
  maxAttempts = 2,
  errorMessage = 'Operation failed'
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      log(`${errorMessage} ${JSON.stringify(error)}, trying again...`);
    }
  }
  throw new Error(`${errorMessage} after ${maxAttempts} attempts`);
};
