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
import { Slot, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";

import Background from "@/components/layout/Background";
import LayoutPill from "@/components/layout/LayoutPill";
import HeaderLogo from "@/components/layout/HeaderLogo";
import HeaderNav from "@/components/layout/HeaderNav";
import StarsIcon from "@/components/icons/StarsIcon";
import PoweredBy from "@/components/layout/PoweredBy";
import FooterLinks from "@/components/layout/FooterLinks";

import "../polyfills";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
  });
  const pathname = usePathname();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Background>
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
            {(Platform.OS === "web" || pathname !== "/login") && (
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
            )}

            <Slot />

            {Platform.OS === "web" && (
              <LayoutPill>
                <PoweredBy style={{ flex: 1, marginLeft: 32 }} />
                <FooterLinks style={{ flex: 1, marginRight: 32 }} />
              </LayoutPill>
            )}
          </View>
        </View>
      </Background>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
