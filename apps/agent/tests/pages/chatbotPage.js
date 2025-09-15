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
    await this.page.waitForSelector(
      'text="Your Knowledge Asset has been successfully created on the Decentralized Knowledge Graph (DKG). Here are the details:"',
      { timeout: 120000 },
    );
    await expect(
      this.page.locator(".css-textHasAncestor-1jxf684").nth(1),
    ).toHaveText(
      "Your Knowledge Asset has been successfully created on the Decentralized Knowledge Graph (DKG). Here are the details:",
    );
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
    // Accept both text variations for Knowledge Asset retrieval
    await expect(
      this.page.locator(".css-textHasAncestor-1jxf684").nth(12),
    ).toHaveText(
      /(The Knowledge Asset you requested has been retrieved from the Decentralized Knowledge Graph \(DKG\)\. Here's a summary of its key components:|Here is a summary of the Knowledge Asset retrieved from the Decentralized Knowledge Graph \(DKG\)):?/
    );
  }
}

module.exports = { ChatbotPage };
