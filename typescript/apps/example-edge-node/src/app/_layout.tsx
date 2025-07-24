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
import { Text, View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import useColors from "@/hooks/useColors";

import LayoutPill from "@/components/layout/LayoutPill";
import HeaderLogo from "@/components/layout/HeaderLogo";
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

              <View
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <StarsIcon height={18} width={18} stroke={colors.cardText} />
                  <Text
                    style={{
                      color: colors.cardText,
                      fontFamily: "Manrope_600SemiBold",
                      fontWeight: "600",
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                  >
                    Chat
                  </Text>
                </View>
              </View>

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
