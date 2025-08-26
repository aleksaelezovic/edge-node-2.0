const { expect } = require("@playwright/test");
const { test } = require("@playwright/test");
const { Base } = require("../utils/base");
const { LoginPage } = require("../pages/loginPage");
const { ChatbotPage } = require("../pages/chatbotPage");

let base;
let loginPage;
let chatbotPage;

test.beforeEach(async ({ page }) => {
  base = new Base(page);
  await base.goToWebsite();
  await base.successfullLoad();
  loginPage = new LoginPage(page);
  chatbotPage = new ChatbotPage(page);
});

test('Test wrong username', async ({ page }) => {
  await loginPage.login("invalid", "admin123");
  await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible();
});

test('Test wrong password', async ({ page }) => {
  await loginPage.login("admin", "invalid");
  await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible();
});

test('Test wrong username and password', async ({ page }) => {
  await loginPage.login("invalid", "invalid");
  await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible();
});

test.skip('Test valid login', async () => {
  await loginPage.successfullLogin();
});

test.skip('Test send message and get answer', async ({ page }) => {
  await loginPage.successfullLogin();
  await chatbotPage.sendMessage("3+7");
  await expect(page.locator('.css-textHasAncestor-1jxf684').last()).toHaveText("3 + 7 equals 10.");
});

test.skip('Test if importing files and summarizing works', async ({ page }) => {
  await loginPage.successfullLogin();
  
  const filePath = './tests/TestCourseforUKSAP1000.pdf';
  await chatbotPage.importFiles(filePath);
  
  
  await page.waitForTimeout(3000);
  await chatbotPage.sendMessage("Please summarize the imported PDF document");
  
  
  await page.waitForTimeout(3000);
  await expect(page.locator('.css-textHasAncestor-1jxf684').last()).toHaveText("The document appears to be about a training course titled “Test Course for UK SAP 1000,” scheduled for September 21-22, 2020. It includes sections on the course’s development rationale, expected outcomes, and a schedule for the event. Additionally, it mentions a “UK Virtual Training Session” and provides a link to a map for the location of the “Connected Learning Live Session.”");
});