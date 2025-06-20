import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcp } from "./registerMcp";

type DkgContext = any;
type DkgPlugin = (ctx: DkgContext, mcp: McpServer, api: Hono) => void;

export const defineDkgPlugin = (plugin: DkgPlugin) => plugin;

export const createPluginApi = ({
  name,
  version,
  plugins,
  engineUrl,
}: {
  name: string;
  version: string;
  plugins: DkgPlugin[];
  engineUrl: string;
}) => {
  const ctx = { engineUrl }; // TODO:
  const api = new Hono();
  registerMcp(api, () => {
    const server = new McpServer({ name, version });
    plugins.forEach((plugin) => plugin(ctx, server, new Hono()));
    return server;
  });
  plugins.forEach((plugin) =>
    plugin(ctx, new McpServer({ name, version }), api),
  );
  return api;
};
