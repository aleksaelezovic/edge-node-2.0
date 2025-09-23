import { useCallback, useEffect } from "react";
import { router, Slot, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { McpContextProvider } from "@/client";
import { useAlerts } from "@/components/Alerts";

export default function ProtectedLayout() {
  const params = useGlobalSearchParams<{ code?: string; error?: string }>();
  const { showAlert } = useAlerts();

  const callback = useCallback(
    (error?: Error) => {
      SplashScreen.hide();

      if (!error) router.setParams({ code: undefined });
      else
        showAlert({
          type: "error",
          title: "MCP Error",
          message: error.message,
          timeout: 5000,
        });
    },
    [showAlert],
  );

  const errorCode = params.error;
  useEffect(() => {
    if (errorCode)
      callback(
        new Error(
          `Connection to the MCP Server failed with error code: "${errorCode}"\n` +
            "Try cleaning localStorage and going to the login page.",
        ),
      );
  }, [errorCode, callback]);

  const isLoginFlow = usePathname() === "/login" && !!params.code;

  return (
    <McpContextProvider
      autoconnect={
        errorCode || isLoginFlow
          ? false
          : {
              authorizationCode: params.code,
              callback,
            }
      }
      onMcpError={callback}
    >
      <Slot />
    </McpContextProvider>
  );
}
