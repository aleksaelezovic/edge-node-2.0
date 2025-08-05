import { View, ViewProps } from "react-native";

import UserIcon from "./UserIcon";
import AssistantIcon from "./AssistantIcon";
import ChatMessageContent from "./ChatMessageContent";
import ChatMessageToolCall from "./ChatMessageToolCall";
import ChatMessageActions from "./ChatMessageActions";

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
