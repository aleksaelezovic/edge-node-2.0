import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { fetch } from "expo/fetch";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import AsyncStorageOAuthClientProvider from "./AsyncStorageOAuthClientProvider";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";

export const clientUri =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_APP_URL
    : Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      ? "exp://127.0.0.1:8081/--"
      : `${Constants.expoConfig?.scheme}://`;

const createTransport = () => {
  const authProvider = new AsyncStorageOAuthClientProvider(
    clientUri + "/chat",
    {
      redirect_uris: [clientUri + "/chat"],
      client_name: "DKG Agent",
      client_uri: clientUri,
      logo_uri: process.env.EXPO_PUBLIC_APP_URL + "/logo.png",
      scope: "mcp llm",
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
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(process.env.EXPO_PUBLIC_MCP_URL + "/mcp"),
    {
      fetch: (url, opts) => fetch(url.toString(), opts as any),
      authProvider,
    },
  );
  return { transport, authProvider };
};

export const useMcpClient = ({
  authorizationCode,
  onAuthorized,
}: {
  authorizationCode?: string;
  onAuthorized?: () => void;
}) => {
  const [connected, setConnected] = useState(false);
  const transportObj = useRef(createTransport());

  const mcp = useRef<Client>(
    new Client({ name: "dkg-agent", version: "1.0.0" }),
  );

  const getToken = useCallback(async () => {
    const token = await transportObj.current.authProvider.tokens();
    return token?.access_token;
  }, []);

  useEffect(() => {
    if (authorizationCode) {
      console.log("Exchanging authorization code for token...");
      transportObj.current = createTransport();
      transportObj.current.transport
        .finishAuth(authorizationCode)
        .then(() => {
          console.log("Auth finished");
          onAuthorized?.();
        })
        .catch((error) => {
          console.error("Error finishing auth: ", error.stack);
        });
    } else {
      console.log("Connecting to MCP...");
      mcp.current
        .connect(transportObj.current.transport)
        .then(() => {
          setConnected(true);
          console.log(
            "Connected to transport",
            transportObj.current.transport.sessionId,
          );
        })
        .catch((error) => {
          if (error instanceof UnauthorizedError) {
            console.log("Unauthorized, trying to authorize...");
            return;
          }
          console.log("Error connecting to MCP: ", error.message);
          SplashScreen.hide();
        });
    }
  }, [authorizationCode, onAuthorized, transportObj]);

  return { connected, mcp, getToken };
};
