import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type DkgContext = any;
type DkgPlugin = (ctx: DkgContext, mcp: McpServer) => void;

export const defineDkgPlugin = (plugin: DkgPlugin) => plugin;
