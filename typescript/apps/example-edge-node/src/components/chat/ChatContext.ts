import { createContext, useContext } from "react";

import { ChatMessage, ToolCall, ToolsInfoMap } from "@/shared/chat";

const ChatContext = createContext<{
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (message: ChatMessage) => void;
  toolsInfo: ToolsInfoMap;
  callTool: (tc: ToolCall) => void;
}>({
  messages: [],
  isGenerating: false,
  sendMessage: () => {},
  toolsInfo: {},
  callTool: () => {},
});

export const useChatContext = () => useContext(ChatContext);

export default ChatContext;
