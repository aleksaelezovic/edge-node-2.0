import { useColorScheme } from "./useColorScheme";

const darkTheme = {
  background: "#110734",
  text: "#FFFFFF",
  primary: "#6344DF",
  primaryText: "#FFFFFF",
  secondary: "#A8AAF9",
  card: "#6344DF33",
  cardText: "#A8AAF9",
  input: "#6344DF33",
  placeholder: "#DCDCDC",
};
const lightTheme: typeof darkTheme = {
  background: "#F8F7FC",
  text: "#000000",
  primary: "#6344DF",
  primaryText: "#FFFFFF",
  secondary: "#302A5C",
  card: "#FFFFFF",
  cardText: "#302A5C",
  input: "#E3DEFC",
  placeholder: "#766DAF",
};

export const Colors: Record<"light" | "dark", typeof darkTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

export default function useColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? "light"];
}
