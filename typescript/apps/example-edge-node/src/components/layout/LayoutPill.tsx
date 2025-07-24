import { PropsWithChildren } from "react";
import { View } from "react-native";

import useThemeColor from "@/hooks/useThemeColor";

export default function LayoutPill(props: PropsWithChildren) {
  const cardColor = useThemeColor("card");

  return (
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
          backgroundColor: cardColor,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {props.children}
      </View>
    </View>
  );
}
