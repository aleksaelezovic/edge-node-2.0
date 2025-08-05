import type { PropsWithChildren } from "react";

import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatMessage from "./ChatMessage";
import ChatThinking from "./ChatThinking";

export default function Chat(props: PropsWithChildren) {
  return <>{props.children}</>;
}

Chat.Input = ChatInput;
Chat.Messages = ChatMessages;
Chat.Message = ChatMessage;
Chat.Thinking = ChatThinking;
