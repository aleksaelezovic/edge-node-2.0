const { expect } = require("@playwright/test");

class LoginPage {
  constructor(page) {
    this.page = page;
    this.input_email = this.page.locator('[placeholder="Email"]');
    this.input_password = this.page.locator('[placeholder="Password"]');
    this.btn_login = this.page.locator(".r-transitionProperty-1i6wzkk");
  }

  async login(email, password) {
    await this.input_email.fill(email);
    await this.input_password.fill(password);
    await this.btn_login.click();
  }
  async successfullLogin() {
    await this.login("admin", "admin123");
    await expect(
      this.page.locator('[placeholder="Ask anything..."]'),
    ).toBeVisible();
  }
}

module.exports = { LoginPage };
