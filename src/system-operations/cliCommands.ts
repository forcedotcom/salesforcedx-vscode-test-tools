import { SpawnOptionsWithoutStdio, spawn, exec } from 'child_process';
import { log, debug, SfCommandRunResults, OrgEdition } from '../core';
import { EnvironmentSettings } from '../environmentSettings';
import { retryOperation } from '../retryUtils';

export type NONE = 'NONE';
export interface SfCommandOptions extends SpawnOptionsWithoutStdio {
  stdin?: string;
}

/**
 * Runs a Salesforce CLI command with optional stdin input
 * @param command - The SF CLI command to run
 * @param args - Command arguments and options
 * @returns Promise resolving to command results
 */
export async function runCliCommand(
  command: string,
  ...args: (string | SfCommandOptions)[]
): Promise<SfCommandRunResults> {
  const commandArgs = args.filter(arg => typeof arg === 'string');
  const hadJsonFlag = commandArgs.some(arg => arg === '--json');
  const options = args.find(arg => typeof arg !== 'string') as SfCommandOptions;
  let message = `running CLI command ${command} ${commandArgs.join(' ')}`;
  if (options) {
    message += `\nspawn options: ${JSON.stringify(options)}`;
  }
  const logLevel = EnvironmentSettings.getInstance().logLevel;

  log(message);

  // Extract stdin data if provided
  const stdinData = options?.stdin;

  // add NODE_ENV=production and remove stdin from spawn options
  const spawnOptions = {
    ...(options ?? {}),
    env: {
      ...process.env, // Ensure existing environment variables are included
      NODE_ENV: 'production',
      SF_LOG_LEVEL: logLevel,
      ...(options?.env ?? {}) // Ensure any additional env vars in options are included
    },
    // On Windows, use shell to resolve executable extensions (.exe, .cmd, .bat)
    shell: process.platform === 'win32'
  };
  delete spawnOptions.stdin;

  return new Promise((resolve, reject) => {
    const sfProcess = spawn('sf', [command, ...commandArgs] as string[], spawnOptions);

    let stdout = '';
    let stderr = '';

    sfProcess.stdout?.on('data', data => {
      stdout += data.toString();
    });

    sfProcess.stderr?.on('data', data => {
      stderr += data.toString();
    });

    sfProcess.on('close', code => {
      // Post-command processing
      const result: SfCommandRunResults = { stdout, stderr, exitCode: code ?? 0 };
      result.stdout = hadJsonFlag ? removeEscapedCharacters(result.stdout) : result.stdout;
      // Perform any necessary post-processing here
      // For example, you can modify the result object or log additional information
      log(`Command finished with exit code ${result.exitCode}`);
      resolve(result);
    });

    sfProcess.on('error', err => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });

    // Handle stdin input if provided
    if (stdinData) {
      if (sfProcess.stdin) {
        sfProcess.stdin.write(stdinData);
        sfProcess.stdin.end();
      } else {
        reject(new Error('Failed to write to stdin'));
      }
    }
  });
}

/**
 * Deletes a scratch org by alias name
 * @param orgAliasName - The alias of the scratch org to delete
 */
export async function deleteScratchOrg(orgAliasName: string | undefined): Promise<void> {
  if (orgAliasName) {
    // The Terminal view can be a bit unreliable, so directly call exec() instead:
    const sfOrgDeleteResults = await runCliCommand('org:delete:scratch', '--target-org', orgAliasName, '--no-prompt');
    if (sfOrgDeleteResults.exitCode > 0) {
      log(
        `deleteScratchOrg for org ${orgAliasName} failed with exit code ${sfOrgDeleteResults.exitCode}.\nRaw stderr ${sfOrgDeleteResults.stderr}.`
      );
    }
  }
}

/**
 * Logs into an org using an SFDX auth URL file
 * @param authFilePath - Path to the auth file containing the SFDX URL
 * @returns Results of the login command
 * @throws Error if login fails
 */
