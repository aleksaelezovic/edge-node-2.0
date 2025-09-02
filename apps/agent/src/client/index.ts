import McpContextProvider, { useMcpContext } from "./McpContextProvider";
import { clientUri } from "./createTransport";

/**
 * Provided for backward compatibility.
 */
const useMcpClient = () => {
  const { mcp, connected, token } = useMcpContext();
  return { mcp, connected, token };
};

export { clientUri, McpContextProvider, useMcpContext, useMcpClient };
