import path from "path";
import { createPluginServer, defaultPlugin } from "@dkg/plugins";
import { authorized, createOAuthPlugin } from "@dkg/plugin-oauth";
import dkgEssentialsPlugin from "@dkg/plugin-dkg-essentials";
import createFsBlobStorage from "@dkg/plugin-dkg-essentials/createFsBlobStorage";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

import { userCredentialsSchema } from "@/shared/auth";
import { verify } from "@node-rs/argon2";

import { configDatabase, configEnv } from "./helpers";
import webInterfacePlugin from "./webInterfacePlugin";
import { users, SqliteOAuthStorageProvider } from "./database/sqlite";
import { eq } from "drizzle-orm";

configEnv();
const db = configDatabase();

const version = "1.0.0";

const { oauthPlugin, openapiSecurityScheme } = createOAuthPlugin({
  storage: new SqliteOAuthStorageProvider(db),
  issuerUrl: new URL(process.env.EXPO_PUBLIC_MCP_URL),
  scopesSupported: ["mcp", "llm", "scope123", "blob"],
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

    return { scopes: user.scope.split(" "), extra: { userId: user.id } };
  },
});

const blobStorage = createFsBlobStorage(path.join(__dirname, "../data"));

const otnodeUrl = new URL(process.env.DKG_OTNODE_URL);

const app = createPluginServer({
  name: "DKG API",
  version,
  context: {
    blob: blobStorage,
    dkg: new DKG({
      endpoint: `${otnodeUrl.protocol}//${otnodeUrl.hostname}`,
      port: otnodeUrl.port || "8900",
      blockchain: {
        name: process.env.DKG_BLOCKCHAIN,
        privateKey: process.env.DKG_PUBLISH_WALLET,
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
      api.use("/blob", authorized(["blob"]));
    },
    dkgEssentialsPlugin,
    examplePlugin.withNamespace("protected", {
      middlewares: [authorized(["scope123"])], // Allow only users with the "scope123" scope
    }),
    swaggerPlugin({
      version,
      securitySchemes: {
        oauth2: openapiSecurityScheme,
        bearer: { type: "http", scheme: "bearer" },
      },
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
