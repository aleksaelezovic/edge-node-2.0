import { processCompletionRequest } from "@/shared/chat";

export function POST(req: Request) {
  return processCompletionRequest(req);
}
