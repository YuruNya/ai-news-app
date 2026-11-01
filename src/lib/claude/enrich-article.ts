import {
  CLAUDE_MODEL,
  extractJson,
  formatCategories,
  getClaude,
  type CategoryInfo,
} from "./client";

export type EnrichInput = {
  titleEn: string;
  /** RSS 본문 발췌. 없으면 제목만으로 요약한다. */
  snippet?: string | null;
};

export type EnrichResult = {
  titleKo: string;
  summaryKo: string;
  /** 카테고리 이름 (전달한 목록 중 하나) */
  category: string;
};

const SYSTEM = `당신은 AI 뉴스 편집자입니다. 영어 기사의 제목과 본문 발췌를 받아 다음을 수행합니다.
1. titleKo: 제목을 자연스러운 한국어로 번역합니다. 제품명, 회사명, 사람 이름 같은 고유명사는 원문 표기를 유지합니다.
2. summaryKo: 핵심을 한국어 2~3문장으로 요약합니다. 본문 발췌에 없는 내용은 추측하지 않습니다.
3. category: 아래 카테고리 목록 중 가장 알맞은 이름 하나를 고릅니다. 어느 것에도 맞지 않으면 "기타"를 고릅니다.`;

export async function enrichArticle(
  input: EnrichInput,
  categories: CategoryInfo[],
): Promise<EnrichResult> {
  const names = categories.map((c) => c.name);

  const message = await getClaude().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    // 단순 작업이라 낮은 effort로 충분하다.
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            titleKo: { type: "string" },
            summaryKo: { type: "string" },
            category: { type: "string", enum: names },
          },
          required: ["titleKo", "summaryKo", "category"],
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
        content: `제목: ${input.titleEn}\n\n본문 발췌:\n${input.snippet?.trim() || "(없음)"}`,
      },
    ],
  });

  const result = extractJson<EnrichResult>(message);
  if (!result.titleKo?.trim() || !result.summaryKo?.trim()) {
    throw new Error("번역 또는 요약이 비어 있어요.");
  }
  return result;
}
