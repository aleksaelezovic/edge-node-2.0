import { Text, View } from "react-native";
import { Image } from "expo-image";

import { ChatMessage as ChatMessageType } from "@/shared/chat";
import useColors from "@/hooks/useColors";

import UserIcon from "./UserIcon";
import AssistantIcon from "./AssistantIcon";
import ToolCall from "./ToolCall";

export default function ChatMessage({
  message: m,
}: {
  message: ChatMessageType;
}) {
  const colors = useColors();

  const isUser = m.role === "user";
  const isAssistant = m.role === "assistant";

  const show = isUser || isAssistant;
  if (!show) return null;

  return (
    <View
      style={{ gap: 16, flexDirection: "row", width: "100%", marginBottom: 16 }}
    >
      <View style={{ width: 32 }}>
        {isUser && <UserIcon />}
        {isAssistant && <AssistantIcon />}
      </View>
      <View style={{ flex: 1 }}>
        {(typeof m.content === "string"
          ? [{ type: "text", text: m.content }]
          : m.content
        ).map((c, i) => {
          if (c.type === "text" && c.text) {
            return (
              <Text
                key={i}
                style={{
                  color: colors.text,
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
            return <Image key={i} source={{ uri: c.image_url }} />;
          }
          return null;
        })}
        {m.tool_calls?.map((tc, i) => (
          <ToolCall key={i} toolCall={tc} />
        ))}
      </View>
    </View>
  );
}
