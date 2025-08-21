import { View, ViewProps } from "react-native";

import UserIcon from "./ChatMessage/UserIcon";
import AssistantIcon from "./ChatMessage/AssistantIcon";
import ChatMessageContent from "./ChatMessage/ChatMessageContent";
import ChatMessageToolCall from "./ChatMessage/ChatMessageToolCall";
import ChatMessageActions from "./ChatMessage/ChatMessageActions";
import ChatMessageSourceKAs from "./ChatMessage/SourceKAs";

export default function ChatMessage({
  icon,
  ...props
}: ViewProps & {
  icon: "user" | "assistant";
}) {
  return (
    <View
      style={{ gap: 16, flexDirection: "row", width: "100%", marginBottom: 16 }}
    >
      <View style={{ width: 32 }}>
        {icon === "user" && <UserIcon />}
        {icon === "assistant" && <AssistantIcon />}
      </View>
      <View {...props} style={[{ flex: 1 }, props.style]} />
    </View>
  );
}

ChatMessage.Content = ChatMessageContent;
ChatMessage.ToolCall = ChatMessageToolCall;
ChatMessage.Actions = ChatMessageActions;
ChatMessage.SourceKAs = ChatMessageSourceKAs;
