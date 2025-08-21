/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, beforeEach } from "mocha";
import { expect } from "chai";
import dkgEssentialsPlugin from "../src/index.js";
import express from "express";

// Mock DKG context
const mockDkgContext = {
  dkg: {
    // Mock DKG instance with all required properties
    get: () => Promise.resolve({}),
    query: () => Promise.resolve([]),
    assertion: {
      get: () => Promise.resolve({}),
      create: () => Promise.resolve({}),
    },
    asset: {
      get: (ual: string, options?: any) => Promise.resolve({
        "public": {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Test Asset",
          "description": "Mock test asset data"
        },
        "metadata": {
          "UAL": ual,
          "createdAt": "2024-01-01T00:00:00Z"
        }
      }),
      create: (data: any, options?: any) => Promise.resolve({
        UAL: "did:dkg:otp:20430/0x123456/12345"
      }),
    },
    blockchain: {
      get: () => Promise.resolve({}),
    },
    node: {
      get: () => Promise.resolve({}),
    },
    graph: {
      query: () => Promise.resolve([]),
    },
    network: {
      get: () => Promise.resolve({}),
    },
    storage: {
      get: () => Promise.resolve({}),
    },
    paranet: {
      get: () => Promise.resolve({}),
    },
  },
};

function createMockMcpServer(): any {
  const registeredTools = new Map();
  const registeredResources = new Map();

  return {
    registerTool(
      name: string,
      config: Record<string, unknown>,
      handler: (...args: any[]) => any,
    ) {
      registeredTools.set(name, { ...config, handler });
      return this;
    },
    registerResource(
      name: string,
      template: any,
      config: Record<string, unknown>,
      handler: (...args: any[]) => any,
    ) {
      registeredResources.set(name, { template, config, handler });
      return this;
    },
    getRegisteredTools() {
      return registeredTools;
    },
    getRegisteredResources() {
      return registeredResources;
    },
  };
}

