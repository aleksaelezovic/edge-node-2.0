import { createContext, useContext } from "react";

import { ChatMessage, ToolCall } from "@/shared/chat";

const ChatContext = createContext<{
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (message: ChatMessage) => void;
  callTool: (tc: ToolCall) => void;
}>({
  messages: [],
  isGenerating: false,
  sendMessage: () => {},
  callTool: () => {},
});

export const useChatContext = () => useContext(ChatContext);

export default ChatContext;
