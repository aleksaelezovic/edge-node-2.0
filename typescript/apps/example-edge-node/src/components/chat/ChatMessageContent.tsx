import { Text } from "react-native";
import { Image } from "expo-image";
import type { MessageContentComplex } from "@langchain/core/messages";

import useThemeColor from "@/hooks/useThemeColor";

export default function ChatMessageContent({
  content: c,
}: {
  content: MessageContentComplex;
}) {
  const textColor = useThemeColor("text");

  if (c.type === "text" && c.text) {
    return (
      <Text
        style={{
          color: textColor,
          fontFamily: "Manrope_400Regular",
          fontSize: 16,
          paddingTop: 4,
        }}
      >
        {c.text}
      </Text>
    );
  }
  if (c.type === "image_url") {
    return <Image source={{ uri: c.image_url?.url ?? c.image_url }} />;
  }
  return null;
}
