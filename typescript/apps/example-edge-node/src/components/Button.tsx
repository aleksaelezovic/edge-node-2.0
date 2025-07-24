import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";

import useColors from "@/hooks/useColors";

export default function Button(props: {
  color: "primary";
  text: string;
  disabled?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        props.disabled && styles.buttonDisabled,
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      <Text style={[styles.buttonText, { color: colors.primaryText }]}>
        {props.text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 45,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
  },
});
