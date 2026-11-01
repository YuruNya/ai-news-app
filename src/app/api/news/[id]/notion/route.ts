import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { saveArticleToNotion } from "@/lib/notion/save-article";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/news/[id]/notion">,
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "잘못된 기사 ID예요." }, { status: 400 });
  }

  const [row] = await db
    .select({
      titleEn: articles.titleEn,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      url: articles.url,
      publishedAt: articles.publishedAt,
      notionPageId: articles.notionPageId,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.id, id));

  if (!row) {
    return NextResponse.json({ error: "기사를 찾을 수 없어요." }, { status: 404 });
  }
  // 중복 저장 방지: 이미 저장된 기사는 그대로 성공으로 돌려준다.
  if (row.notionPageId) {
    return NextResponse.json({ notionPageId: row.notionPageId });
  }

  try {
    const notionPageId = await saveArticleToNotion(row);
    await db
      .update(articles)
      .set({ notionPageId })
      .where(and(eq(articles.id, id), isNull(articles.notionPageId)));
    return NextResponse.json({ notionPageId });
  } catch (error) {
    console.error("[news/notion] 실패:", error);
    return NextResponse.json(
      { error: "Notion에 저장하지 못했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
