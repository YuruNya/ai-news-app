import {
  CLAUDE_MODEL,
  extractJson,
  formatCategories,
  getClaude,
  type CategoryInfo,
} from "./client";

const SYSTEM = `당신은 AI 뉴스 분류기입니다. 한국어 제목과 요약을 보고 아래 카테고리 목록 중 가장 알맞은 이름 하나를 고릅니다. 어느 것에도 맞지 않으면 "기타"를 고릅니다.`;

// 번역·요약은 다시 하지 않고 카테고리만 정한다. (재분류용)
export async function classifyArticle(
  input: { titleKo: string; summaryKo: string | null },
  categories: CategoryInfo[],
): Promise<string> {
  const message = await getClaude().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 256,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            category: { type: "string", enum: categories.map((c) => c.name) },
          },
          required: ["category"],
          additionalProperties: false,
        },
      },
    },
    system: [
      {
        type: "text",
        text: `${SYSTEM}\n\n카테고리 목록:\n${formatCategories(categories)}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `제목: ${input.titleKo}\n\n요약: ${input.summaryKo ?? "(없음)"}`,
      },
    ],
  });

  return extractJson<{ category: string }>(message).category;
}
