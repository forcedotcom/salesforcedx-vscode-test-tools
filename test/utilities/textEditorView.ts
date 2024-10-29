import { TextEditor, Workbench } from 'vscode-extension-tester';
import { executeQuickPick } from './commandPrompt';
import { Duration, log, pause } from './miscellaneous';

/**
 * @param workbench page object representing the custom VSCode title bar
 * @param fileName name of the file we want to open and use
 * @returns editor for the given file name
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  log(`calling getTextEditor(${fileName})`);
  const inputBox = await executeQuickPick('Go to File...', Duration.seconds(1));
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await pause(Duration.seconds(1));
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}
