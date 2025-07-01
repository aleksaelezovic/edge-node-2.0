import { createPluginServer } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import authPlugin, { authorized } from "@dkg/plugin-auth";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

import { version } from "../package.json";

const app = createPluginServer({
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
      secret: "my-secret-key", // Secret key for JWT token generation
      schema: z.object({
        username: z.string().openapi({ example: "admin" }),
        password: z.string().openapi({ example: "admin123" }),
      }),
      async login({ username, password }) {
        // Allows logging in with default credentials, username: "admin", password: "admin123"
        // Change this as needed
        if (username !== "admin" || password !== "admin123") {
          throw new Error("Invalid credentials");
        }
        return ["mcp", "scope123"]; // Scopes that the user has access to
      },
      requireAuthByDefault: false,
    }),
    examplePlugin.withNamespace("protected", {
      middlewares: [authorized(["scope123"])], // Allow only users with the "scope123" scope
    }),
    swaggerPlugin({
      version,
      servers: [
        {
          url: "http://localhost:9200",
          description: "Local development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    }),
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
