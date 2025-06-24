import { By, CodeLens, EditorView, Key, TextEditor, Workbench } from 'vscode-extension-tester';
import { executeQuickPick } from './commandPrompt';
import { Duration, log, openFile, pause } from '../core/miscellaneous';
import { getBrowser } from './workbench';
import { retryOperation } from '../retryUtils';

/**
 * Gets a text editor for a specific file
 * @param workbench - The VSCode workbench instance
 * @param fileName - Name of the file to open and edit
 * @returns A TextEditor instance for the specified file
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  log(`calling getTextEditor(${fileName})`);
  await retryOperation(async () => {
    log('getTextEditor() - Attempting to open file');
    const inputBox = await executeQuickPick('Go to File...', Duration.seconds(1));
    log('getTextEditor() - executeQuickPick() - inputBox');
    await inputBox.setText(fileName);
    log(`getTextEditor() - executeQuickPick() - inputBox.setText(${fileName})`);
    await inputBox.confirm();
    log('getTextEditor() - executeQuickPick() - inputBox.confirm()');
    await pause(Duration.seconds(1));
    // throwing an error here will cause the retryOperation to fail
    await waitForFileOpen(workbench, fileName);
  });
  log('getTextEditor() - File opened, getting editor view');

  return await retryOperation(async () => {
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
    // throwing an error here will cause the retryOperation to fail
    await waitForFileOpen(workbench, fileName);
    return textEditor;
  });
}

/**
 * Checks if a file is open in the editor
 * @param workbench - The VSCode workbench instance
 * @param name - The name of the file to check
 * @param options - Optional configuration including timeout and error message
 * @throws Timeout error if the file isn't open within the specified timeout
 */
export async function checkFileOpen(
  workbench: Workbench,
  name: string,
  options: { msg?: string; timeout?: Duration } = { timeout: Duration.milliseconds(30_000) }
) {
  await getBrowser().wait(
    async () => {
      try {
        const editorView = workbench.getEditorView();
        const activeTab = await editorView.getActiveTab();
        if (activeTab != undefined && name == (await activeTab.getTitle())) {
          return true;
        } else return false;
      } catch (error) {
        return false;
      }
    },
    options.timeout?.milliseconds,
    options.msg ?? `Expected to find file ${name} open in TextEditor before ${options.timeout}`,
    500 // Check every 500 ms
  );
}

/**
 * Waits for a file to be open in the editor with a 30-second timeout
 * @param workbench - The VSCode workbench instance
 * @param fileName - Name of the file to wait for
 * @returns Promise that resolves when file is open or rejects on timeout
 */
export async function waitForFileOpen(workbench: Workbench, fileName: string): Promise<void> {
  const timeout = 30_000; // 30 seconds
  const checkInterval = 500; // Check every 500ms
  const startTime = Date.now();
  const endTime = startTime + timeout;
  let attemptCount = 0;

  log(`waitForFileOpen() - Starting wait for file: ${fileName}`);
  log(`waitForFileOpen() - Timeout: ${timeout}ms, Check interval: ${checkInterval}ms`);

  while (Date.now() < endTime) {
    attemptCount++;
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const remainingTime = endTime - currentTime;

    log(`waitForFileOpen() - Attempt ${attemptCount}, Elapsed: ${elapsedTime}ms, Remaining: ${remainingTime}ms`);

    try {
      const editorView = workbench.getEditorView();
      log(`waitForFileOpen() - Got editor view`);

      const activeTab = await editorView.getActiveTab();
      log(`waitForFileOpen() - Got active tab: ${activeTab ? 'exists' : 'null'}`);

      if (activeTab) {
        const tabTitle = await activeTab.getTitle();
        log(`waitForFileOpen() - Active tab title: "${tabTitle}", Expected: "${fileName}"`);

        if (tabTitle === fileName) {
          log(`waitForFileOpen() - SUCCESS: File ${fileName} is now open in editor after ${elapsedTime}ms and ${attemptCount} attempts`);
          return; // File is open, success!
        } else {
          log(`waitForFileOpen() - File not matched, continuing to wait...`);
        }
      } else {
        log(`waitForFileOpen() - No active tab found, continuing to wait...`);
      }
    } catch (error) {
      // Continue checking if there's an error getting editor state
      log(`waitForFileOpen() - Error checking file open status (attempt ${attemptCount}): ${error}`);
    }

    // Wait before next check
    log(`waitForFileOpen() - Waiting ${checkInterval}ms before next check...`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  // If we reach here, timeout occurred
  const totalElapsed = Date.now() - startTime;
  const errorMsg = `Timeout: File ${fileName} was not found open in editor after ${totalElapsed}ms (${attemptCount} attempts)`;
  log(`waitForFileOpen() - TIMEOUT: ${errorMsg}`);
  throw new Error(errorMsg);
}

/**
 * Opens a file and retrieves its text content
 * @param filePath - The path to the file to open
 * @returns The text content of the file
 */
export async function attemptToFindTextEditorText(filePath: string): Promise<string> {
  await openFile(filePath);
  const fileName = filePath.substring(filePath.lastIndexOf(process.platform === 'win32' ? '\\' : '/') + 1);
  const editorView = new EditorView();
  const editor = await editorView.openEditor(fileName);
  return await editor.getText();
}

export async function overrideTextInFile(textEditor: TextEditor, classText: string) {
  const inputarea = await textEditor.findElement(By.css('.monaco-editor textarea'));
  await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a')); // Cmd+A on Mac
  await pause(Duration.seconds(3));
  await textEditor.setText(classText);
  await pause(Duration.seconds(1));
  await textEditor.save();
  await pause(Duration.seconds(1));
}

export async function waitForAndGetCodeLens(textEditor: TextEditor, codeLensName: string): Promise<CodeLens> {
  return await retryOperation(async () => {
    const lens = await textEditor.getCodeLens(codeLensName);
    if (!lens) {
        throw new Error(`Code lens ${codeLensName} not found`);
    }
    return lens;
  });
}
