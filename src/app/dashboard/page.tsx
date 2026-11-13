import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { CategoryBar } from "@/components/category-bar";
import { FetchNewsButton } from "@/components/fetch-news-button";
import { Footer } from "@/components/footer";
import { NewsCard } from "@/components/news-card";
import { NewsCardSkeletonGrid } from "@/components/news-card-skeleton";
import { NewsFetchingProvider, NewsListArea } from "@/components/news-fetching";
import { NewsCountBadge } from "@/components/news-count-badge";
import { Pagination } from "@/components/pagination";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";

const PAGE_SIZE = 9;

export const metadata: Metadata = {
  title: "대시보드 · AI 뉴스 수집기",
};

export default function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return (
    <NewsFetchingProvider>
      <div className="flex min-h-screen flex-1 flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <h1 className="text-lg font-bold tracking-tight">
              {/* 검색어·카테고리·페이지를 모두 지우고 처음 화면으로 돌아간다. */}
              <Link
                href="/dashboard"
                className="rounded transition hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:text-indigo-400"
              >
                AI 뉴스 수집기
              </Link>
            </h1>
            {/* 프로필 사진·이름을 보여주고, 누르면 계정 관리와 로그아웃 메뉴가 열린다. */}
            <div className="flex items-center gap-3">
              <FetchNewsButton />
              <UserButton showName />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent searchParams={searchParams} />
          </Suspense>
        </main>
        <Footer />
      </div>
    </NewsFetchingProvider>
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

  const { category, page: pageParam, q } = await searchParams;
  const param = typeof category === "string" ? category : undefined;
  const keyword = typeof q === "string" ? q.trim() : "";

  const [categoryList, totalArticles] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(categories.id),
    // 상단 배지용 전체 기사 수 (필터·검색 미적용)
    db.$count(articles),
  ]);

  const selectedCategory = categoryList.find((c) => String(c.id) === param);
  const selected =
    param === "uncategorized"
      ? "uncategorized"
      : selectedCategory
        ? String(selectedCategory.id)
        : "all";

  const categoryFilter =
    selected === "uncategorized"
      ? isNull(articles.categoryId)
      : selectedCategory
        ? eq(articles.categoryId, selectedCategory.id)
        : undefined;

  // 검색어의 %, _, \는 LIKE 패턴이 아닌 글자 그대로 찾는다.
  const pattern = `%${keyword.replace(/[\\%_]/g, "\\$&")}%`;
  const keywordFilter = keyword
    ? or(
        ilike(articles.titleKo, pattern),
        ilike(articles.summaryKo, pattern),
        ilike(articles.titleEn, pattern),
      )
    : undefined;

  const filter = and(categoryFilter, keywordFilter);

  const total = await db.$count(articles, filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number.parseInt(
    typeof pageParam === "string" ? pageParam : "",
    10,
  );
  // 잘못된 값이나 범위를 벗어난 값은 가장 가까운 유효 페이지로 맞춘다.
  const page = Math.min(
    Math.max(Number.isNaN(requested) ? 1 : requested, 1),
    totalPages,
  );

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams();
    if (selected !== "all") qs.set("category", selected);
    if (keyword) qs.set("q", keyword);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

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
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return (
    <>
      <NewsCountBadge count={totalArticles} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <CategoryBar
          categories={categoryList}
          selected={selected}
          keyword={keyword}
        />
        <SearchBar keyword={keyword} selected={selected} />
      </div>
      <NewsListArea>
        {rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            {keyword
              ? `'${keyword}'에 해당하는 기사가 없어요.`
              : selected === "all"
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
      </NewsListArea>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="h-8 animate-pulse rounded-lg bg-slate-200 sm:w-72 dark:bg-slate-800" />
      </div>
      <NewsCardSkeletonGrid />
    </>
  );
}
