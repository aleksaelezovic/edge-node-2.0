import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcp } from "./registerMcp";

//@ts-ignore
import type DKG from "dkg.js";

type DkgContext = {
  dkg: DKG;
};
type DkgPlugin = (ctx: DkgContext, mcp: McpServer, api: Hono) => void;

export const defineDkgPlugin = (plugin: DkgPlugin) => plugin;

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
  registerMcp(api, () => {
    const server = new McpServer({ name, version });
    plugins.forEach((plugin) => plugin(context, server, new Hono()));
    return server;
  });
  plugins.forEach((plugin) =>
    plugin(context, new McpServer({ name, version }), api),
  );
  return api;
};
