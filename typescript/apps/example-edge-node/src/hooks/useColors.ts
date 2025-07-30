import { useMemo } from "react";

import { useColorScheme } from "./useColorScheme";

const darkTheme = {
  background: "#1F2E7E33",
  text: "#FFFFFF",
  primary: "#6344DF",
  primaryText: "#FFFFFF",
  secondary: "#A8AAF9",
  card: "#0C0C0C33",
  cardText: "#A8AAF9",
  input: "#0C0C0C33",
  placeholder: "#DCDCDC",
  error: "#FF0000",
};
const lightTheme: typeof darkTheme = {
  background: "#F8F8F8",
  text: "#000000",
  primary: "#6344DF",
  primaryText: "#FFFFFF",
  secondary: "#302A5C",
  card: "#FFFFFF",
  cardText: "#302A5C",
  input: "#E3DEFC",
  placeholder: "#766DAF",
  error: "#E74C3C",
};

export type Color = keyof typeof darkTheme;

export const Colors: Record<"light" | "dark", typeof darkTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

export default function useColors() {
  const colorScheme = useColorScheme();

  return useMemo(() => {
    const colors = Colors[colorScheme ?? "light"];
    const getTextColor = (backgroundColor: Color) => {
      return backgroundColor === "card"
        ? colors.cardText
        : backgroundColor === "primary"
          ? colors.primaryText
          : colors.text;
    };
    return {
      ...colors,
      getTextColor,
    };
  }, [colorScheme]);
}
