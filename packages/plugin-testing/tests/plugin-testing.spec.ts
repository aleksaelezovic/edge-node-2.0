/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import pluginTestingPlugin from "../src/index.js";
import express from "express";
import request from "supertest";

// Mock DKG context
const mockDkgContext = {
  dkg: {
    get: () => Promise.resolve({}),
    query: () => Promise.resolve([]),
    assertion: {
      get: () => Promise.resolve({}),
      create: () => Promise.resolve({}),
    },
    asset: {
      get: () => Promise.resolve({}),
      create: () => Promise.resolve({}),
    },
    blockchain: { get: () => Promise.resolve({}) },
    node: { get: () => Promise.resolve({}) },
    graph: { query: () => Promise.resolve([]) },
    network: { get: () => Promise.resolve({}) },
    storage: { get: () => Promise.resolve({}) },
    paranet: { get: () => Promise.resolve({}) },
  },
};

// Mock MCP server
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

describe("@dkg/plugin-testing checks", function () {
  let mockMcpServer: any;
  let apiRouter: express.Router;
  let app: express.Application;

  this.timeout(5000);

  beforeEach(() => {
    mockMcpServer = createMockMcpServer();
    apiRouter = express.Router();
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Initialize plugin
    pluginTestingPlugin(mockDkgContext, mockMcpServer, apiRouter);
    app.use("/", apiRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Plugin Configuration", () => {
    it("should create plugin without errors", () => {
      expect(pluginTestingPlugin).to.be.a("function");
    });
  });

  describe("Core Functionality", () => {
    it("should register the add tool", () => {
      const registeredTools = mockMcpServer.getRegisteredTools();
      expect(registeredTools.size).to.equal(1);
      expect(registeredTools.has("add")).to.equal(true);
    });

    it("should have correct tool configuration", () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      expect(addTool).to.not.equal(undefined);
      expect(addTool.title).to.equal("Addition Tool");
      expect(addTool.description).to.equal("Add two numbers");
      expect(addTool.inputSchema).to.not.equal(undefined);
    });

    it("should correctly add positive numbers", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      const result = await addTool.handler({ a: 5, b: 3 });
      expect(result.content).to.be.an("array");
      expect(result.content[0].text).to.equal("8");
    });

    it("should correctly add decimal numbers", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      const result = await addTool.handler({ a: 10.5, b: 2.3 });
      expect(result.content[0].text).to.equal("12.8");
    });

    it("should correctly add negative numbers", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      const result = await addTool.handler({ a: -5, b: 8 });
      expect(result.content[0].text).to.equal("3");
    });

    it("should respond to GET /add with correct result", async () => {
      const response = await request(app).get("/add?a=5&b=3").expect(200);
      expect(response.body.result).to.equal(8);
    });

    it("should handle decimal numbers in API", async () => {
      const response = await request(app).get("/add?a=10.5&b=2.3").expect(200);
      expect(response.body.result).to.equal(12.8);
    });

    it("should handle negative numbers in API", async () => {
      const response = await request(app).get("/add?a=-5&b=8").expect(200);
      expect(response.body.result).to.equal(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid tool parameters", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      
      try {
        await addTool.handler({ a: "invalid", b: "invalid" });
        expect.fail("Should have thrown an error for invalid parameters");
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });

    it("should handle missing tool parameters", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      
      try {
        await addTool.handler({ a: 5 }); // Missing 'b' parameter
        expect.fail("Should have thrown an error for missing parameters");
      } catch (error) {
        expect(error).to.be.an("error");
      }
    });

    it("should return 400 for missing API parameters", async () => {
      await request(app).get("/add").expect(400);
    });

    it("should return 400 for invalid API parameters", async () => {
      await request(app).get("/add?a=invalid&b=3").expect(400);
    });

    it("should handle malformed API requests", async () => {
      await request(app).get("/add?invalid=query").expect(400);
    });

    it("should handle non-numeric API parameters gracefully", async () => {
      await request(app).get("/add?a=text&b=moretext").expect(400);
    });
  });
});
