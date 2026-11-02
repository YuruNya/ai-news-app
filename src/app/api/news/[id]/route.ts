import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/news/[id]">,
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

  try {
    const deleted = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning({ id: articles.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "기사를 찾을 수 없어요." }, { status: 404 });
    }
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[news/delete] 실패:", error);
    return NextResponse.json(
      { error: "기사를 삭제하지 못했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
