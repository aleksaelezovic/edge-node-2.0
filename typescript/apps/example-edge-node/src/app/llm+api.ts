import { ChatMessage, CompletionRequest } from "@/shared/chat";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

export async function POST(request: Request) {
  const body: CompletionRequest = await request.json();
  const res = await llm.invoke(body.messages, {
    ...body.options,
    tools: body.tools,
  });
  return Response.json({
    role: "assistant",
    content: res.content,
    tool_calls: res.tool_calls,
  } satisfies ChatMessage);
}
