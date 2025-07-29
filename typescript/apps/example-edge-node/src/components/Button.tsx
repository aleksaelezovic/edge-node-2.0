import { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SvgProps } from "react-native-svg";

import useColors, { Color } from "@/hooks/useColors";

export default function Button(props: {
  color: Color;
  flat?: boolean;
  icon?: (props: SvgProps) => ReactNode;
  iconMode?: "fill" | "stroke";
  text?: string;
  disabled?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const disabledColor = "#bdc3c7";
  const color = props.flat
    ? props.disabled
      ? disabledColor
      : colors[props.color]
    : props.color === "card"
      ? colors.cardText
      : props.color === "primary"
        ? colors.primaryText
        : colors.text;
  const backgroundColor = props.flat
    ? "transparent"
    : props.disabled
      ? disabledColor
      : colors[props.color];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        (!props.flat || !props.text) && { borderRadius: 50 },
        !props.flat && { padding: 12 },
        props.disabled || props.flat
          ? styles.buttonShadowDisabled
          : styles.buttonShadow,
        props.style,
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      {props.icon && (
        <props.icon
          {...{ [props.iconMode ?? "stroke"]: color }}
          height={18}
          width={18}
        />
      )}
      {props.text && (
        <Text style={[styles.buttonText, { color }]}>{props.text}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  buttonShadow: {
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonShadowDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Manrope_500Medium",
  },
});
