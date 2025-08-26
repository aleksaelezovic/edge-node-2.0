/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it } from "mocha";
import { expect } from "chai";
import examplePlugin from "../src/index.js";
import express from "express";
import request from "supertest";

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
      get: () => Promise.resolve({}),
      create: () => Promise.resolve({}),
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

  return {
    registerTool(
      name: string,
      config: Record<string, unknown>,
      handler: (...args: any[]) => any,
    ) {
      registeredTools.set(name, { ...config, handler });
      return this;
    },
    getRegisteredTools() {
      return registeredTools;
    },
  };
}

describe("@dkg/plugin-example checks", () => {
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
    examplePlugin(mockDkgContext, mockMcpServer, apiRouter);

    // Mount the router
    app.use("/", apiRouter);
  });

  describe("MCP Tool Registration", () => {
    it("should register the add tool", () => {
      const registeredTools = mockMcpServer.getRegisteredTools();
      expect(registeredTools.size).to.equal(1);
      expect(registeredTools.has("add")).to.equal(true);
    });

    it("should have correct tool configuration", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      expect(addTool).to.not.equal(undefined);
      expect(addTool.title).to.equal("Addition Tool");
      expect(addTool.description).to.equal("Add two numbers");
      expect(addTool.inputSchema).to.not.equal(undefined);
    });
  });

  describe("MCP Tool Functionality", () => {
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

    it("should correctly add zeros", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      const result = await addTool.handler({ a: 0, b: 0 });

      expect(result.content[0].text).to.equal("0");
    });

    it("should include knowledge assets in response", async () => {
      const addTool = mockMcpServer.getRegisteredTools().get("add");
      const result = await addTool.handler({ a: 1, b: 1 });

      expect(result.content).to.have.length.greaterThan(1);
      expect(result.content[1]).to.not.equal(undefined);
    });
  });

  describe("API Endpoint Functionality", () => {
    it("should respond to GET /add with correct result", async () => {
      const response = await request(app).get("/add?a=5&b=3").expect(200);

      expect(response.body.result).to.equal(8);
    });

    it("should handle decimal numbers", async () => {
      const response = await request(app).get("/add?a=10.5&b=2.3").expect(200);

      expect(response.body.result).to.equal(12.8);
    });

    it("should handle negative numbers", async () => {
      const response = await request(app).get("/add?a=-5&b=8").expect(200);

      expect(response.body.result).to.equal(3);
    });

    it("should handle zero values", async () => {
      const response = await request(app).get("/add?a=0&b=0").expect(200);

      expect(response.body.result).to.equal(0);
    });

    it("should return 400 for missing parameters", async () => {
      await request(app).get("/add").expect(400);
    });

    it("should return 400 for invalid parameters", async () => {
      await request(app).get("/add?a=invalid&b=3").expect(400);
    });
  });
});
