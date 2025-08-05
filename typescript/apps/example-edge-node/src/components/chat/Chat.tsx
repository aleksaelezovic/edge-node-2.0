import type { ContextType, PropsWithChildren } from "react";

import ChatContext from "./ChatContext";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatMessage from "./ChatMessage";
import ChatThinking from "./ChatThinking";

export default function Chat(
  props: PropsWithChildren<{
    context: ContextType<typeof ChatContext>;
  }>,
) {
  return (
    <ChatContext.Provider value={props.context}>
      {props.children}
    </ChatContext.Provider>
  );
}

Chat.Input = ChatInput;
Chat.Messages = ChatMessages;
Chat.Message = ChatMessage;
Chat.Thinking = ChatThinking;
