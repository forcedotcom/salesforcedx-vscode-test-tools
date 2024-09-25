import { getTextEditor, pause } from './miscellaneous';
import { getWorkbench } from './workbench';

export async function createSfdxProjectJsonWithAllFields(): Promise<void> {
  const sfdxConfig = [
    `{`,
    `\t"packageDirectories": [`,
    `\t\t{`,
    `\t\t\t"path": "force-app",`,
    `\t\t\t"default": true`,
    `\t\t}`,
    `\t],`,
    `\t"namespace": "",`,
    `\t"sourceApiVersion": "61.0",`,
    `\t"sourceBehaviorOptions": ["decomposeCustomLabelsBeta", "decomposePermissionSetBeta", "decomposeWorkflowBeta", "decomposeSharingRulesBeta"]`,
    `}`
  ].join('\n');
  const textEditor = await getTextEditor(getWorkbench(), 'sfdx-project.json');
  await textEditor.setText(sfdxConfig);
  await textEditor.save();
  await pause();
}