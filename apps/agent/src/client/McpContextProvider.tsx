import {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { toError } from "@/shared/errors";

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
      onError?.(toError(error));
    }
  }, [autoconnect, connected, connect, authorizationCode, authorize, onError]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    onConnectedChange?.(connected);
  }, [connected, onConnectedChange]);

  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (connected)
      intervalRef.current = setInterval(
        // Expecting to error when token is expired / revoked
        () => mcp.ping().catch(() => null),
        5000,
      );
    else if (intervalRef.current) clearInterval(intervalRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connected, mcp]);

  return (
    <McpContext.Provider value={{ mcp, getToken, connected }}>
      {children}
    </McpContext.Provider>
  );
}
