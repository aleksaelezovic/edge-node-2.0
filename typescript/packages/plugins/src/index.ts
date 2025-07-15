import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcp } from "./registerMcp";

//@ts-ignore
import type DKG from "dkg.js";

export type DkgContext = {
  dkg: DKG;
};
export type DkgPlugin = (
  ctx: DkgContext,
  mcp: McpServer,
  api: express.Router,
) => void;
export type DkgPluginBuilderMethods = {
  withNamespace: (
    namespace: string,
    options?: { middlewares: express.Handler[] },
  ) => DkgPluginBuilder;
};
export type DkgPluginBuilder = DkgPlugin & DkgPluginBuilderMethods;

export const defineDkgPlugin = (plugin: DkgPlugin): DkgPluginBuilder =>
  Object.assign(plugin, {
    withNamespace(
      namespace: string,
      options?: { middlewares: express.Handler[] },
    ) {
      return defineDkgPlugin((ctx, mcp, api) => {
        const router = express.Router();
        options?.middlewares.forEach((m) => router.use(m));

        plugin(ctx, mcp, router);
        api.use("/" + namespace, router);
      });
    },
  } satisfies DkgPluginBuilderMethods);

export const defaultPlugin = defineDkgPlugin((ctx, mcp, api) => {
  api.use(express.json());
  api.use(express.urlencoded());
  api.use(
    cors({
      allowedHeaders: "*",
      exposedHeaders: "*",
    }),
  );
  api.use(morgan("tiny"));
  api.use(compression());

  api.get("/health", (_, res) => {
    res.status(200).json({ status: "ok" });
  });
});

export const createPluginServer = ({
  name,
  version,
  context,
  plugins,
}: {
  name: string;
  version: string;
  context: DkgContext;
  plugins: DkgPlugin[];
}) => {
  const server = express();
  server.disable("x-powered-by");
  plugins.forEach((plugin) =>
    plugin(context, new McpServer({ name, version }), server),
  );
  registerMcp(server, () => {
    const mcp = new McpServer({ name, version });
    plugins.forEach((plugin) => plugin(context, mcp, express.Router()));
    return mcp;
  });
  return server;
};
