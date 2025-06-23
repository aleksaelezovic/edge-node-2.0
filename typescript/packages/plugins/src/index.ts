import { Hono, MiddlewareHandler } from "hono";
import { describeRoute } from "hono-openapi";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcp } from "./registerMcp";

//@ts-ignore
import type DKG from "dkg.js";

export type DkgContext = {
  dkg: DKG;
};
export type DkgPlugin = (ctx: DkgContext, mcp: McpServer, api: Hono) => void;
export type DkgPluginBuilderMethods = {
  withNamespace: (
    namespace: string,
    options?: { middlewares: MiddlewareHandler[] },
  ) => DkgPluginBuilder;
};
export type DkgPluginBuilder = DkgPlugin & DkgPluginBuilderMethods;

export const defineDkgPlugin = (plugin: DkgPlugin): DkgPluginBuilder =>
  Object.assign(plugin, {
    withNamespace(
      namespace: string,
      options?: { middlewares: MiddlewareHandler[] },
    ) {
      return defineDkgPlugin((ctx, mcp, api) => {
        const router = new Hono();
        router.use(describeRoute({ tags: [namespace] }));
        options?.middlewares.forEach((m) => router.use(m));

        plugin(ctx, mcp, router);
        api.route("/" + namespace, router);
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
  const api = new Hono();
  plugins.forEach((plugin) =>
    plugin(context, new McpServer({ name, version }), api),
  );
  registerMcp(api, () => {
    const server = new McpServer({ name, version });
    plugins.forEach((plugin) => plugin(context, server, new Hono()));
    return server;
  });
  return api;
};
