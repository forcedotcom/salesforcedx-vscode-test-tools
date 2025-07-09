# Salesforce DX VS Code Automation Tests (RedHat)

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](LICENSE.txt)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-blue.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-v1.4-blue.svg)](CODE_OF_CONDUCT.md)

## Introduction

This repository contains the source code for the automation tests for the Salesforce Extensions for VS Code.

### RedHat VS Code Extension Tester

This project is based on ExTester, available at https://github.com/redhat-developer/vscode-extension-tester

### Getting Started

If you are interested in contributing, please take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

After cloning this repo, you will also need to have a folder called `salesforcedx-vscode` residing side-by-side in the same parent location, and have the vsixes you want to test in `salesforcedx-vscode/extensions` directory. e.g:

```
.
├── ...
├── salesforcedx-vscode-automation-tests-redhat    # E2E Tests repo
├── salesforcedx-vscode
│   └── extensions                          # Directory containing the salesforce extensions
│       ├── salesforcedx-vscode-core-63.0.0.vsix
│       ├── salesforcedx-vscode-apex-63.0.0.vsix
│       └── ...
└── ...
```

To install the test dependencies, run `npm install`. You do not need to compile - when running the e2e automation tests, the code is dynamically compiled.

### Environment Variables

The following is a list of environment variables that are used with this project. Each has a default value and are obtained using the [environmentSettings](test/environmentSettings.ts) class.

- DEV_HUB_ALIAS_NAME

  - Default value: `vscodeOrg`

- DEV_HUB_USER_NAME

  - Default value: `svcideebot@salesforce.com`

- EXTENSION_PATH

  - Default value: `{cwd}/../../salesforcedx-vscode/extensions`

    Note: If your folder structure does not match the folder structure shown above in Getting Started section, `EXTENSION_PATH` will need to be set to the relative path to 'salesforcedx-vscode/extensions'. If it does match, then no changes are needed.

- THROTTLE_FACTOR

  - Default value: `1`

- SFDX_AUTH_URL

  - Provides the dev hub auth URL to be used to authenticate the dev hub as part of test setup. There is no default value. In order to get it, run `sf org display -o vscodeOrg --verbose --json` in your terminal and get the value from `sfdxAuthUrl` property.

- SPEC_FILES (optional)

  - Used to specify the name of the file from which you want to run the tests. Note that it needs to be the compiled file, so it should have a `.js` extension. For example: `soql.e2e.js`

### Dev Hub

A requirement of this project is for a Dev Hub to have been enabled on the user's machine. The default Dev Hub name is "vscodeOrg" and the default username is "svcideebot@salesforce.com", though this can be configured with the `DEV_HUB_ALIAS_NAME` and `DEV_HUB_USER_NAME` environment variables.
Run Task: `Authorize DevHub - E2E Testing Org` through command palette (Cmd+shift+P).
Once you are connected to the org with `DEV_HUB_ALIAS_NAME` and `DEV_HUB_USER_NAME`, you can run a single or all end-to-end test suites.

### Run the tests

After the dependencies have been installed, the vsixes downloaded and stored in the right folder, and the environment variables have been set, open `salesforcedx-vscode-automation-tests-redhat` repo in Visual Studio Code, then debug using the `Debug Automation Test from env var SPEC_FILES` configuration in RUN AND DEBUG section in the left sidebar.

Note: At this point you should already have authorized `vscodeOrg` which will be used as your target DevHub, so don't forget to comment out `await this.setupAndAuthorizeOrg();` in setup() method from [test-setup-and-runner](test/test-setup-and-runner.ts) so you don't run into errors during setup while running E2E Tests locally.

Note: if no changes are made to `_specFiles` property in [environmentSettings](test/environmentSettings.ts) class, then all tests will be run. If you want to run only some, comment out `'./test/specs/**/*.e2e.ts'` line in that file and uncomment the tests you want to run.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

If you discover any security-related issues, please email security@salesforce.com instead of using the issue tracker.

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Support

For support, please open an issue in this repository or contact the Salesforce Platform Engineering team.
