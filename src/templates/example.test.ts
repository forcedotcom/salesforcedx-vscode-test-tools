/**
 * Example VS Code extension test file
 *
 * This demonstrates a basic UI test for a VS Code extension
 */
import { VSBrowser, Workbench, SideBarView } from 'vscode-extension-tester';
import { expect } from 'chai';
import { By } from 'selenium-webdriver';

describe('Example Extension Test', function () {
  // Extend the default timeout for UI tests
  this.timeout(30000);

  let browser: typeof VSBrowser.instance;

  before(async function () {
    // Get VSBrowser instance
    browser = VSBrowser.instance;
  });

  it('should activate the extension', async function () {
    // Open a test project folder
    // Note: Replace this with a path to your test project
    await browser.openResources(process.env.TEST_PROJECT_PATH || '/path/to/test/project');

    // Access VS Code UI components
    const workbench = new Workbench();

    // Get Activity Bar and click on extension icon (replace 'Your Extension' with your extension name)
    const activityBar = await workbench.getActivityBar();
    const extensionIcon = await activityBar.getViewControl('Your Extension');

    // Verify extension icon exists and click on it
    expect(extensionIcon).to.not.be.undefined;
    if (extensionIcon) {
      await extensionIcon.click();
    }

    // Verify sidebar view title
    const sidebarView = new SideBarView();
    const title = await sidebarView.getTitlePart().getTitle();
    expect(title).to.equal('Your Extension');

    // Take screenshot for debugging (optional)
    await browser.takeScreenshot('extension-activated');
  });

  it('should interact with extension UI elements', async function () {
    // Get the sidebar content
    const sidebarView = new SideBarView();
    const content = await sidebarView.getContent();

    // Find and click on a button in the sidebar (adjust selectors for your extension)
    const button = await content.findElement(By.css('button.extension-action'));
    await button.click();

    // Verify expected result (adjust for your extension)
    // For example, check if a notification appears
    const workbench = new Workbench();
    const notifications = await workbench.getNotifications();
    expect(notifications.length).to.be.greaterThan(0);

    const firstNotification = notifications[0];
    const message = await firstNotification.getMessage();
    expect(message).to.include('Extension action successful');
  });
});
