const { expect } = require("@playwright/test");
const { test } = require("@playwright/test");
const { Base } = require("../utils/base");
const { LoginPage } = require("../pages/loginPage");

let base;
let loginPage;

test.beforeEach(async ({ page }) => {
  base = new Base(page);
  await base.goToWebsite();
  await base.successfullLoad();
  loginPage = new LoginPage(page);
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

test('Test valid login', async ({ page }) => {
  await loginPage.login("admin", "admin123");
  await expect(page.locator('[placeholder="Ask anything..."]')).toBeVisible();
});