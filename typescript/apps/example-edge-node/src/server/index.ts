import path from "node:path";
import dotenv from "dotenv";
import { createPluginServer, defaultPlugin } from "@dkg/plugins";
import { authorized, createOAuthPlugin } from "@dkg/plugin-oauth";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

import { userCredentialsSchema } from "@/shared/auth";
import { verify } from "@node-rs/argon2";

import webInterfacePlugin from "./webInterfacePlugin";
import {
  drizzle,
  migrate,
  users,
  SqliteOAuthStorageProvider,
} from "./database/sqlite";
import { eq } from "drizzle-orm";

dotenv.config();
if (process.argv.includes("--dev"))
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.development.local"),
    override: true,
  });

const db = drizzle(process.env.DATABASE_URL);
migrate(db, {
  migrationsFolder: path.resolve(process.cwd(), "./drizzle/sqlite"),
});

const version = "1.0.0";

const { oauthPlugin, openapiSecurityScheme } = createOAuthPlugin({
  storage: new SqliteOAuthStorageProvider(db),
  issuerUrl: new URL(process.env.EXPO_PUBLIC_MCP_URL),
  scopesSupported: ["mcp", "llm", "scope123"],
  loginPageUrl: new URL(process.env.EXPO_PUBLIC_APP_URL + "/login"),
  schema: userCredentialsSchema,
  async login(credentials) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, credentials.username))
      .then((r) => r.at(0));
    if (!user) throw new Error("Invalid credentials");

    const isValid = await verify(user.password, credentials.password);
    if (!isValid) throw new Error("Invalid credentials");

    return { scopes: user.scope.split(" ") };
  },
});

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
    defaultPlugin,
    oauthPlugin,
    (_, __, api) => {
      api.use("/mcp", authorized(["mcp"]));
      api.use("/llm", authorized(["llm"]));
    },
    examplePlugin.withNamespace("protected", {
      middlewares: [authorized(["scope123"])], // Allow only users with the "scope123" scope
    }),
    // NOTE: WIP!
    swaggerPlugin({
      version,
      securitySchemes: { oauth2: openapiSecurityScheme },
      servers: [
        {
          url: process.env.EXPO_PUBLIC_MCP_URL,
          description: "DKG Node MCP Plugins Server",
        },
      ],
    }),
    webInterfacePlugin(path.join(__dirname, "./app")),
  ],
});

const port = process.env.PORT || 9200;
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
