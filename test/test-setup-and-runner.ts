import { ExTester } from 'vscode-extension-tester';
import { EnvironmentSettings } from './environmentSettings';
import path from 'path';
import fs from 'fs/promises';
import * as utilities from './utilities/index';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { extensions } from './utilities/index';
import { ReleaseQuality } from 'vscode-extension-tester/out/util/codeUtil';
import { expect } from 'chai';

class TestSetupAndRunner extends ExTester {
  protected static _exTestor: TestSetupAndRunner;

  constructor(
    extensionPath?: string | undefined,
    private spec?: string | undefined
  ) {
    super(extensionPath, ReleaseQuality.Stable, extensionPath);
  }

  public async setup(): Promise<void> {
    await this.downloadCode(EnvironmentSettings.getInstance().vscodeVersion);
    await this.downloadChromeDriver(EnvironmentSettings.getInstance().vscodeVersion);
    await this.installExtensions();
    await this.setupAndAuthorizeOrg();
  }

  public async runTests(): Promise<number> {
    const useExistingProject = EnvironmentSettings.getInstance().useExistingProject;
    const resources = useExistingProject ? [useExistingProject] : [];
    return super.runTests(this.spec || EnvironmentSettings.getInstance().specFiles, { resources });
  }
  public async installExtension(extension: string): Promise<void> {
    try {
      // Validate the VSIX file before attempting to install it
      await utilities.validateVsixFile(extension);

      utilities.log(`SetUp - Started Install extension ${path.basename(extension)}`);
      try {
        await this.installVsix({
          useYarn: false,
          vsixFile: extension
        });
      } catch (installError: any) {
        throw new Error(
          `Failed to install VSIX: ${installError.message}\nCommand output: ${installError.stdout || 'no output'}\nError output: ${installError.stderr || 'no error output'}`
        );
      }
    } catch (error) {
      utilities.log(`Error installing extension ${extension}: ${error}`);
      throw error;
    }
  }

