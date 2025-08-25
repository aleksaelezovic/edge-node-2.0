import "../polyfills";
import { useCallback } from "react";
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

SplashScreen.preventAutoHideAsync();

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

  const params = useGlobalSearchParams<{ code?: string }>();
  const isLogin = usePathname() === "/login";

  const onConnectedChange = useCallback((connected: boolean) => {
    if (connected) {
      SplashScreen.hide();
      router.setParams({ code: undefined });
    }
  }, []);

  const onError = useCallback((error: Error) => {
    console.error("MCP ERROR:", error.message);
    SplashScreen.hide();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <McpContextProvider
        authorizationCode={!isLogin && params.code ? params.code : null}
        onConnectedChange={onConnectedChange}
        onError={onError}
        autoconnect={!isLogin}
      >
        <Background>
          <Slot />
        </Background>
        <StatusBar style="auto" />
      </McpContextProvider>
    </ThemeProvider>
  );
}
