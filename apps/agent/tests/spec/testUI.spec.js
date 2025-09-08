const { expect } = require("@playwright/test");
const { test } = require("@playwright/test");
const { Base } = require("../utils/base");
const { LoginPage } = require("../pages/loginPage");
const { ChatbotPage } = require("../pages/chatbotPage");
const fs = require('fs');
const path = require('path');

let base;
let loginPage;
let chatbotPage;

function loadEnvFile(envFile) {
  const envPath = path.join(__dirname, '..', envFile);
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=', 2);
      if (key && value) {
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}
test.beforeEach(async ({ page }) => {
  base = new Base(page);
  await base.goToWebsite();
  await base.successfullLoad();
  loginPage = new LoginPage(page);
  chatbotPage = new ChatbotPage(page);
});

test("Test wrong username", async ({ page }) => {
  await loginPage.login("invalid", "admin123");
  await expect(
    page.getByText("Invalid username or password", { exact: true }),
  ).toBeVisible();
});

test("Test wrong password", async ({ page }) => {
  await loginPage.login("admin", "invalid");
  await expect(
    page.getByText("Invalid username or password", { exact: true }),
  ).toBeVisible();
});

test("Test wrong username and password", async ({ page }) => {
  await loginPage.login("invalid", "invalid");
  await expect(
    page.getByText("Invalid username or password", { exact: true }),
  ).toBeVisible();
});

test("Test valid login", async () => {
  await loginPage.successfullLogin();
});

test("Test send message and get answer @gh_actions", async ({ page }) => {
  await loginPage.successfullLogin();
  await chatbotPage.sendMessage("3+7");
  await expect(page.locator(".css-textHasAncestor-1jxf684").last()).toHaveText(
    "The result of (3 + 7) is (10).",
  );
});

test.skip("Test if importing files and summarizing works", async ({ page }) => {
  await loginPage.successfullLogin();

  const filePath = "./tests/TestCourseforUKSAP1000.pdf";
  await chatbotPage.importFiles(filePath);

  await page.waitForTimeout(3000);
  await chatbotPage.sendMessage("Please summarize the imported PDF document");

  await page.waitForTimeout(3000);
  await expect(page.locator(".css-textHasAncestor-1jxf684").last()).toHaveText(
    "The document appears to be about a training course titled “Test Course for UK SAP 1000,” scheduled for September 21-22, 2020. It includes sections on the course’s development rationale, expected outcomes, and a schedule for the event. Additionally, it mentions a “UK Virtual Training Session” and provides a link to a map for the location of the “Connected Learning Live Session.”",
  );
});
test("Test publish KA and GET UAL on Testnet", async () => {
  loadEnvFile('.env.testing.testnet.local');
  console.log("Testnet Environment loaded:", {
    network: process.env.DKG_BLOCKCHAIN,
    node: process.env.DKG_OTNODE_URL
  });

  await loginPage.successfullLogin();
  const ual = await chatbotPage.publishKA();
  await chatbotPage.getUAL(ual);
});
test("Test publish KA and GET UAL on Mainnet", async () => {
  loadEnvFile('.env.testing.mainnet.local');
  console.log("Mainnet Environment loaded:", {
    network: process.env.DKG_BLOCKCHAIN,
    node: process.env.DKG_OTNODE_URL
  });
  await loginPage.successfullLogin();
  const ual = await chatbotPage.publishKA();
  await chatbotPage.getUAL(ual);
});
