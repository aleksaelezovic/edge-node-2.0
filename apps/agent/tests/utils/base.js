const { expect } = require("@playwright/test");

class Base {
  constructor(page) {
    this.page = page;
    this.lbl_logo = this.page.locator(
      '[src="/assets/?unstable_path=.%2Fsrc%2Fassets/logo.svg"]',
    );
  }

  async goToWebsite() {
    await this.page.goto("http://localhost:8081/login");
  }
  async successfullLoad() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.lbl_logo.waitFor({ state: "visible" });
    await expect(this.lbl_logo).toBeVisible();
    await expect(
      this.page.getByText("DKG Agent", { exact: true }),
    ).toBeVisible();
  }
}

module.exports = { Base };
