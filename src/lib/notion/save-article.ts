import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export type NotionArticle = {
  titleKo: string | null;
  titleEn: string;
  summaryKo: string | null;
  url: string;
  categoryName: string | null;
  publishedAt: Date | null;
};

// Notion rich_text 한 덩어리는 2000자까지만 허용한다.
const RICH_TEXT_LIMIT = 2000;

/**
 * 공식 @notionhq/notion-mcp-server를 stdio 자식 프로세스로 띄워
 * 고정 DB에 페이지를 만들고 새 페이지 ID를 돌려준다.
 */
export async function saveArticleToNotion(
  article: NotionArticle,
): Promise<string> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID가 설정되지 않았어요.");
  }

  const properties: Record<string, unknown> = {
    제목: {
      title: [{ text: { content: article.titleKo ?? article.titleEn } }],
    },
    URL: { url: article.url },
  };
  if (article.summaryKo) {
    properties["요약"] = {
      rich_text: [
        { text: { content: article.summaryKo.slice(0, RICH_TEXT_LIMIT) } },
      ],
    };
  }
  if (article.categoryName) {
    properties["카테고리"] = { select: { name: article.categoryName } };
  }
  if (article.publishedAt) {
    properties["발행일"] = {
      date: { start: article.publishedAt.toISOString() },
    };
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(
        process.cwd(),
        "node_modules/@notionhq/notion-mcp-server/bin/cli.mjs",
      ),
    ],
    env: {
      PATH: process.env.PATH ?? "",
      SystemRoot: process.env.SystemRoot ?? "",
      NOTION_TOKEN: token,
    },
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "API-post-page",
      arguments: {
        parent: { type: "database_id", database_id: databaseId },
        properties,
      },
    });

    const text = (
      result.content as { type: string; text?: string }[] | undefined
    )
      ?.map((c) => (c.type === "text" ? c.text : ""))
      .join("");
    if (result.isError) {
      throw new Error(`Notion 페이지 생성 실패: ${text?.slice(0, 300)}`);
    }

    const page = JSON.parse(text ?? "{}") as { id?: string; object?: string };
    if (!page.id || page.object === "error") {
      throw new Error(`Notion 응답이 올바르지 않아요: ${text?.slice(0, 300)}`);
    }
    return page.id;
  } finally {
    await client.close().catch(() => {});
  }
}