  public async installExtensions(excludeExtensions: utilities.ExtensionId[] = []): Promise<void> {
    try {
      const extensionsDir = path.resolve(path.join(EnvironmentSettings.getInstance().extensionPath));
      utilities.log(`Looking for extensions in: ${extensionsDir}`);
      const extensionPattern = /^(?<publisher>.+?)\.(?<extensionId>.+?)-(?<version>\d+\.\d+\.\d+)(?:\.\d+)*$/;
      const extensionsDirEntries = (await fs.readdir(extensionsDir)).map(entry => path.resolve(extensionsDir, entry));

      // Filter directories first
      const validDirectories = [];
      for (const entry of extensionsDirEntries) {
        try {
          const stats = await fs.stat(entry);
          if (stats.isDirectory()) {
            validDirectories.push(entry);
          }
        } catch (e) {
          utilities.log(`stat failed for file ${entry}`);
        }
      }

      const foundInstalledExtensions = validDirectories
        .map(entry => {
          const match = path.basename(entry).match(extensionPattern);
          if (match?.groups) {
            return {
              publisher: match.groups.publisher,
              extensionId: match.groups.extensionId,
              version: match.groups.version,
              path: entry
            };
          }
          return null;
        })
        .filter(Boolean)
        .filter(ext =>
          extensions.find(refExt => {
            return refExt.extensionId === ext?.extensionId;
          })
        );

      if (
        foundInstalledExtensions.length > 0 &&
        foundInstalledExtensions.every(ext => extensions.find(refExt => refExt.extensionId === ext?.extensionId))
      ) {
        utilities.log(
          `Found the following pre-installed extensions in dir ${extensionsDir}, skipping installation of vsix`
        );
        foundInstalledExtensions.forEach(ext => {
          utilities.log(`Extension ${ext?.extensionId} version ${ext?.version}`);
        });
        return;
      }

      const extensionsVsixs = utilities.getVsixFilesFromDir(extensionsDir);
      if (extensionsVsixs.length === 0) {
        throw new Error(`No vsix files were found in dir ${extensionsDir}`);
      }

      // Add more detailed logging for VSIX files
      for (const vsix of extensionsVsixs) {
        try {
          const stats = await fs.stat(vsix);
          utilities.log(`Found VSIX file: ${vsix} (size: ${stats.size} bytes)`);

          // Pre-validate VSIX files before attempting installation
          await utilities.validateVsixFile(vsix);
          utilities.log(`Validated VSIX file: ${vsix} (valid ZIP archive confirmed)`);
        } catch (error) {
          utilities.log(`Warning: VSIX validation failed for ${vsix}: ${error}`);
          // Continue with other files even if one fails validation - we'll handle errors during installation
        }
      }

      const mergeExcluded = Array.from(
        new Set([
          ...excludeExtensions,
          ...extensions.filter(ext => ext.shouldInstall === 'never').map(ext => ext.extensionId)
        ])
      );

      // Refactored part to use the extensions array
      extensionsVsixs.forEach(vsix => {
        const match = path.basename(vsix).match(/^(?<extension>.*?)(-(?<version>\d+\.\d+\.\d+))?\.vsix$/);
        if (match?.groups) {
          const { extension, version } = match.groups;
          const foundExtension = extensions.find(e => e.extensionId === extension);
          if (foundExtension) {
            foundExtension.vsixPath = vsix;
            // assign 'never' to this extension if its id is included in excluedExtensions
            foundExtension.shouldInstall = mergeExcluded.includes(foundExtension.extensionId) ? 'never' : 'always';
            // if not installing, don't verify, otherwise use default value
            foundExtension.shouldVerifyActivation =
              foundExtension.shouldInstall === 'never' ? false : foundExtension.shouldVerifyActivation;
            utilities.log(
              `SetUp - Found extension ${extension} version ${version} with vsixPath ${foundExtension.vsixPath}`
            );
          }
        }
      });

      // Iterate over the extensions array to install extensions
      for (const extensionObj of extensions.filter(ext => ext.vsixPath !== '' && ext.shouldInstall !== 'never')) {
        try {
          await this.installExtension(extensionObj.vsixPath);
        } catch (error) {
          utilities.log(`Error installing extension ${extensionObj.extensionId}: ${error}`);
          // Continue with other extensions even if one fails
          // If this is a critical extension, you might want to throw here instead
          if (extensionObj.shouldInstall === 'always') {
            throw error;
          }
        }
      }
    } catch (error) {
      utilities.log(`Error in installExtensions: ${error}`);
      throw error;
    }
  }

  public async setupAndAuthorizeOrg() {
    const environmentSettings = EnvironmentSettings.getInstance();
    const devHubUserName = environmentSettings.devHubUserName;
    const devHubAliasName = environmentSettings.devHubAliasName;
    const SFDX_AUTH_URL = environmentSettings.sfdxAuthUrl;
    const orgId = environmentSettings.orgId;
    const sfdxAuthUrl = String(SFDX_AUTH_URL);
    const authFilePath = 'authFile.txt';

    // Create and write the SFDX Auth URL in a text file
    await fs.writeFile(authFilePath, sfdxAuthUrl);

    // Step 1: Authorize to Testing Org
    const authorizeOrg = await utilities.orgLoginSfdxUrl(authFilePath);
    expect(authorizeOrg.stdout).to.contain(`Successfully authorized ${devHubUserName} with org ID ${orgId}`);

    // Step 2: Set Alias for the Org
    const setAlias = await utilities.setAlias(devHubAliasName, devHubUserName);
    expect(setAlias.stdout).to.contain(devHubAliasName);
    expect(setAlias.stdout).to.contain(devHubUserName);
    expect(setAlias.stdout).to.contain('true');
  }

  static get exTester(): TestSetupAndRunner {
    if (TestSetupAndRunner.exTester) {
      return TestSetupAndRunner._exTestor;
    }
    TestSetupAndRunner._exTestor = new TestSetupAndRunner();
    return TestSetupAndRunner._exTestor;
  }
}

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('spec', {
    alias: 's',
    type: 'string',
    description: 'Glob pattern for test files',
    demandOption: false
  })
  .help().argv as { spec: string | undefined };

const testSetupAnRunner = new TestSetupAndRunner(EnvironmentSettings.getInstance().extensionPath, argv.spec);
async function run() {
  try {
    await testSetupAnRunner.setup();
    const result = await testSetupAnRunner.runTests();
    console.log(result);
    process.exit(result);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