export async function orgLoginSfdxUrl(): Promise<SfCommandRunResults> {
  const sfdxAuthUrl = process.env.SFDX_AUTH_URL;
  if (!sfdxAuthUrl) {
    throw new Error('SFDX_AUTH_URL environment variable is not set');
  }

  const sfSfdxUrlStoreResult = await runCliCommand('org:login:sfdx-url', '-d', '--sfdx-url-stdin', { stdin: sfdxAuthUrl });
  if (sfSfdxUrlStoreResult.exitCode > 0) {
    debug('sfSfdxUrlStoreResult.exitCode = ' + sfSfdxUrlStoreResult.exitCode);
    debug('sfSfdxUrlStoreResult.stdout = ' + sfSfdxUrlStoreResult.stdout);
    throw new Error(
      `orgLoginSfdxUrl failed with exit code ${sfSfdxUrlStoreResult.exitCode}\nRaw stderr: ${sfSfdxUrlStoreResult.stderr}\nRaw stdout: ${sfSfdxUrlStoreResult.stdout}`
    );
  }
  debug(`orgLoginSfdxUrl results ${JSON.stringify(sfSfdxUrlStoreResult)}`);
  return sfSfdxUrlStoreResult;
}

/**
 * Displays information about a Salesforce org
 * @param usernameOrAlias - Username or alias of the org to display
 * @returns Results of the org display command
 * @throws Error if the command fails
 */
export async function orgDisplay(usernameOrAlias: string | undefined): Promise<SfCommandRunResults> {
  if (!usernameOrAlias) {
    throw new Error('No usernameOrAlias provided');
  }

  const sfOrgDisplayResult = await runCliCommand('org:display', '--target-org', usernameOrAlias, '--verbose', '--json');
  if (sfOrgDisplayResult.exitCode > 0) {
    const message = `sf org display failed with exit code: ${sfOrgDisplayResult.exitCode}.\n${sfOrgDisplayResult.stderr}`;
    log(message);
    throw new Error(message);
  }
  debug(`orgDisplay results ${JSON.stringify(sfOrgDisplayResult)}`);
  return sfOrgDisplayResult;
}

/**
 * Lists all Salesforce orgs
 * @returns Results of the org list command
 * @throws Error if the command fails
 */
export async function orgList(): Promise<SfCommandRunResults> {
  const sfOrgListResult = await runCliCommand('org:list', '--json');
  if (sfOrgListResult.exitCode > 0) {
    const message = `org list failed with exit code ${sfOrgListResult.exitCode}\n stderr ${sfOrgListResult.stderr}`;
    log(message);
    throw new Error(message);
  }
  debug(`orgList results ${JSON.stringify(sfOrgListResult)}`);
  return sfOrgListResult;
}

/**
 * Lists all aliases
 * @returns Results of the alias list command
 * @throws Error if the command fails
 */
export async function aliasList(): Promise<SfCommandRunResults> {
  const sfAliasListResult = await runCliCommand('alias:list', '--json');
  if (sfAliasListResult.exitCode > 0) {
    const message = `alias list failed with exit code ${sfAliasListResult.exitCode}\n stderr ${sfAliasListResult.stderr}`;
    log(message);
    throw new Error(message);
  }
  debug(`aliasList results ${JSON.stringify(sfAliasListResult)}`);
  return sfAliasListResult;
}

/**
 * Creates a scratch org and makes it the project default
 * @param edition - The org edition to use (developer or enterprise)
 * @param definitionFileOrNone - Path to the scratch org definition file or 'NONE'
 * @param scratchOrgAliasName - Alias to assign to the scratch org
 * @param durationDays - Number of days before the scratch org expires
 * @returns Results of the scratch org creation command
 * @throws Error if scratch org creation fails
 */
export async function scratchOrgCreate(
  edition: OrgEdition,
  definitionFileOrNone: string | NONE,
  scratchOrgAliasName: string,
  durationDays: number
): Promise<SfCommandRunResults> {
  log('calling "sf org:create:scratch"...');
  const args = [
    '--edition',
    edition,
    '--alias',
    scratchOrgAliasName,
    '--duration-days',
    durationDays.toString(),
    '--set-default',
    '--wait',
    '30',
    '--json',
    ...(definitionFileOrNone !== 'NONE' ? ['--definition-file', definitionFileOrNone] : [])
  ];

  const sfOrgCreateResult: SfCommandRunResults = await retryOperation(async () => {
    return await runCliCommand('org:create:scratch', ...args);
  });

    if (sfOrgCreateResult.exitCode > 0) {
      log(
        `create scratch org failed. Exit code: ${sfOrgCreateResult.exitCode}. \ncreate scratch org failed. Raw stderr: ${sfOrgCreateResult.stderr} \ncreate scratch org failed. Raw stdout: ${sfOrgCreateResult.stdout}`
      );
      throw new Error(sfOrgCreateResult.stderr);
    }

    log(`..."sf org:create:scratch" finished`);
    debug(`scratchOrgCreate results ${JSON.stringify(sfOrgCreateResult)}`);

  return sfOrgCreateResult;
}

