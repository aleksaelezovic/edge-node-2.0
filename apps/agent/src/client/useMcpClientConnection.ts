import { useMemo, useRef, useCallback, useState } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";

import createTransport from "./createTransport";

const useMcpClientConnection = (mcpUrl: string) => {
  const mcp = useMemo(
    () => new Client({ name: "dkg-agent", version: "1.0.0" }),
    [],
  );
  const transportObj = useRef(createTransport(mcpUrl));

  const [connected, setConnected] = useState(false);

  const connect = useCallback(async () => {
    console.log("[MCP] Connecting...");
    try {
      await mcp.connect(transportObj.current.transport);
      setConnected(true);
      console.log(
        "[MCP] Connected to transport",
        transportObj.current.transport.sessionId,
      );
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        setConnected(false);
        console.log("[MCP] Unauthorized, trying to authorize...");
        return;
      }
      throw error;
    }
  }, [mcp]);

  const authorize = useCallback(
    async (authorizationCode: string) => {
      transportObj.current = createTransport(mcpUrl);
      await transportObj.current.transport.finishAuth(authorizationCode);
      console.log("[MCP] Authorization successful.");
    },
    [mcpUrl],
  );

  const getToken = useCallback(async () => {
    const token = await transportObj.current.authProvider.tokens();
    return token?.access_token;
  }, []);

  return { mcp, connect, connected, authorize, getToken };
};

export default useMcpClientConnection;
