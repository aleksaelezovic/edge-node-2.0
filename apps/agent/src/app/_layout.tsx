import "../polyfills";
import { PropsWithChildren, useCallback } from "react";
import { View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { router, Slot, useGlobalSearchParams, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import Background from "@/components/layout/Background";
import { McpContextProvider } from "@/client";
import Alerts, { useAlerts } from "@/components/Alerts";
import Container from "@/components/layout/Container";

SplashScreen.preventAutoHideAsync();

const McpProvider = ({ children }: PropsWithChildren) => {
  const params = useGlobalSearchParams<{ code?: string }>();
  const isLogin = usePathname() === "/login";

  const { showAlert } = useAlerts();

  const onConnectedChange = useCallback((connected: boolean) => {
    if (connected) {
      SplashScreen.hide();
      router.setParams({ code: undefined });
    }
  }, []);

  const onError = useCallback(
    (error: Error) => {
      SplashScreen.hide();

      showAlert({
        type: "error",
        title: "MCP Error",
        message: error.message,
        timeout: 5000,
      });
    },
    [showAlert],
  );

  return (
    <McpContextProvider
      authorizationCode={!isLogin && params.code ? params.code : null}
      onConnectedChange={onConnectedChange}
      onError={onError}
      autoconnect={!isLogin}
    >
      {children}
    </McpContextProvider>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_800ExtraBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Alerts.Provider>
        <McpProvider>
          <Background>
            <View
              style={{
                position: "absolute",
                top: 100,
                width: "100%",
                zIndex: 10000,
              }}
            >
              <Container>
                <Alerts
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    alignItems: "flex-end",
                  }}
                />
              </Container>
            </View>
            <Slot />
          </Background>
          <StatusBar style="auto" />
        </McpProvider>
      </Alerts.Provider>
    </ThemeProvider>
  );
}
