/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import blobsPlugin from "../src/plugins/blobs.js";
import {
  createExpressApp,
  createInMemoryBlobStorage,
  createMcpServerClientPair,
  createMockDkgClient,
} from "@dkg/plugins/testing";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import express from "express";
import request from "supertest";
import { Blob } from "buffer";

// Mock DKG context
const mockDkgContext = {
  dkg: createMockDkgClient(),
  blob: createInMemoryBlobStorage(),
};

describe("@dkg/plugin-dkg-essentials blobs checks", () => {
  let mockMcpServer: McpServer;
  let mockMcpClient: Client;
  let apiRouter: express.Router;
  let app: express.Application;

  beforeEach(async () => {
    const { server, client, connect } = await createMcpServerClientPair();
    mockMcpServer = server;
    mockMcpClient = client;
    apiRouter = express.Router();

    // Setup Express app
    app = createExpressApp();

    // Initialize plugin
    blobsPlugin(mockDkgContext, mockMcpServer, apiRouter);
    await connect();

    // Mount the router
    app.use("/", apiRouter);
  });

  describe("MCP Tool Registration", () => {
    it("should register the upload tool", async () => {
      const tools = await mockMcpClient.listTools().then((t) => t.tools);

      expect(tools.some((t) => t.name === "upload")).to.equal(true);
    });

    it("should register exactly 1 tool", async () => {
      const tools = await mockMcpClient.listTools().then((t) => t.tools);

      expect(tools.length).to.equal(1);
    });

    it("should have correct upload tool configuration", async () => {
      const tools = await mockMcpClient.listTools().then((t) => t.tools);
      const uploadTool = tools.find((t) => t.name === "upload");

      expect(uploadTool).to.not.equal(undefined);
      expect(uploadTool!.title).to.equal("Upload File");
      expect(uploadTool!.description).to.include("Upload a file to the MCP server");
      expect(uploadTool!.inputSchema).to.not.equal(undefined);
    });
  });

  describe("MCP Resource Registration", () => {
    it("should register the blob resource", async () => {
      const resources = await mockMcpClient
        .listResourceTemplates()
        .then((r) => r.resourceTemplates);

      expect(resources.some((r) => r.name === "blob")).to.equal(true);
    });

    it("should register exactly 1 resource", async () => {
      const resources = await mockMcpClient
        .listResourceTemplates()
        .then((r) => r.resourceTemplates);

      expect(resources.length).to.equal(1);
    });

    it("should have correct blob resource configuration", async () => {
      const resources = await mockMcpClient
        .listResourceTemplates()
        .then((r) => r.resourceTemplates);
      const blobResource = resources.find((r) => r.name === "blob");

      expect(blobResource).to.not.equal(undefined);
      expect(blobResource!.title).to.equal("Blob");
      expect(blobResource!.description).to.equal("A blob resource");
      expect(blobResource!.uriTemplate).to.equal("dkg-blob://{id}");
    });
  });

  describe("MCP Upload Tool Functionality", () => {
    it("should upload file with base64 content", async () => {
      const testContent = "Hello, World!";
      const base64Content = Buffer.from(testContent).toString("base64");
      
      const result = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "test.txt",
          fileBase64: base64Content,
          mimeType: "text/plain",
        },
      });

      expect(result.content).to.be.an("array");
      expect((result.content as any[])[0].type).to.equal("text");
      expect((result.content as any[])[0].text).to.include("File was successfully uploaded with ID:");
    });

    it("should upload file without mimeType", async () => {
      const testContent = "Test content";
      const base64Content = Buffer.from(testContent).toString("base64");
      
      const result = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "test.txt",
          fileBase64: base64Content,
        },
      });

      expect(result.content).to.be.an("array");
      expect((result.content as any[])[0].text).to.include("successfully uploaded");
    });

    it("should handle binary file upload", async () => {
      const testContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const base64Content = testContent.toString("base64");
      
      const result = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "test.png",
          fileBase64: base64Content,
          mimeType: "image/png",
        },
      });

      expect(result.content).to.be.an("array");
      expect((result.content as any[])[0].text).to.include("successfully uploaded");
    });

    it("should generate unique IDs for different uploads", async () => {
      const testContent = "Test content";
      const base64Content = Buffer.from(testContent).toString("base64");
      
      const result1 = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "test1.txt",
          fileBase64: base64Content,
        },
      });

      const result2 = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "test2.txt",
          fileBase64: base64Content,
        },
      });

      const id1 = (result1.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
      const id2 = (result2.content as any[])[0].text.match(/ID: (.+)$/)?.[1];

      expect(id1).to.not.equal(id2);
      expect(id1).to.be.a("string");
      expect(id2).to.be.a("string");
    });
  });

  describe("MCP Resource Handler Functionality", () => {
    it("should retrieve blob content via resource", async () => {
      // First upload a file
      const testContent = "Resource test content";
      const base64Content = Buffer.from(testContent).toString("base64");
      
      const uploadResult = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "resource-test.txt",
          fileBase64: base64Content,
        },
      });

      const blobId = (uploadResult.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
      expect(blobId).to.not.be.undefined;

      // Then retrieve it via resource
      const resourceUri = `dkg-blob://${blobId}`;
      const result = await mockMcpClient.readResource({ uri: resourceUri });

      expect(result.contents).to.be.an("array");
      expect(result.contents[0].uri).to.equal(resourceUri);
      expect(result.contents[0].text).to.equal(testContent);
    });

    it("should handle non-existent blob resource", async () => {
      const nonExistentUri = "dkg-blob://non-existent-id";
      
      try {
        await mockMcpClient.readResource({ uri: nonExistentUri });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).to.include("Resource not found");
      }
    });

    it("should handle malformed blob URI", async () => {
      const malformedUri = "dkg-blob://";
      
      try {
        await mockMcpClient.readResource({ uri: malformedUri });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).to.include(`Resource ${malformedUri} not found`);
      }
    });
  });

  describe("HTTP API Endpoints", () => {
    describe("POST /blob", () => {
      it("should upload file via HTTP multipart", async () => {
        const testContent = "HTTP upload test";
        const buffer = Buffer.from(testContent);

        const response = await request(app)
          .post("/blob")
          .attach("file", buffer, "http-test.txt")
          .expect(201);

        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("name", "http-test.txt");
        expect(response.body.id).to.be.a("string");
      });

      it("should upload file with mimeType detection", async () => {
        const testContent = "console.log('Hello, World!');";
        const buffer = Buffer.from(testContent);

        const response = await request(app)
          .post("/blob")
          .attach("file", buffer, "script.js")
          .expect(201);

        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("name", "script.js");
        expect(response.body).to.have.property("mimeType");
      });

    //   it("should handle missing file field", async () => {
    //     const response = await request(app)
    //       .post("/blob")
    //       .expect(400);

    //     expect(response.body).to.have.property("error");
    //   });

      it("should handle blob storage errors", async () => {
        // Mock blob storage to throw error
        const originalCreate = mockDkgContext.blob.create;
        mockDkgContext.blob.create = () => {
          throw new Error("Storage error");
        };

        const testContent = "Error test";
        const buffer = Buffer.from(testContent);

        const response = await request(app)
          .post("/blob")
          .attach("file", buffer, "error-test.txt")
          .expect(500);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.include("Failed to create blob");

        // Restore original mock
        mockDkgContext.blob.create = originalCreate;
      });
    });

    describe("PUT /blob/:id", () => {
      it("should update existing blob", async () => {
        // First create a blob
        const originalContent = "Original content";
        const originalBuffer = Buffer.from(originalContent);
        
        const createResponse = await request(app)
          .post("/blob")
          .attach("file", originalBuffer, "update-test.txt")
          .expect(201);

        const blobId = createResponse.body.id;

        // Then update it
        const newContent = "Updated content";
        const newBuffer = Buffer.from(newContent);

        await request(app)
          .put(`/blob/${blobId}`)
          .attach("file", newBuffer, "updated-test.txt")
          .expect(200);

        // Verify the update
        const resourceUri = `dkg-blob://${blobId}`;
        const result = await mockMcpClient.readResource({ uri: resourceUri });
        expect(result.contents[0].text).to.equal(newContent);
      });

      it("should create new blob with specific ID", async () => {
        const testContent = "New blob with ID";
        const buffer = Buffer.from(testContent);
        const customId = "custom-blob-id";

        await request(app)
          .put(`/blob/${customId}`)
          .attach("file", buffer, "custom.txt")
          .expect(200);

        // Verify the blob exists
        const resourceUri = `dkg-blob://${customId}`;
        const result = await mockMcpClient.readResource({ uri: resourceUri });
        expect(result.contents[0].text).to.equal(testContent);
      });

      it("should handle invalid file field name", async () => {
        const testContent = "Invalid field test";
        const buffer = Buffer.from(testContent);

        const response = await request(app)
          .put("/blob/test-id")
          .attach("invalid-field", buffer, "test.txt")
          .expect(400);

        expect(response.body).to.have.property("error", "Invalid file name");
      });

      it("should handle blob storage errors on update", async () => {
        // Mock blob storage to throw error
        const originalPut = mockDkgContext.blob.put;
        mockDkgContext.blob.put = () => {
          throw new Error("Update error");
        };

        const testContent = "Update error test";
        const buffer = Buffer.from(testContent);

        const response = await request(app)
          .put("/blob/test-id")
          .attach("file", buffer, "error-test.txt")
          .expect(500);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.include("Failed to update blob");

        // Restore original mock
        mockDkgContext.blob.put = originalPut;
      });
    });

    describe("DELETE /blob/:id", () => {
      it("should delete existing blob", async () => {
        // First create a blob
        const testContent = "Delete test content";
        const buffer = Buffer.from(testContent);
        
        const createResponse = await request(app)
          .post("/blob")
          .attach("file", buffer, "delete-test.txt")
          .expect(201);

        const blobId = createResponse.body.id;

        // Verify it exists
        const resourceUri = `dkg-blob://${blobId}`;
        await mockMcpClient.readResource({ uri: resourceUri });

        // Delete it
        await request(app)
          .delete(`/blob/${blobId}`)
          .expect(200);

        // Verify it's deleted
        try {
          await mockMcpClient.readResource({ uri: resourceUri });
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect((error as Error).message).to.include("Resource not found");
        }
      });

    //   it("should handle deletion of non-existent blob", async () => {
    //     const response = await request(app)
    //       .delete("/blob/non-existent-id")
    //       .expect(500);

    //     expect(response.body).to.have.property("error");
    //     expect(response.body.error).to.include("Failed to delete blob");
    //   });

      it("should handle blob storage errors on deletion", async () => {
        // Mock blob storage to throw error
        const originalDelete = mockDkgContext.blob.delete;
        mockDkgContext.blob.delete = () => {
          throw new Error("Delete error");
        };

        const response = await request(app)
          .delete("/blob/test-id")
          .expect(500);

        expect(response.body).to.have.property("error");
        expect(response.body.error).to.include("Failed to delete blob");

        // Restore original mock
        mockDkgContext.blob.delete = originalDelete;
      });
    });
  });

  describe("Error Handling", () => {
    // it("should handle malformed base64 in upload tool", async () => {
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "test.txt",
    //       fileBase64: "invalid-base64!@#",
    //     },
    //   });

    //   expect(result.isError).to.be.true;
    //   expect((result.content as any[])[0].text).to.include("Failed to upload file");
    // });

    it("should handle empty filename in upload tool", async () => {
      const testContent = "Test content";
      const base64Content = Buffer.from(testContent).toString("base64");
      
      const result = await mockMcpClient.callTool({
        name: "upload",
        arguments: {
          filename: "",
          fileBase64: base64Content,
        },
      });

      expect(result.content).to.be.an("array");
      expect((result.content as any[])[0].text).to.include("successfully uploaded");
    });

    // it("should handle blob storage errors in upload tool", async () => {
    //   // Mock blob storage to throw error
    //   const originalCreate = mockDkgContext.blob.create;
    //   mockDkgContext.blob.create = () => {
    //     throw new Error("Storage creation error");
    //   };

    //   const testContent = "Error test";
    //   const base64Content = Buffer.from(testContent).toString("base64");
      
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "error-test.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   expect(result.isError).to.be.true;
    //   expect((result.content as any[])[0].text).to.include("Failed to upload file");

    //   // Restore original mock
    //   mockDkgContext.blob.create = originalCreate;
    // });
  });

  describe("Console Logging", () => {
    let consoleErrorSpy: sinon.SinonSpy;

    beforeEach(() => {
      consoleErrorSpy = sinon.spy(console, "error");
    });

    afterEach(() => {
      consoleErrorSpy.restore();
    });

    // it("should log error on blob update failure", async () => {
    //   // Mock blob storage to throw error
    //   const originalPut = mockDkgContext.blob.put;
    //   mockDkgContext.blob.put = () => {
    //     throw new Error("Test update error");
    //   };

    //   const testContent = "Error test";
    //   const buffer = Buffer.from(testContent);

    //   await request(app)
    //     .put("/blob/test-id")
    //     .attach("file", buffer, "error-test.txt")
    //     .expect(500);

    //   expect(consoleErrorSpy.calledOnce).to.be.true;
    //   expect((consoleErrorSpy.firstCall.args as any[])[0]).to.equal("Test update error");

    //   // Restore original mock
    //   mockDkgContext.blob.put = originalPut;
    // });

//     it("should log error on blob deletion failure", async () => {
//       // Mock blob storage to throw error
//       const originalDelete = mockDkgContext.blob.delete;
//       mockDkgContext.blob.delete = () => {
//         throw new Error("Test delete error");
//       };

//       await request(app)
//         .delete("/blob/test-id")
//         .expect(500);

//       expect(consoleErrorSpy.calledOnce).to.be.true;
//       expect((consoleErrorSpy.firstCall.args as any[])[0]).to.equal("Test delete error");

//       // Restore original mock
//       mockDkgContext.blob.delete = originalDelete;
//     });
  });

  describe("Edge Cases and Validation", () => {
    // it("should handle very large file upload", async () => {
    //   // Create a large content (1MB)
    //   const largeContent = "A".repeat(1024 * 1024);
    //   const base64Content = Buffer.from(largeContent).toString("base64");
      
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "large-file.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   expect(result.content).to.be.an("array");
    //   expect((result.content as any[])[0].text).to.include("successfully uploaded");
    // });

    // it("should handle special characters in filename", async () => {
    //   const testContent = "Special chars test";
    //   const base64Content = Buffer.from(testContent).toString("base64");
      
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "test@#$%^&*()_+-=[]{}|;':\",./<>?.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   expect(result.content).to.be.an("array");
    //   expect((result.content as any[])[0].text).to.include("successfully uploaded");
    // });

    // it("should handle unicode content", async () => {
    //   const unicodeContent = "Hello 世界 🌍 测试";
    //   const base64Content = Buffer.from(unicodeContent, "utf8").toString("base64");
      
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "unicode-test.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   expect(result.content).to.be.an("array");
    //   expect((result.content as any[])[0].text).to.include("successfully uploaded");

    //   // Verify content can be retrieved correctly
    //   const blobId = (result.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
    //   const resourceUri = `dkg-blob://${blobId}`;
    //   const retrieveResult = await mockMcpClient.readResource({ uri: resourceUri });
    //   expect(retrieveResult.contents[0].text).to.equal(unicodeContent);
    // });

    // it("should handle empty file content", async () => {
    //   const emptyContent = "";
    //   const base64Content = Buffer.from(emptyContent).toString("base64");
      
    //   const result = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "empty.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   expect(result.content).to.be.an("array");
    //   expect((result.content as any[])[0].text).to.include("successfully uploaded");

    //   // Verify empty content can be retrieved
    //   const blobId = (result.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
    //   const resourceUri = `dkg-blob://${blobId}`;
    //   const retrieveResult = await mockMcpClient.readResource({ uri: resourceUri });
    //   expect(retrieveResult.contents[0].text).to.equal("");
    // });

    // it("should handle various MIME types", async () => {
    //   const mimeTypes = [
    //     "text/plain",
    //     "application/json",
    //     "image/png",
    //     "application/pdf",
    //     "video/mp4",
    //     "audio/mpeg",
    //   ];

    //   for (const mimeType of mimeTypes) {
    //     const testContent = `Content for ${mimeType}`;
    //     const base64Content = Buffer.from(testContent).toString("base64");
        
    //     const result = await mockMcpClient.callTool({
    //       name: "upload",
    //       arguments: {
    //         filename: `test.${mimeType.split("/")[1]}`,
    //         fileBase64: base64Content,
    //         mimeType,
    //       },
    //     });

    //     expect(result.content).to.be.an("array");
    //     expect((result.content as any[])[0].text).to.include("successfully uploaded");
    //   }
    // });
  });

  describe("Integration Tests", () => {
    // it("should support complete file lifecycle", async () => {
    //   const testContent = "Lifecycle test content";
    //   const base64Content = Buffer.from(testContent).toString("base64");
      
    //   // 1. Upload via MCP tool
    //   const uploadResult = await mockMcpClient.callTool({
    //     name: "upload",
    //     arguments: {
    //       filename: "lifecycle-test.txt",
    //       fileBase64: base64Content,
    //     },
    //   });

    //   const blobId = (uploadResult.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
    //   expect(blobId).to.not.be.undefined;

    //   // 2. Retrieve via MCP resource
    //   const resourceUri = `dkg-blob://${blobId}`;
    //   const retrieveResult = await mockMcpClient.readResource({ uri: resourceUri });
    //   expect(retrieveResult.contents[0].text).to.equal(testContent);

    //   // 3. Update via HTTP PUT
    //   const updatedContent = "Updated lifecycle content";
    //   const updatedBuffer = Buffer.from(updatedContent);
      
    //   await request(app)
    //     .put(`/blob/${blobId}`)
    //     .attach("file", updatedBuffer, "updated-lifecycle.txt")
    //     .expect(200);

    //   // 4. Verify update via MCP resource
    //   const updatedRetrieveResult = await mockMcpClient.readResource({ uri: resourceUri });
    //   expect(updatedRetrieveResult.contents[0].text).to.equal(updatedContent);

    //   // 5. Delete via HTTP DELETE
    //   await request(app)
    //     .delete(`/blob/${blobId}`)
    //     .expect(200);

    //   // 6. Verify deletion
    //   try {
    //     await mockMcpClient.readResource({ uri: resourceUri });
    //     expect.fail("Should have thrown an error");
    //   } catch (error) {
    //     expect((error as Error).message).to.include("Resource not found");
    //   }
    // });

    // it("should support multiple concurrent uploads", async () => {
    //   const uploadPromises = Array.from({ length: 5 }, (_, i) => {
    //     const content = `Concurrent upload ${i}`;
    //     const base64Content = Buffer.from(content).toString("base64");
        
    //     return mockMcpClient.callTool({
    //       name: "upload",
    //       arguments: {
    //         filename: `concurrent-${i}.txt`,
    //         fileBase64: base64Content,
    //       },
    //     });
    //   });

    //   const results = await Promise.all(uploadPromises);
      
    //   expect(results).to.have.length(5);
    //   results.forEach((result, i) => {
    //     expect(result.content).to.be.an("array");
    //     expect((result.content as any[])[0].text).to.include("successfully uploaded");
    //   });

    //   // Verify all files can be retrieved
    //   const retrievePromises = results.map((result) => {
    //     const blobId = (result.content as any[])[0].text.match(/ID: (.+)$/)?.[1];
    //     return mockMcpClient.readResource({ uri: `dkg-blob://${blobId}` });
    //   });

    //   const retrieveResults = await Promise.all(retrievePromises);
    //   expect(retrieveResults).to.have.length(5);
    //   retrieveResults.forEach((result, i) => {
    //     expect(result.contents[0].text).to.equal(`Concurrent upload ${i}`);
    //   });
    // });
  });
});
