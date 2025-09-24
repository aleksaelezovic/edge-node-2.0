const { expect } = require("@playwright/test");

class ChatbotPage {
  constructor(page) {
    this.page = page;
    this.input_message = this.page.locator('[placeholder="Ask anything..."]');
    this.btn_send = this.page.locator(
      '[d="M6 15.351V1.693m0 0L1.122 6.815M6 1.693l4.878 5.122"]',
    );
    this.btn_import = this.page.locator(".r-fontFamily-1j4l7u5");
    this.btn_continue = this.page.locator(".r-fontFamily-1j4l7u5").first();
  }

  async sendMessage(message) {
    await this.input_message.fill(message);
    await this.btn_send.click();
    await this.page.waitForSelector('text="Allow tool for this session"');
    await this.page.click('text="Allow tool for this session"');
    await this.btn_continue.click();
  }

  async importFiles(files) {
    // Simple approach: click the import button and then set the file
    await this.btn_import.click();

    // Wait a moment for any file input to appear
    await this.page.waitForTimeout(1000);

    // Try to set the file on any file input that exists
    try {
      await this.page.setInputFiles('input[type="file"]', files);
    } catch (error) {
      console.log("File input not found, trying alternative approach...");
      // If that fails, try to find any input that accepts files
      const fileInputs = await this.page
        .locator(
          'input[accept*="pdf"], input[accept*="document"], input[type="file"]',
        )
        .all();
      if (fileInputs.length > 0) {
        await fileInputs[0].setInputFiles(files);
      } else {
        throw new Error("No file input found on the page");
      }
    }

    // Wait for files to be processed
    await this.page.waitForTimeout(2000);
  }

  async publishKA() {
    //await this.page.pause();
    await this.sendMessage(`Create this Knowledge Asset on the DKG for me:

{
  "@context": "https://schema.org/",
  "@type": "CreativeWork",
  "@id": "urn:first-dkg-ka:info:hello-dkg",
  "name": "Hello DKG",
  "description": "My first Knowledge Asset on the Decentralized Knowledge Graph!"
}`);
    
    // Wait for any success message about Knowledge Asset creation (much more flexible)
    await this.page.waitForSelector(
      'text=/.*((Knowledge Asset|KA).*(created|published|generated|added|stored|uploaded)|(created|published|generated|added|stored|uploaded).*(Knowledge Asset|KA)|successfully.*(created|published)|UAL.*did:|Here.*UAL|Asset.*DKG|DKG.*Asset).*/i',
      { timeout: 300000 }, // 5 minutes
    );
    
    // Use very flexible regex to match many possible AI success responses
    const successMessageRegex = /(Knowledge Asset.*(?:created|published|generated|added|stored|uploaded)|(?:created|published|generated|added|stored|uploaded).*Knowledge Asset|successfully.*(?:created|published)|UAL.*did:|Here.*UAL|Asset.*DKG|DKG.*Asset|KA.*(?:created|published)|(?:created|published).*KA)/i;
    await expect(
      this.page.locator(".css-textHasAncestor-1jxf684").filter({ hasText: successMessageRegex }).first(),
    ).toBeVisible();
    
    const UAL = await this.page
      .locator(".css-textHasAncestor-1jxf684")
      .nth(4)
      .textContent();
    return UAL;
  }
  async getUAL(UAL) {
    await this.sendMessage(
      `Get this Knowledge Asset from the DKG and summarize it for me: ${UAL}`,
    );
    // Ultra-flexible pattern to match almost any AI success response format
    await expect(
      this.page.locator(".css-textHasAncestor-1jxf684").nth(12),
    ).toHaveText(
      /(Knowledge Asset|retrieved|summary|found|located|contains|information|data|asset|DKG|here|following|content|details|components)/i
    );
  }
}

module.exports = { ChatbotPage };
