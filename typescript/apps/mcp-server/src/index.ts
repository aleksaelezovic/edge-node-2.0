import { createPluginApi } from "@dkg/plugins";
import { z } from "@dkg/plugins/hono";
import authPlugin from "@dkg/plugin-auth";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
import { serve } from "@hono/node-server";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

import { version } from "../package.json";

const api = createPluginApi({
  name: "DKG API",
  version,
  context: {
    dkg: new DKG({
      endpoint: "http://localhost",
      port: "8900",
      blockchain: {
        name: "hardhat1:31337",
        privateKey:
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      },
      maxNumberOfRetries: 300,
      frequency: 2,
      contentType: "all",
      nodeApiVersion: "/v1",
    }),
  },
  plugins: [
    authPlugin({
      secret: "my-secret-key",
      schema: z.object({ username: z.string(), password: z.string() }),
      async login({ username, password }) {
        if (username !== "admin" || password !== "admin123") {
          throw new Error("Invalid credentials");
        }
        return ["mcp", "test123"];
      },
      requireAuthByDefault: false,
    }),
    examplePlugin.withNamespace("example"),
    swaggerPlugin({
      version,
      servers: [
        {
          url: "http://localhost:9200",
          description: "Local development server",
        },
      ],
    }),
  ],
});

const server = serve({
  fetch: api.fetch,
  port: 9200,
});
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
