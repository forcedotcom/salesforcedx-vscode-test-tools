import { ExTester } from 'vscode-extension-tester';
import { EnvironmentSettings } from './environmentSettings.ts';
import path from 'path'
import fs from 'fs/promises';
import * as utilities from './utilities/index.ts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { extensions } from './utilities/index.ts';

class TestSetupAndRunner extends ExTester {
    protected static _exTestor: TestSetupAndRunner;

    constructor(private extensionPath?: string | undefined, private spec?: string | undefined) {
        super(extensionPath);
    }

    public async setup(): Promise<void> {
        await this.downloadCode(EnvironmentSettings.getInstance().vscodeVersion);
        await this.downloadChromeDriver(EnvironmentSettings.getInstance().vscodeVersion);
        await this.installExtensions();
    }

    public async runTests(): Promise<number> {
        const useExistingProject = EnvironmentSettings.getInstance().useExistingProject;
        const resources = useExistingProject ? [useExistingProject] : [];
        return super.runTests(EnvironmentSettings.getInstance().specFiles, { resources });
    }
    public async installExtension(extension: string): Promise<void> {
        utilities.log(`SetUp - Started Install extension ${path.basename(extension)}`);
        await this.installVsix({ useYarn: false, vsixFile: extension });
    }

    public async installExtensions(excludeExtensions: utilities.ExtensionId[] = []): Promise<void> {
        const extensionsDir = path.resolve(path.join(EnvironmentSettings.getInstance().extensionPath));
        const extensionPattern =
            /^(?<publisher>.+?)\.(?<extensionId>.+?)-(?<version>\d+\.\d+\.\d+)(?:\.\d+)*$/;
        const foundInstalledExtensions = (await fs.readdir(extensionsDir))
            .filter(async (entry) => {
                const stats = await fs.stat(entry);
                return stats.isDirectory();
            })
            .map((entry) => {
                const match = entry.match(extensionPattern);
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
            .filter((ext) =>
                extensions.find((refExt) => {
                    return refExt.extensionId === ext?.extensionId;
                })
            );

        if (
            foundInstalledExtensions.length > 0 &&
            foundInstalledExtensions.every((ext) =>
                extensions.find((refExt) => refExt.extensionId === ext?.extensionId)
            )
        ) {
            utilities.log(
                `Found the following pre-installed extensions in dir ${extensionsDir}, skipping installation of vsix`
            );
            foundInstalledExtensions.forEach((ext) => {
                utilities.log(`Extension ${ext?.extensionId} version ${ext?.version}`);
            });
            return;
        }

        const extensionsVsixs = utilities.getVsixFilesFromDir(extensionsDir);
        if (extensionsVsixs.length === 0) {
            throw new Error(`No vsix files were found in dir ${extensionsDir}`);
        }

        const mergeExcluded = Array.from(
            new Set([
                ...excludeExtensions,
                ...extensions.filter((ext) => ext.shouldInstall === 'never').map((ext) => ext.extensionId)
            ])
        );

        // Refactored part to use the extensions array
        extensionsVsixs.forEach((vsix) => {
            const match = path
                .basename(vsix)
                .match(/^(?<extension>.*?)(-(?<version>\d+\.\d+\.\d+))?\.vsix$/);
            if (match?.groups) {
                const { extension, version } = match.groups;
                const foundExtension = extensions.find((e) => e.extensionId === extension);
                if (foundExtension) {
                    foundExtension.vsixPath = vsix;
                    // assign 'never' to this extension if its id is included in excluedExtensions
                    foundExtension.shouldInstall = mergeExcluded.includes(foundExtension.extensionId)
                        ? 'never'
                        : 'always';
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
        for (const extensionObj of extensions.filter(
            (ext) => ext.vsixPath !== '' && ext.shouldInstall !== 'never'
        )) {
            await this.installExtension(extensionObj.vsixPath);
        }

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
        demandOption: false,
    })
    .help()
    .argv as { spec: string | undefined };

const testSetupAnRunner = new TestSetupAndRunner(EnvironmentSettings.getInstance().extensionPath, argv.spec);

testSetupAnRunner
    .setup()
    .then(() => testSetupAnRunner.runTests())
    .then((result) => {
        console.log(result);
        process.exit(result);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
