import path from "node:path";
import dotenv from "dotenv";
import { createPluginServer, defaultPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import authPlugin, { authorized } from "@dkg/plugin-oauth";
import examplePlugin from "@dkg/plugin-example";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

import webInterfacePlugin from "./webInterfacePlugin";

dotenv.config();

const app = createPluginServer({
  name: "DKG API",
  version: "1.0.0",
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
    defaultPlugin,
    authPlugin({
      issuerUrl: new URL(process.env.EXPO_PUBLIC_MCP_URL),
      scopesSupported: ["scope123", "mcp"],
      schema: z.object({
        username: z.string(),
        password: z.string(),
      }),
      async login(credentials) {
        if (
          credentials.username === "admin" &&
          credentials.password === "admin123"
        ) {
          return { scopes: ["mcp", "scope123"] };
        }
        throw new Error("Invalid credentials");
      },
      loginPageUrl: new URL(process.env.EXPO_PUBLIC_APP_URL + "/login"),
    }),
    (_, __, api) => {
      api.use("/mcp", authorized(["mcp"]));
    },
    examplePlugin.withNamespace("protected", {
      middlewares: [authorized(["scope123"])], // Allow only users with the "scope123" scope
    }),
    webInterfacePlugin(path.join(__dirname, "./app")),
  ],
});

const port = 9200;
const server = app.listen(port, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${port}/`);

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
});
