import { StyleSheet } from "react-native";

const formStyles = StyleSheet.create({
  // loginCard: {
  //   width: "100%",
  //   maxWidth: 450,
  //   padding: 15,
  // },
  title: {
    fontSize: 40,
    fontWeight: 700,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {},
  input: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 45,
    fontSize: 16,
    marginBottom: 16,
  },
  errorContainer: {
    marginVertical: 8,
    marginHorizontal: 8,
    height: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default formStyles;
