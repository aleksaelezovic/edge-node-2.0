import type { Context, Hono } from "hono";
import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { describeRoute } from "hono-openapi";

export const registerMcp = (api: Hono, getServer: () => McpServer) => {
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  const handleSessionRequest = async (c: Context) => {
    const sessionId = c.req.header("Mcp-Session-Id")?.toString() ?? "";
    if (!sessionId || !transports[sessionId]) {
      return c.text("Invalid or missing session ID", 400);
    }

    const transport = transports[sessionId];
    const { req, res } = toReqRes(c.req.raw);
    await transport.handleRequest(req, res);
    return toFetchResponse(res);
  };

  api
    .post(
      "/mcp",
      describeRoute({
        description: "MCP Server JSON-RPC Endpoint",
        tags: ["MCP"],
      }),
      async (c) => {
        const sessionId = c.req.header("Mcp-Session-Id")?.toString() ?? "";
        const body = await c.req.json();
        let transport = transports[sessionId];
        if (!transport && isInitializeRequest(body)) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              transports[sessionId] = transport!;
            },
          });
          transport.onerror = console.error.bind(console);
          transport.onclose = () => {
            if (transport?.sessionId) {
              delete transports[transport.sessionId];
            }
          };
          await getServer().connect(transport);
        }
        if (!transport) {
          return c.json(
            {
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "Bad Request: No valid session ID provided",
              },
              id: null,
            },
            400,
          );
        }

        const { req, res } = toReqRes(c.req.raw);
        await transport.handleRequest(req, res, body);
        return toFetchResponse(res);
      },
    )
    .get(
      describeRoute({ description: "Get Session Information", tags: ["MCP"] }),
      handleSessionRequest,
    )
    .delete(
      describeRoute({ description: "Delete Session", tags: ["MCP"] }),
      handleSessionRequest,
    );
};
