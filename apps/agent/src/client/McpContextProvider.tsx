import {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useCallback,
} from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import useMcpClientConnection from "./useMcpClientConnection";

const McpContext = createContext<{
  mcp: Client;
  connected: boolean;
  getToken: () => Promise<string | undefined>;
}>({
  mcp: new Client({ name: "dkg-agent", version: "1.0.0" }),
  connected: false,
  getToken: async () => undefined,
});

export const useMcpContext = () => useContext(McpContext);

export default function McpContextProvider({
  authorizationCode,
  autoconnect = true,
  onConnectedChange,
  onError,
  children,
}: PropsWithChildren<{
  authorizationCode: string | null;
  autoconnect?: boolean;
  onConnectedChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}>) {
  const { mcp, connect, connected, authorize, getToken } =
    useMcpClientConnection(process.env.EXPO_PUBLIC_MCP_URL + "/mcp");

  const init = useCallback(async () => {
    try {
      if (connected) return;
      if (authorizationCode) await authorize(authorizationCode);
      if (autoconnect) await connect();
    } catch (error) {
      onError?.(
        error instanceof Error ? error : new Error(`Unknown: ${error}`),
      );
    }
  }, [autoconnect, connected, connect, authorizationCode, authorize, onError]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    onConnectedChange?.(connected);
  }, [connected, onConnectedChange]);

  return (
    <McpContext.Provider value={{ mcp, getToken, connected }}>
      {children}
    </McpContext.Provider>
  );
}
