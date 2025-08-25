import McpContextProvider, { useMcpContext } from "./McpContextProvider";
import { clientUri } from "./createTransport";

/**
 * Provided for backward compatibility.
 */
const useMcpClient = () => {
  const { mcp, connected, getToken } = useMcpContext();
  return { mcp, connected, getToken };
};

export { clientUri, McpContextProvider, useMcpContext, useMcpClient };
