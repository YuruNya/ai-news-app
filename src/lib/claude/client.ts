import Anthropic from "@anthropic-ai/sdk";

// 서버 전용. ANTHROPIC_API_KEY는 NEXT_PUBLIC_ 접두사가 없어 클라이언트에 노출되지 않는다.
let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았어요.");
  }
  client ??= new Anthropic();
  return client;
}

// 번역·요약·분류는 단순 작업이라 저비용 모델을 기본으로 쓴다. (PRD §13)
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5";

export type CategoryInfo = { name: string; description: string };

export function formatCategories(categories: CategoryInfo[]): string {
  return categories
    .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`)
    .join("\n");
}

// output_config.format(JSON schema)으로 받은 응답에서 JSON을 꺼낸다.
export function extractJson<T>(message: Anthropic.Message): T {
  if (message.stop_reason === "refusal") {
    throw new Error("Claude가 요청을 거절했어요.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("응답이 max_tokens에서 잘렸어요.");
  }
  const block = message.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!block) throw new Error("응답에 텍스트가 없어요.");
  return JSON.parse(block.text) as T;
}