describe("@dkg/plugin-dkg-essentials checks", () => {
  let mockMcpServer: any;
  let apiRouter: express.Router;
  let app: express.Application;

  beforeEach(() => {
    mockMcpServer = createMockMcpServer();
    apiRouter = express.Router();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Initialize plugin
    dkgEssentialsPlugin(mockDkgContext, mockMcpServer, apiRouter);

    // Mount the router
    app.use("/", apiRouter);
  });

  describe("MCP Tool Registration", () => {
    it("should register the dkg-get tool", () => {
      const registeredTools = mockMcpServer.getRegisteredTools();
      expect(registeredTools.has("dkg-get")).to.equal(true);
    });

    it("should register the dkg-create tool", () => {
      const registeredTools = mockMcpServer.getRegisteredTools();
      expect(registeredTools.has("dkg-create")).to.equal(true);
    });

    it("should register exactly 2 tools", () => {
      const registeredTools = mockMcpServer.getRegisteredTools();
      expect(registeredTools.size).to.equal(2);
    });

    it("should have correct dkg-get tool configuration", () => {
      const dkgGetTool = mockMcpServer.getRegisteredTools().get("dkg-get");
      expect(dkgGetTool).to.not.equal(undefined);
      expect(dkgGetTool.title).to.equal("DKG Knowledge Asset get tool");
      expect(dkgGetTool.description).to.include("GET operation");
      expect(dkgGetTool.description).to.include("UAL");
      expect(dkgGetTool.inputSchema).to.not.equal(undefined);
    });

    it("should have correct dkg-create tool configuration", () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      expect(dkgCreateTool).to.not.equal(undefined);
      expect(dkgCreateTool.title).to.equal("DKG Knowledge Asset create tool");
      expect(dkgCreateTool.description).to.include("creating and publishing");
      expect(dkgCreateTool.description).to.include("JSON-LD");
      expect(dkgCreateTool.inputSchema).to.not.equal(undefined);
    });
  });

  describe("MCP Resource Registration", () => {
    it("should register the dkg-knowledge-asset resource", () => {
      const registeredResources = mockMcpServer.getRegisteredResources();
      expect(registeredResources.has("dkg-knowledge-asset")).to.equal(true);
    });

    it("should register the dkg-knowledge-collection resource", () => {
      const registeredResources = mockMcpServer.getRegisteredResources();
      expect(registeredResources.has("dkg-knowledge-collection")).to.equal(true);
    });

    it("should register exactly 2 resources", () => {
      const registeredResources = mockMcpServer.getRegisteredResources();
      expect(registeredResources.size).to.equal(2);
    });

    it("should have correct dkg-knowledge-asset resource configuration", () => {
      const assetResource = mockMcpServer.getRegisteredResources().get("dkg-knowledge-asset");
      expect(assetResource).to.not.equal(undefined);
      expect(assetResource.config.title).to.equal("DKG Knowledge Asset");
      expect(assetResource.config.description).to.include("Knowledge Assets");
      expect(assetResource.template).to.not.equal(undefined);
    });

    it("should have correct dkg-knowledge-collection resource configuration", () => {
      const collectionResource = mockMcpServer.getRegisteredResources().get("dkg-knowledge-collection");
      expect(collectionResource).to.not.equal(undefined);
      expect(collectionResource.config.title).to.equal("DKG Knowledge Collection");
      expect(collectionResource.config.description).to.include("Knowledge Collections");
      expect(collectionResource.template).to.not.equal(undefined);
    });
  });

  describe("DKG Get Tool Functionality", () => {
    it("should retrieve knowledge asset by UAL", async () => {
      const dkgGetTool = mockMcpServer.getRegisteredTools().get("dkg-get");
      const testUal = "did:dkg:otp:20430/0x123456/12345";
      
      const result = await dkgGetTool.handler({ ual: testUal });
      
      expect(result.content).to.be.an("array");
      expect(result.content[0].type).to.equal("text");
      expect(result.content[0].text).to.be.a("string");
      
      // Verify the returned data is valid JSON
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult).to.be.an("object");
      expect(parsedResult.public).to.exist;
      expect(parsedResult.metadata).to.exist;
    });

    it("should handle UAL parameter correctly", async () => {
      const dkgGetTool = mockMcpServer.getRegisteredTools().get("dkg-get");
      const testUal = "did:dkg:otp:20430/0x987654/54321";
      
      const result = await dkgGetTool.handler({ ual: testUal });
      const parsedResult = JSON.parse(result.content[0].text);
      
      expect(parsedResult.metadata.UAL).to.equal(testUal);
    });

    it("should format response as valid JSON", async () => {
      const dkgGetTool = mockMcpServer.getRegisteredTools().get("dkg-get");
      const result = await dkgGetTool.handler({ ual: "test-ual" });
      
      expect(() => JSON.parse(result.content[0].text)).to.not.throw();
    });
  });

  describe("DKG Create Tool Functionality", () => {
    it("should create knowledge asset with valid JSON-LD", async () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      const testJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Test Organization",
        "description": "A test organization"
      });
      
      const result = await dkgCreateTool.handler({ 
        jsonld: testJsonLd,
        privacy: "private"
      });
      
      expect(result.content).to.be.an("array");
      expect(result.content[0].type).to.equal("text");
      expect(result.content[0].text).to.include("Knowledge Asset collection successfully created");
      expect(result.content[0].text).to.include("UAL:");
      expect(result.content[0].text).to.include("DKG Explorer link:");
    });

    it("should default to private privacy when not specified", async () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      const testJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Test Person"
      });
      
      const result = await dkgCreateTool.handler({ jsonld: testJsonLd });
      
      expect(result.content[0].text).to.include("successfully created");
    });

    it("should handle public privacy setting", async () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      const testJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Test Event"
      });
      
      const result = await dkgCreateTool.handler({ 
        jsonld: testJsonLd,
        privacy: "public"
      });
      
      expect(result.content[0].text).to.include("successfully created");
    });

    it("should throw error when no JSON-LD content provided", async () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      
      try {
        await dkgCreateTool.handler({ jsonld: "" });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No JSON-LD content provided");
      }
    });

    it("should include UAL in response", async () => {
      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      const testJsonLd = JSON.stringify({ "@type": "Thing" });
      
      const result = await dkgCreateTool.handler({ jsonld: testJsonLd });
      
      expect(result.content[0].text).to.include("did:dkg:otp:20430/0x123456/12345");
    });
  });

  describe("Resource Handler Functionality", () => {
    it("should handle knowledge asset resource requests", async () => {
      const assetResource = mockMcpServer.getRegisteredResources().get("dkg-knowledge-asset");
      const mockUal = { href: "did:dkg:otp:20430/0x123456/12345" };
      
      const result = await assetResource.handler(mockUal);
      
      expect(result.contents).to.be.an("array");
      expect(result.contents[0].uri).to.equal(mockUal.href);
      expect(result.contents[0].text).to.be.a("string");
      
      // Verify the returned data is valid JSON
      const parsedResult = JSON.parse(result.contents[0].text);
      expect(parsedResult).to.be.an("object");
    });

    it("should handle knowledge collection resource requests", async () => {
      const collectionResource = mockMcpServer.getRegisteredResources().get("dkg-knowledge-collection");
      const mockUal = { href: "did:dkg:otp:20430/0x123456/collection" };
      
      const result = await collectionResource.handler(mockUal);
      
      expect(result.contents).to.be.an("array");
      expect(result.contents[0].uri).to.equal(mockUal.href);
      expect(result.contents[0].text).to.be.a("string");
    });

    it("should convert UAL href to lowercase", async () => {
      const assetResource = mockMcpServer.getRegisteredResources().get("dkg-knowledge-asset");
      const mockUal = { href: "DID:DKG:OTP:20430/0X123456/12345" };
      
      const result = await assetResource.handler(mockUal);
      
      expect(result.contents[0].uri).to.equal(mockUal.href);
      // The handler should call ctx.dkg.asset.get with lowercase UAL
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid JSON-LD in create tool", async () => {
      // Override mock to simulate error
      const originalCreate = mockDkgContext.dkg.asset.create;
      mockDkgContext.dkg.asset.create = () => {
        throw new Error("Invalid JSON-LD format");
      };

      const dkgCreateTool = mockMcpServer.getRegisteredTools().get("dkg-create");
      
      try {
        await dkgCreateTool.handler({ 
          jsonld: "invalid json",
          privacy: "private"
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Failed to create asset");
      }

      // Restore original mock
      mockDkgContext.dkg.asset.create = originalCreate;
    });

    it("should handle DKG service errors in get tool", async () => {
      // Override mock to simulate error
      const originalGet = mockDkgContext.dkg.asset.get;
      mockDkgContext.dkg.asset.get = () => {
        throw new Error("DKG service unavailable");
      };

      const dkgGetTool = mockMcpServer.getRegisteredTools().get("dkg-get");
      
      try {
        await dkgGetTool.handler({ ual: "test-ual" });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("DKG service unavailable");
      }

      // Restore original mock
      mockDkgContext.dkg.asset.get = originalGet;
    });
  });
});
