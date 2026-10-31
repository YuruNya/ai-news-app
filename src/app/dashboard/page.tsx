import type { Metadata } from "next";
import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { CategoryBar } from "@/components/category-bar";
import { NewsCard } from "@/components/news-card";

export const metadata: Metadata = {
  title: "대시보드 · AI 뉴스 수집기",
};

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <div className="min-h-screen flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-bold tracking-tight">AI 뉴스 수집기</h1>
          {/* 프로필 사진·이름을 보여주고, 누르면 계정 관리와 로그아웃 메뉴가 열린다. */}
          <UserButton showName />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  // 로그인 게이트는 클라이언트에서 동작하므로, 데이터는 서버에서도 인증을 확인한 뒤에만 조회한다.
  const { userId } = await auth();
  if (!userId) return null;

  const { category } = await searchParams;
  const param = typeof category === "string" ? category : undefined;

  const categoryList = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(categories.id);

  const selectedCategory = categoryList.find((c) => String(c.id) === param);
  const selected =
    param === "uncategorized"
      ? "uncategorized"
      : selectedCategory
        ? String(selectedCategory.id)
        : "all";

  const filter =
    selected === "uncategorized"
      ? isNull(articles.categoryId)
      : selectedCategory
        ? eq(articles.categoryId, selectedCategory.id)
        : undefined;

  const rows = await db
    .select({
      id: articles.id,
      source: articles.source,
      url: articles.url,
      titleEn: articles.titleEn,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      notionPageId: articles.notionPageId,
      publishedAt: articles.publishedAt,
      fetchedAt: articles.fetchedAt,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(filter)
    // 발행일이 없는 기사는 수집 시각으로 대신해 최신순 정렬
    .orderBy(
      desc(sql`coalesce(${articles.publishedAt}, ${articles.fetchedAt})`),
      desc(articles.id),
    )
    .limit(60);

  return (
    <>
      <CategoryBar categories={categoryList} selected={selected} />
      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          {selected === "all"
            ? "아직 기사가 없어요."
            : "이 카테고리에는 기사가 없어요."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <NewsCard key={row.id} article={row} />
          ))}
        </div>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </>
  );
}
