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
import { Image } from "expo-image";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import useColors from "@/hooks/useColors";

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
            <View
              style={{
                height: 80,
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "100%",
                  borderRadius: 40,
                  backgroundColor: colors.card,
                }}
              >
                <View
                  style={{
                    paddingLeft: 16,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    width: 200,
                    height: 80,
                  }}
                >
                  <Image
                    source={require("../assets/logo.svg")}
                    style={{
                      width: 40,
                      height: 40,
                      marginRight: 8,
                      display: "flex",
                    }}
                  />
                  <Text
                    style={{
                      textAlign: "left",
                      color: colors.text,
                      fontFamily: "SpaceGrotesk_400Regular",
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    DKG Agent
                  </Text>
                </View>
              </View>
            </View>
            <Slot />
            <View
              style={{
                height: 80,
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "100%",
                  borderRadius: 40,
                  backgroundColor: colors.card,
                }}
              ></View>
            </View>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