/**
 * Sets an alias for a Salesforce org username
 * @param devHubAliasName - The alias to set
 * @param devHubUserName - The username to associate with the alias
 * @returns Results of the alias set command
 * @throws Error if alias setting fails
 */
export async function setAlias(devHubAliasName: string, devHubUserName: string): Promise<SfCommandRunResults> {
  const setAliasResult = await runCliCommand('alias:set', `${devHubAliasName}=${devHubUserName}`);
  if (setAliasResult.exitCode > 0) {
    log(`alias failed. Exit code: ${setAliasResult.exitCode}. \nRaw stderr: ${setAliasResult.stderr}`);
    throw new Error(setAliasResult.stderr);
  }
  return setAliasResult;
}

/**
 * Installs Jest testing tools for LWC
 * @param projectFolder - Path to the project folder
 * @throws Error if installation fails or project folder is undefined
 */
export async function installJestUTToolsForLwc(projectFolder: string | undefined): Promise<void> {
  log(`SetUp - Started Install @salesforce/sfdx-lwc-jest Node module...`);
  if (!projectFolder) {
    throw new Error('cannot setup lwc tests without a project folder.');
  }
  const command =
    'npm install @lwc/eslint-plugin-lwc@^2.0.0 --save-dev --ignore-scripts && npm install --ignore-scripts && npm uninstall husky --force && npm install eslint@^8 --save-dev --ignore-scripts && npm install --save-dev --ignore-scripts && npm install @salesforce/sfdx-lwc-jest --save-dev --ignore-scripts';
  return new Promise((resolve, reject) => {
    exec(command,
      {
        cwd: projectFolder,
        env: {
          ...process.env,
          HUSKY_SKIP_INSTALL: '1',
          NPM_CONFIG_LEGACY_PEER_DEPS: 'true'
        }
      }, (error, stdout, stderr) => {
      if (error) {
        log(`Error with ${command}`);
        reject(error);
        return;
      }
      if (stderr) {
        log(`Error stderr received for ${command}`);
        log(`stderr: ${stderr}`);
      }
      log(stdout);
      log(`...SetUp - Finished Install @salesforce/sfdx-lwc-jest Node module`);
      resolve();
    });
  });
}

/**
 * Creates a user in a Salesforce org
 * @param systemAdminUserDefPath - Path to the user definition file
 * @param targetOrg - The org where the user should be created
 * @returns Results of the user creation command
 * @throws Error if user creation fails or target org is undefined
 */
export async function createUser(
  systemAdminUserDefPath: string,
  targetOrg: string | undefined
): Promise<SfCommandRunResults> {
  if (!targetOrg) {
    throw new Error('cannot create user with target');
  }
  const sfOrgCreateUserResult = await runCliCommand(
    'org:create:user',
    '--definition-file',
    systemAdminUserDefPath,
    '--target-org',
    targetOrg
  );
  if (sfOrgCreateUserResult.exitCode > 0) {
    log(
      `org create user failed Exit code: ${sfOrgCreateUserResult.exitCode}. \nRaw stderr: ${sfOrgCreateUserResult.stderr}`
    );
    throw new Error(sfOrgCreateUserResult.stderr);
  }
  debug(`createUser results ${JSON.stringify(sfOrgCreateUserResult)}`);
  return sfOrgCreateUserResult;
}

/**
 * Removes escape characters from CLI command output
 * @param result - The string to clean up
 * @returns The string with escape characters removed
 */
export function removeEscapedCharacters(result: string): string {
  const resultJson = result.replace(/\u001B\[\d\dm/g, '').replace(/\\n/g, '');

  return resultJson;
}

/**
 * Generates a Salesforce project
 * @param name - The name of the project
 * @param path - Optional path where the project should be created
 * @param template - Optional template to use for project creation
 * @returns Results of the project generation command
 */
export async function generateSfProject(
  name: string,
  path?: string | undefined,
  template?: string | undefined
): Promise<SfCommandRunResults> {
  const sfProjectGenerateResult = await runCliCommand(
    'project:generate',
    '--name',
    name,
    '--template',
    template ?? 'standard',
    ...(path ? ['-d', path] : [])
  );
  if (sfProjectGenerateResult.exitCode > 0) {
    log(
      `project generate failed Exit code: ${sfProjectGenerateResult.exitCode}. \nRaw stderr: ${sfProjectGenerateResult.stderr}`
    );
    throw new Error(sfProjectGenerateResult.stderr);
  }
  debug(`generateSfProject results ${JSON.stringify(sfProjectGenerateResult)}`);
  return sfProjectGenerateResult;
}
