import type {
  AIMessageChunk,
  MessageFieldWithRole,
} from "@langchain/core/messages";
import type {
  BaseFunctionCallOptions,
  ToolDefinition,
} from "@langchain/core/language_models/base";

export type { ToolDefinition };

export type CompletionRequest = {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  options?: BaseFunctionCallOptions;
};

export type ChatMessage = MessageFieldWithRole & {
  content: AIMessageChunk["content"];
  tool_calls?: AIMessageChunk["tool_calls"];
};
