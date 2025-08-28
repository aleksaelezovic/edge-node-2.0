# DKG Plugin Testing Guide

**All plugin submissions must include tests to be accepted.** This guide shows you how to write them quickly and correctly.

## Why Testing Matters

Tests ensure your plugin works reliably and won't break when integrated with other plugins. They also make your plugin more trustworthy to the community! Don't worry - we've made it simple with copy-paste templates.

**Testing:** We require 3 minimum test categories for acceptance, but **the more comprehensive your testing, the better!** High-quality plugins with extensive test coverage are more trusted by the community.

## Quick Setup

### 1. Add Test Dependencies

Install testing packages:

```bash
npm install --save-dev mocha chai sinon supertest
npm install --save-dev @types/chai @types/mocha @types/sinon @types/supertest
```

Then add the test script to your `package.json`:

```json
{
  "scripts": {
    "test": "mocha 'tests/**/*.spec.ts'"
  }
}
```

### 2. Create Test File

Create `tests/your-plugin.spec.ts` and copy this template:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */

// Import testing libraries
import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import yourPlugin from "../src/index.js"; // ← Replace with your plugin
import express from "express";
import request from "supertest";

// Copy this DKG mock (required for all plugins)
const mockDkgContext = {
  dkg: {
    get: () => Promise.resolve({}),
    query: () => Promise.resolve([]),
    assertion: { get: () => Promise.resolve({}), create: () => Promise.resolve({}) },
    asset: { get: () => Promise.resolve({}), create: () => Promise.resolve({}) },
    blockchain: { get: () => Promise.resolve({}) },
    node: { get: () => Promise.resolve({}) },
    graph: { query: () => Promise.resolve([]) },
    network: { get: () => Promise.resolve({}) },
    storage: { get: () => Promise.resolve({}) },
    paranet: { get: () => Promise.resolve({}) },
  },
};

// Copy this MCP server mock (required for all plugins)
function createMockMcpServer(): any {
  const registeredTools = new Map();
  const registeredResources = new Map();

  return {
    registerTool(name: string, config: Record<string, unknown>, handler: (...args: any[]) => any) {
      registeredTools.set(name, { ...config, handler });
      return this;
    },
    registerResource(name: string, template: any, config: Record<string, unknown>, handler: (...args: any[]) => any) {
      registeredResources.set(name, { template, config, handler });
      return this;
    },
    getRegisteredTools() { return registeredTools; },
    getRegisteredResources() { return registeredResources; },
  };
}

// Your main test setup (customize the plugin name)
describe("@dkg/your-plugin checks", function () {
  let mockMcpServer: any;
  let apiRouter: express.Router;
  let app: express.Application;

  this.timeout(5000);

  beforeEach(() => {
    // Setup test environment
    mockMcpServer = createMockMcpServer();
    apiRouter = express.Router();
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Initialize YOUR plugin here (replace yourPlugin with your actual plugin)
    yourPlugin(mockDkgContext, mockMcpServer, apiRouter);
    app.use("/", apiRouter);
  });

  afterEach(() => {
    sinon.restore(); // Cleanup after each test
  });

  // Add your test sections here (see below)
});
```

### 3. Add Tests

Now add **at least** these 3 required test sections inside your `describe` block. Feel free to add more tests - the more comprehensive your testing, the better!

#### A. Plugin Configuration Tests (Required)

Test that your plugin initializes correctly. GitHub Actions is flexible - any of these patterns work:

```typescript
// Any of these work:
describe("Plugin Configuration", () => {
  it("should create plugin with valid configuration", () => {
    const plugin = yourPlugin({ apiKey: "test-key" });
    expect(plugin).to.be.a("function");
  });
});

// Or just initialize your plugin in beforeEach:
beforeEach(() => {
  yourPlugin(mockDkgContext, mockMcpServer, apiRouter); // This counts!
});

// Or test plugin creation:
it("should create plugin with valid configuration", () => {
  expect(() => yourPlugin(config)).to.not.throw();
});
```

#### B. Core Functionality Tests (Required)

Test your plugin's main purpose - whatever it does. You can use ANY of these section names:

```typescript
// Any of these section names work:
describe("MCP Tool Registration", () => { ... });
describe("MCP Tool Functionality", () => { ... });
describe("API Endpoints", () => { ... });
describe("Login Endpoint", () => { ... });
describe("Core Functionality", () => { ... });
// Or any section with "Registration" or "Functionality" in the name

describe("MCP Tool Registration", () => {
  it("should register tools", () => {
    const tools = mockMcpServer.getRegisteredTools();
    expect(tools.has("your-tool-name")).to.equal(true);
  });
});

describe("API Endpoints", () => {
  it("should respond correctly", async () => {
    const response = await request(app).get("/your-endpoint").expect(200);
    expect(response.body).to.have.property("expectedField");
  });
});
```

#### C. Error Handling Tests (Required)

Test error scenarios. GitHub Actions accepts ANY of these patterns:

```typescript
// Any of these work:
describe("Error Handling", () => { ... });

// Or tests that check for errors anywhere in your test file:
it("should return 400 for missing parameters", async () => {
  await request(app).get("/endpoint").expect(400);
});

it("should handle invalid parameters", async () => {
  await request(app).get("/endpoint?invalid=data").expect(400);
});

it("should fail gracefully", async () => {
  try {
    await yourPlugin.someMethod("invalid-input");
    expect.fail("Should have thrown error");
  } catch (error) {
    expect(error.message).to.include("expected error");
  }
});
```

#### D. Additional Tests (Recommended)

The 3 test categories above are the **minimum requirements**. For high-quality plugins, consider adding:

```typescript
// 💡 More comprehensive testing examples:

describe("Edge Cases", () => {
  it("should handle very large inputs", async () => {
    // Test with large data sets
  });
  
  it("should handle special characters", async () => {
    // Test with unusual characters
  });
});

describe("Performance", () => {
  it("should respond quickly", async () => {
    // Test response times
  });
});

describe("Integration", () => {
  it("should work with other plugins", async () => {
    // Test plugin interactions
  });
});

describe("Security", () => {
  it("should validate inputs properly", async () => {
    // Test input sanitization
  });
});
```

**The more tests you write, the more trustworthy your plugin becomes!**

## Real Example

**See a complete working example at `packages/plugin-example/tests/addition.spec.ts`**

## Quick Checklist

Before submitting your plugin, check that you have:

**Setup:**
- [ ] Installed test dependencies (`npm install --save-dev mocha chai sinon supertest @types/chai @types/mocha @types/sinon @types/supertest`)
- [ ] Added test script to `package.json`
- [ ] Created `tests/your-plugin.spec.ts` file
- [ ] Removed any `express` or `@types/express` from devDependencies

**Required Test Content:**
- [ ] Plugin configuration tests (plugin initializes correctly)
- [ ] Core functionality tests (your plugin's main purpose)
- [ ] Error handling tests (handles errors gracefully)
- [ ] Additional tests for better quality (optional but recommended)

**Technical:**
- [ ] All tests pass: `npm test`
- [ ] Tests run under 60 seconds
- [ ] Tests follow the template structure

If all boxes are checked, your plugin is ready for submission!

 **Automated Validation**: GitHub Actions will automatically check ALL requirements when you submit a PR. If ANY requirement is not met, your PR will be BLOCKED until you fix the issues!
