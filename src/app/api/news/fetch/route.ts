import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { collectArticles } from "@/lib/rss/collect";

export const maxDuration = 30;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await collectArticles();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[news/fetch] 실패:", error);
    return NextResponse.json(
      { error: "뉴스를 가져오지 못했어요." },
      { status: 500 },
    );
  }
}
