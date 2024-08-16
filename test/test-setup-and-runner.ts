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

    constructor(private spec?: string | undefined) {
        super(EnvironmentSettings.getInstance().extensionPath);
    }

    public async setup(): Promise<void> {
        await this.downloadCode(EnvironmentSettings.getInstance().vscodeVersion);
        await this.downloadChromeDriver(EnvironmentSettings.getInstance().vscodeVersion);
        await this.installExtensions();
        // Install extensions or any other setup
        // await tester.installVsix('path/to/your/extension.vsix');
        // await tester.installFromMarketplace('publisher.extension-id');
    }

    public async runTests(): Promise<number> {
        const useExistingProject = EnvironmentSettings.getInstance().useExistingProject;
        const resources = useExistingProject ? [useExistingProject] : [];
        return super.runTests(EnvironmentSettings.getInstance().specFiles, { resources });
    }
    public async installExtension(extension: string, extensionsDir: string): Promise<void> {
        utilities.log(`SetUp - Started Install extension ${path.basename(extension)}`);
        this.installVsix({ useYarn: false, vsixFile: extension });
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

const testSetupAnRunner = new TestSetupAndRunner(argv.spec);

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
