import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { fetch } from "expo/fetch";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import AsyncStorageOAuthClientProvider from "./AsyncStorageOAuthClientProvider";
import { router } from "expo-router";

const mcp = new Client({ name: "edge-node-agent", version: "1.0.0" });

const clientUri =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_APP_URL
    : Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      ? "exp://127.0.0.1:8081/--"
      : `${Constants.expoConfig?.scheme}://`;

const transport = new StreamableHTTPClientTransport(
  new URL(process.env.EXPO_PUBLIC_MCP_URL + "/mcp"),
  {
    fetch: (url, opts) => fetch(url.toString(), opts as any),
    authProvider: new AsyncStorageOAuthClientProvider(
      clientUri + "/chat",
      {
        redirect_uris: [clientUri + "/chat"],
        client_name: "Edge Node Agent",
        client_uri: clientUri,
        logo_uri: process.env.EXPO_PUBLIC_APP_URL + "/logo.png",
        scope: "mcp",
      },
      async (url) => {
        if (Platform.OS !== "web") {
          url = await fetch(url.toString()).then((r) => new URL(r.url));

          if (url.origin === process.env.EXPO_PUBLIC_APP_URL) {
            console.log("Local redirect...", url.pathname + url.search);
            router.navigate({
              pathname: (url.pathname + url.search) as any,
            });
            return;
          }
        }

        console.log("Redirecting to a web URL...", url.toString());
        await Linking.openURL(url.toString());
      },
    ),
  },
);

export { mcp, transport, clientUri };
