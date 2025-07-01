import express from "express";
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

export const createPluginApi = ({
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
  const api = express();
  plugins.forEach((plugin) =>
    plugin(context, new McpServer({ name, version }), api),
  );
  registerMcp(api, () => {
    const server = new McpServer({ name, version });
    plugins.forEach((plugin) => plugin(context, server, express.Router()));
    return server;
  });
  return api;
};
