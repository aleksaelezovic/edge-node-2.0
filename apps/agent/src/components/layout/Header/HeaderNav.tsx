import { router, Href } from "expo-router";
import { View, Text, StyleProp, ViewStyle, Pressable } from "react-native";

import type { PropsWithChildren, ReactNode } from "react";
import type { SvgProps } from "react-native-svg";

import useThemeColor from "@/hooks/useThemeColor";

function HeaderNavLink(props: {
  icon: (props: SvgProps) => ReactNode;
  text: string;
  href?: Href;
}) {
  const cardTextColor = useThemeColor("cardText");

  return (
    <Pressable
      onPress={() => (props.href ? router.navigate(props.href) : undefined)}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <props.icon height={18} width={18} stroke={cardTextColor} />
      <Text
        style={{
          color: cardTextColor,
          fontFamily: "Manrope_600SemiBold",
          fontWeight: "600",
          fontSize: 16,
          lineHeight: 24,
        }}
      >
        {props.text}
      </Text>
    </Pressable>
  );
}

function HeaderNav(props: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}

HeaderNav.Link = HeaderNavLink;

export default HeaderNav;
