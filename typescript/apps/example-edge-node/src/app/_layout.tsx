import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import useColors from "@/hooks/useColors";

import LayoutPill from "@/components/layout/LayoutPill";
import HeaderLogo from "@/components/layout/HeaderLogo";
import HeaderNav from "@/components/layout/HeaderNav";
import StarsIcon from "@/components/icons/StarsIcon";

import "../polyfills";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = useColors();
  const safeAreaInsets = useSafeAreaInsets();
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 20,
            marginTop: safeAreaInsets.top,
            marginBottom: safeAreaInsets.bottom,
            marginLeft: safeAreaInsets.left,
            marginRight: safeAreaInsets.right,
          }}
        >
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 1200,
              marginHorizontal: "auto",
            }}
          >
            <LayoutPill>
              <HeaderLogo
                image={require("../assets/logo.svg")}
                text="DKG Agent"
                textFont="SpaceGrotesk_400Regular"
                style={{ flex: 1 }}
              />

              <HeaderNav style={{ flex: 1 }}>
                <HeaderNav.Link href="/chat" text="Chat" icon={StarsIcon} />
              </HeaderNav>

              <View style={{ flex: 1 }} />
            </LayoutPill>

            <Slot />

            <LayoutPill>
              <View style={{ flex: 1 }} />
              <View style={{ flex: 1 }} />
            </LayoutPill>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
